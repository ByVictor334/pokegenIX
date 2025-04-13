import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import { getNextSequenceValue } from "./CounterModel";

const baseStatsSchema = new mongoose.Schema({
  health: { type: Number, required: true },
  attack: { type: Number, required: true },
  defense: { type: Number, required: true },
  speed: { type: Number, required: true },
  intelligence: { type: Number, required: true },
  special: { type: Number, required: true },
});

const baseTypeSchema = new mongoose.Schema({
  type: { type: String, required: true },
  color: { type: String, required: true },
});

const pokemonSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    default: () => uuidv4(),
  },
  pokemon_id: {
    type: Number,
    unique: true,
  },
  owner: {
    type: String,
    ref: "User",
    required: true,
  },
  name: { type: String, required: true },
  type: [baseTypeSchema],
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
  is_favorite: { type: Boolean, required: true, default: false },
  is_public: { type: Boolean, required: true, default: false },
});

// Pre-save middleware to auto-increment pokemon_id
pokemonSchema.pre("save", async function (next) {
  if (this.isNew) {
    this.pokemon_id = await getNextSequenceValue("pokemon_id");
  }
  next();
});

export const PokemonModel = mongoose.model("Pokemon", pokemonSchema);
