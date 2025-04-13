import { Request, Response } from "express";
import OpenAI from "openai";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../config/firebase";
import fs from "fs";
import path from "path";
import sharp from "sharp";
import fetch from "node-fetch";
import { PokemonModel } from "../Models/PokemonModel";
import { UserModel } from "../Models/UserModel";

const POKEMON_TYPES = [
  { type: "normal", color: "#A8A878" },
  { type: "fire", color: "#F08030" },
  { type: "water", color: "#6890F0" },
  { type: "electric", color: "#F8D030" },
  { type: "grass", color: "#78C850" },
  { type: "ice", color: "#98D8D8" },
  { type: "fighting", color: "#C03028" },
  { type: "poison", color: "#A040A0" },
  { type: "ground", color: "#E0C068" },
  { type: "flying", color: "#A890F0" },
  { type: "psychic", color: "#F85888" },
  { type: "bug", color: "#A8B820" },
  { type: "rock", color: "#B8A038" },
  { type: "ghost", color: "#705898" },
  { type: "dragon", color: "#7038F8" },
  { type: "dark", color: "#705848" },
  { type: "steel", color: "#B8B8D0" },
  { type: "fairy", color: "#EE99AC" },
];

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

async function getPrompt(image: string) {
  const prompt = `Analyze the image and identify the main object. Focus exclusively on its physical characteristics: texture, color, and shape. Ignore background elements or context.
Return a concise description in English, formatted as structured JSON like this:
{
  "object": "name or type of object, focus on only one object and add a single and then the object name (e.g., a single smooth, a single rough, a single glossy, a single matte, a single fuzzy slipper)",
  "color": "primary and secondary colors",
  "shape": "flat and rounded"
}
The output must be under 1000 characters total. Do not include any background, lighting, or artistic elements—only the object's physical properties.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          {
            type: "image_url",
            image_url: {
              url: image,
            },
          },
        ],
      },
    ],
    max_tokens: 500,
  });

  const description = response.choices[0].message.content;
  return description;
}

async function getPokemonImage(description: string) {
  const prompt = `
  Create a single, original collectible creature inspired by the following description: ${description}. The creature must be cute, stylized, and have a simple yet iconic design. It should feature bright, appealing colors, large expressive eyes, and a friendly but battle-ready appearance. Its form should reflect the shape, texture, and color of the description in a creative and playful way. Render the creature in full-body, with clean lines and a digital art style reminiscent of Nintendo or creature-collecting games. centered and isolated on a pure white background, like a passport photo or product listing on Amazon. No shadows, no textures, no gradients, no reflections, no floor, no walls, no text, no logos, no props. The background must be flat, blank, and perfectly white.
  `;
  const pokemon = await openai.images.generate({
    model: "dall-e-3",
    prompt: prompt,
    n: 1,
    size: "1024x1024",
  });
  return pokemon.data[0].url;

  // return "https://firebasestorage.googleapis.com/v0/b/pokegenix-a40c3.firebasestorage.app/o/pokedex%2FChatGPT%20Image%20Apr%2010%2C%202025%2C%2012_17_45%20AM.png?alt=media&token=cb36e308-ad60-4415-a725-51182c4a8669";
}

async function getPokedexBasedOnImage(image: string) {
  const prompt = `
  Based on the provided image, create a detailed JSON file describing an original collectible creature. Do not include any text or labels in the image. The JSON should include:
{
  "name": "UniqueCreatureName",
  "types": "[Two elemental with the structure: two of the next option: ${POKEMON_TYPES}]",
  "description": "A short biography of the creature, including its personality, behavior, and environment.",
  "abilities": ["List of special abilities"],
  "base_stats": {
    "health": Integer (0-255),
    "attack": Integer (0-255),
    "defense": Integer (0-255),
    "speed": Integer (0-255),
    "intelligence": Integer (0-255),
    "special": Integer (0-255)
  },
  "rarity": "Common | Uncommon | Rare | Epic | Legendary",
  "habitat": "Natural habitat or biome",
  "behavior": "Typical behavior or social patterns",
  "preferred_items": ["List of items or foods it likes"],
  "height": "Height in meters",
  "weight": "Weight in kilograms",
}
Only output the JSON structure. Don't include explanations or comments. Format the response cleanly and correctly. 
Do not wrap in markdown or code blocks. Do not include any explanation or labels. Only output raw JSON`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          {
            type: "image_url",
            image_url: {
              url: image,
            },
          },
        ],
      },
    ],
    max_tokens: 500,
  });

  const description = response.choices[0].message.content;
  return description;
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
      type: pokedexJson.type,
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
