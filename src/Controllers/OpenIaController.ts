import { Request, Response } from "express";
import OpenAI from "openai";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../config/firebase";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const createPokemon = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file uploaded" });
    }

    // Upload image to Firebase Storage
    const timestamp = Date.now();
    const fileName = `pokemon_${timestamp}_${req.file.originalname}`;
    const storageRef = ref(storage, `pokemon/${fileName}`);

    await uploadBytes(storageRef, req.file.buffer);
    const imageUrl = await getDownloadURL(storageRef);

    const prompt = `Based on this image ${imageUrl}, create a new pokemon and give me an image and a backstory`;

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
    });

    res.json({
      success: true,
      originalImage: imageUrl,
      generatedImage: response.data[0],
    });
  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).json({
      success: false,
      error: "Error processing request",
    });
  }
};
