import { Request, Response } from "express";
import OpenAI from "openai";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../config/firebase";
import fs from "fs";
import path from "path";
import sharp from "sharp";

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

async function getPokemonImage(description: string) {
  const prompt = `
  Create a single, original collectible creature inspired by the following description: ${description}. The creature must be cute, stylized, and have a simple yet iconic design. It should feature bright, appealing colors, large expressive eyes, and a friendly but battle-ready appearance. Its form should reflect the shape, texture, and color of the description in a creative and playful way. Render the creature in full-body, with clean lines and a digital art style reminiscent of Nintendo or creature-collecting games. The final image should show ONLY ONE creature, centered on a pure white background, and with no text.
  `;
  const pokemon = await openai.images.generate({
    model: "dall-e-3",
    prompt: prompt,
    n: 1,
    size: "1024x1024",
  });
  return pokemon.data[0].url;
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
    const processedImageBuffer = await sharp(req.file.buffer)
      .resize(1024, 1024, { fit: "contain" }) // Resize to required dimensions
      .ensureAlpha() // Ensure image has alpha channel (RGBA)
      .png() // Convert to PNG
      .toBuffer();

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
      error: "Error processing request",
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
    const processedImageBuffer = await sharp(req.file.buffer)
      .resize(1024, 1024, { fit: "contain" }) // Resize to required dimensions
      .ensureAlpha() // Ensure image has alpha channel (RGBA)
      .png() // Convert to PNG
      .toBuffer();

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

    const description = await getPrompt(
      `data:image/png;base64,${processedImageBuffer.toString("base64")}`
    );
    console.log(description);

    if (!description) {
      res.status(400).json({ error: "No description provided" });
      return;
    }

    const pokemonImage = await getPokemonImage(description);

    res.json({
      success: true,
      originalImage: imageUrl,
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
