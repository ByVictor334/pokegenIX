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

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

async function getPokemonImage(_description: string) {
  // const prompt = `
  // Create a single, original collectible creature inspired by the following description: ${description}. The creature must be cute, stylized, and have a simple yet iconic design. It should feature bright, appealing colors, large expressive eyes, and a friendly but battle-ready appearance. Its form should reflect the shape, texture, and color of the description in a creative and playful way. Render the creature in full-body, with clean lines and a digital art style reminiscent of Nintendo or creature-collecting games. The final image should show ONLY ONE creature, centered on a pure white background, and with no text.
  // `;
  // const pokemon = await openai.images.generate({
  //   model: "dall-e-3",
  //   prompt: prompt,
  //   n: 1,
  //   size: "1024x1024",
  // });
  // return pokemon.data[0].url;

  return "https://firebasestorage.googleapis.com/v0/b/pokegenix-a40c3.firebasestorage.app/o/pokedex%2FChatGPT%20Image%20Apr%2010%2C%202025%2C%2012_17_45%20AM.png?alt=media&token=cb36e308-ad60-4415-a725-51182c4a8669";
}

async function getPokedexBasedOnImage(image: string) {
  const prompt = `
  Based on the provided image, create a detailed JSON file describing an original collectible creature. Do not include any text or labels in the image. The JSON should include:
{
  "name": "UniqueCreatureName",
  "type": "Elemental type (e.g., Grass, Fire, Water, etc.)",
  "color": "Color of the type (e.g., Red, Blue, Yellow, etc.)",
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

export const createPokemonBasedOnImage = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No image file uploaded" });
      return;
    }

    // Upload image to Firebase Storage
    const timestamp = Date.now();
    const fileName = `pokemon_${timestamp}_${req.file.originalname}`;
    const storageRef = ref(storage, `pokemon/${fileName}`);

    await uploadBytes(storageRef, req.file.buffer);
    const imageUrl = await getDownloadURL(storageRef);

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

    const tempFilePath = path.join(tempDir, `processed_${fileName}.png`);
    fs.writeFileSync(tempFilePath, processedImageBuffer);

    // Create a mask image with transparent background
    const maskBuffer = await sharp({
      create: {
        width: 1024,
        height: 1024,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .png()
      .toBuffer();

    const maskFilePath = path.join(tempDir, `mask_${fileName}.png`);
    fs.writeFileSync(maskFilePath, maskBuffer);

    const prompt =
      "Transform this into a Pokemon character with vibrant colors and unique features while maintaining the original shape and style";

    const response = await openai.images.edit({
      image: fs.createReadStream(tempFilePath),
      prompt: prompt,
      n: 1,
      size: "1024x1024",
    });

    // Clean up temporary files
    fs.unlinkSync(tempFilePath);
    fs.unlinkSync(maskFilePath);

    res.json({
      success: true,
      originalImage: imageUrl,
      generatedImage: response.data[0].url,
    });
  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).json({
      success: false,
      error: `Error processing request: ${error.message}`,
    });
  }
};

export const createPokemonBasedOnImageDescription = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No image file uploaded" });
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
      description: description,
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

    const User = await UserModel.findById(req.body.owner);

    if (!User) {
      res.status(400).json({ error: "User not found" });
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
    let processedBuffer;
    try {
      processedBuffer = await sharp(imageBuffer)
        .png() // Ensure it's in PNG format
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
      owner: User._id,
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
