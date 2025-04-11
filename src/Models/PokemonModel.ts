import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const baseStatsSchema = new mongoose.Schema({
  health: { type: Number, required: true },
  attack: { type: Number, required: true },
  defense: { type: Number, required: true },
  speed: { type: Number, required: true },
  intelligence: { type: Number, required: true },
  special: { type: Number, required: true },
});

const pokemonSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    default: () => uuidv4(),
  },
  owner: {
    type: String,
    ref: "User",
    required: true,
  },
  name: { type: String, required: true },
  type: { type: String, required: true },
  color: { type: String, required: true },
  description: { type: String, required: true },
  abilities: [{ type: String, required: true }],
  base_stats: { type: baseStatsSchema, required: true },
  rarity: { type: String, required: true },
  habitat: { type: String, required: true },
  behavior: { type: String, required: true },
  preferred_items: [{ type: String, required: true }],
  height: { type: String, required: true },
  weight: { type: String, required: true },
  image: { type: String, required: true },
});

export const PokemonModel = mongoose.model("Pokemon", pokemonSchema);
