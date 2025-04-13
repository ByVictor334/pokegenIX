import { OpenAI } from "openai";

const POKEMON_TYPES = [
  '{ type: "normal", color: "#A8A878" } | ',
  '{ type: "fire", color: "#F08030" } | ',
  '{ type: "water", color: "#6890F0" } | ',
  '{ type: "electric", color: "#F8D030" } | ',
  '{ type: "grass", color: "#78C850" } | ',
  '{ type: "ice", color: "#98D8D8" } | ',
  '{ type: "fighting", color: "#C03028" } | ',
  '{ type: "poison", color: "#A040A0" } | ',
  '{ type: "ground", color: "#E0C068" } | ',
  '{ type: "flying", color: "#A890F0" } | ',
  '{ type: "psychic", color: "#F85888" } | ',
  '{ type: "bug", color: "#A8B820" } | ',
  '{ type: "rock", color: "#B8A038" } | ',
  '{ type: "ghost", color: "#705898" } | ',
  '{ type: "dragon", color: "#7038F8" } | ',
  '{ type: "dark", color: "#705848" } | ',
  '{ type: "steel", color: "#B8B8D0" } | ',
  '{ type: "fairy", color: "#EE99AC" }',
];

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
export async function getPrompt(image: string) {
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

export async function getPokemonImage(description: string) {
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

export async function getPokedexBasedOnImage(image: string) {
  const prompt = `
  Based on the provided image, create a detailed JSON file describing an original collectible creature. Do not include any text or labels in the image. The JSON should include:
{
  "name": "UniqueCreatureName",
  "types": "[List of two types from this options: ${POKEMON_TYPES}]",
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
  console.log(
    "%csrc/Utils/OpenIAUtils.ts:100 prompt",
    "color: white; background-color: #007acc;",
    prompt
  );
  // return;
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
