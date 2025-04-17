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

const MODEL = "gpt-4o-mini";
const MODEL_DALLE = "dall-e-3";
const SIZE_DALLE = "1024x1024";

const loadPrompt = (description: {
  object: string;
  body_shape: string;
  texture: string;
  color_primary: string;
  color_secondary: string;
  background: string;
  unique_object: boolean;
}) => {
  const PROMPT_POKEMON_ROGER = `Design a single cute and collectible fantasy creature inspired by Japanese creature design based in the following description: ${JSON.stringify(
    description
  )}. The creature has expressive eyes and stands in a dynamic pose. Style should resemble anime or handheld monster-collecting games.`;

  const PROMPT_POKEMON_VICTOR = `Create a full-body image of an original, collectible mythical creature with the shape and texture of a ${description.body_shape} ${description.object}. The creature should have a cute and iconic design in a cartoony style. Its body is primarily ${description.color_primary} with ${description.color_secondary} accents, reflecting the color of a classic ${description.object}. The creature has large, expressive eyes and a friendly yet battle-ready expression. Its form is sleek, simple, and playful, with limbs and possibly wings that integrate smoothly into the overall design. The surface of its body should be ${description.texture} and smooth, subtly suggesting ${description.object} material without literal textures. Rendered in clean digital art with bold outlines, flat colors, and minimal shading. The creature is centered and isolated on a pure white background, like a character from a game card or product listing.`;

  return PROMPT_POKEMON_ROGER;
  return PROMPT_POKEMON_VICTOR;
};

export async function getPrompt(image: string) {
  const prompt = `Analyze the image and identify the main object. Focus exclusively on its physical characteristics: texture, color, and shape. Ignore background elements or context.
Return a concise description in English, formatted as structured JSON like this:
{
  "object": "name or type of object, focus on only one object and add a single and then the object name (e.g., a single smooth, a single rough, a single glossy, a single matte, a single fuzzy slipper)",
  "body_shape": "shape of the main object",
  "texture": "fuzzy",
  "color_primary": "main color of the object",
  "color_secondary": "secondary color of the object",
  "background": "ALLWAYS pure white",
  "unique_object": true
}
Do not include the word 'json' or any extra formatting. Just return the JSON object.
The output must be under 1000 characters.`;

  const response = await openai.chat.completions.create({
    model: MODEL,
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
  console.log(
    "%c------------------------- srcUtilsOpenIAUtils.ts:62 ",
    "background: green; color: white; display: block;"
  );
  console.log(
    "%csrcUtilsOpenIAUtils.ts:62 description",
    "color: white; background-color: #007acc;",
    description
  );
  console.log(
    "%c------------------------- srcUtilsOpenIAUtils.ts:62 ",
    "background: green; color: white; display: block;"
  );
  return description;
}

export async function getPokemonImage(description: string) {
  const descriptionObject = JSON.parse(description);
  const prompt = loadPrompt(descriptionObject);
  console.log(
    "%csrcUtilsOpenIAUtils.ts:69 prompt",
    "color: white; background-color: #007acc;",
    prompt
  );
  const pokemon = await openai.images.generate({
    model: MODEL_DALLE,
    prompt: prompt,
    n: 1,
    size: SIZE_DALLE,
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
  const response = await openai.chat.completions.create({
    model: MODEL,
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
