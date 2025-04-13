import { Request, Response } from "express";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../config/firebase";
import fs from "fs";
import path from "path";
import sharp from "sharp";
import fetch from "node-fetch";
import { PokemonModel } from "../Models/PokemonModel";
import { UserModel } from "../Models/UserModel";
import {
  getPrompt,
  getPokemonImage,
  getPokedexBasedOnImage,
} from "../Utils/OpenIAUtils";

declare module "express-session" {
  interface SessionData {
    token?: {
      id: string;
      access_token: string;
      id_token: string;
      refresh_token: string;
      expires_in: number;
      role: string;
    };
    user?: {
      name: string;
      email: string;
      picture: string;
      sub: string;
    };
  }
}

export const createPokemonBasedOnImageDescription = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No image file uploaded" });
      return;
    }

    // validate only 3 image generation per day
    const user = await UserModel.findOne({ email: req.user?.email });
    if (!user) {
      res.status(400).json({ error: "User not found" });
      return;
    }

    const now = new Date();
    const last = user.lastImageGeneration;

    const isNewDay = now.toDateString() !== last.toDateString();

    if (isNewDay) {
      // Nuevo día → reiniciar contador
      user.imageGenerationCount = 1;
      user.lastImageGeneration = now;
    } else {
      // Mismo día → incrementar contador
      user.imageGenerationCount++;
    }

    await user.save();

    if (user.imageGenerationCount > 3 && user.role !== "admin") {
      res.status(403).json({
        error:
          "You have reached the maximum limit of 3 image generations per day",
      });
      return;
    }

    // Create temp directory if it doesn't exist
    const tempDir = path.join(process.cwd(), "temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    // Process image with Sharp
    let processedImageBuffer;
    try {
      processedImageBuffer = await sharp(req.file.buffer)
        .resize(1024, 1024, { fit: "contain" }) // Resize to required dimensions
        .ensureAlpha() // Ensure image has alpha channel (RGBA)
        .png() // Convert to PNG
        .toBuffer();
    } catch (sharpError) {
      console.error("Sharp processing error:", sharpError);
      res.status(400).json({
        success: false,
        error:
          "Invalid image format. Please upload a valid image file (PNG, JPEG, GIF, or WebP).",
      });
      return;
    }

    const description = await getPrompt(
      `data:image/png;base64,${processedImageBuffer.toString("base64")}`
    );

    if (!description) {
      res.status(400).json({ error: "No description provided" });
      return;
    }

    const pokemonImage = await getPokemonImage(description);

    res.json({
      success: true,
      pokemon: pokemonImage,
    });
  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).json({
      success: false,
      error: `Error processing request: ${error.message}`,
    });
  }
};

export const createPokedexBasedOnImage = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.body.imageLink) {
      res.status(400).json({ error: "No image URL provided" });
      return;
    }

    const imageLink = req.body.imageLink;

    // Fetch the image from URL
    const imageResponse = await fetch(imageLink);
    if (!imageResponse.ok) {
      throw new Error("Failed to fetch image from URL");
    }
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

    // Upload image to Firebase Storage
    const timestamp = Date.now();
    const fileName = `pokedex_${timestamp}.png`;
    const storageRef = ref(storage, `pokedex/${fileName}`);

    // Process image with Sharp before uploading
    let processedBuffer: Buffer;

    processedBuffer = await sharp(imageBuffer)
      .png() // Ensure it's in PNG format
      .toBuffer();

    // Upload to Firebase Storage with metadata
    await uploadBytes(storageRef, processedBuffer, {
      contentType: "image/png",
      customMetadata: {
        originalName: fileName,
      },
    });

    const imageUrl = await getDownloadURL(storageRef);
    const pokedex = await getPokedexBasedOnImage(imageUrl);

    const pokedexJson = JSON.parse(pokedex as string);

    if (!pokedexJson || JSON.stringify(pokedexJson) === "{}") {
      res.status(400).json({ error: "No pokedex data provided" });
      return;
    }

    const pokemon = await PokemonModel.create({
      name: pokedexJson.name,
      types: pokedexJson.types,
      color: pokedexJson.color,
      description: pokedexJson.description,
      abilities: pokedexJson.abilities,
      base_stats: pokedexJson.base_stats,
      rarity: pokedexJson.rarity,
      habitat: pokedexJson.habitat,
      behavior: pokedexJson.behavior,
      preferred_items: pokedexJson.preferred_items,
      height: pokedexJson.height,
      weight: pokedexJson.weight,
      owner: req.user._id,
      image: imageUrl,
    });

    res.json({
      success: true,
      pokemon: pokemon,
    });
  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).json({
      success: false,
      error: `Error processing request: ${error.message}`,
    });
  }
};

export const getPokemonDetails = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { pokemonId } = req.params;

    if (!pokemonId) {
      res.status(400).json({ error: "Pokemon ID is required" });
      return;
    }

    const pokemon = await PokemonModel.findOne({
      _id: pokemonId,
      owner: req.user._id,
    });

    if (!pokemon) {
      res
        .status(404)
        .json({ error: "Pokemon not found or you don't have access to it" });
      return;
    }

    res.json({
      success: true,
      pokemon: pokemon,
    });
  } catch (error) {
    console.error("Error fetching pokemon details:", error);
    res.status(500).json({
      success: false,
      error: `Error fetching pokemon details: ${error.message}`,
    });
  }
};
