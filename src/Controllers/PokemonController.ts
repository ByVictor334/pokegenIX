import { Request, Response } from "express";
import { PokemonModel } from "../Models/PokemonModel";

/**
 * Get all pokemons for the authenticated user
 * @param req Request object
 * @param res Response object
 */
export const getUserPokemons = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    let pokemons;
    pokemons = await PokemonModel.find({ owner: req.user._id });

    if (pokemons.length === 0) {
      pokemons = await PokemonModel.find({ is_public: true });
    }

    res.json({
      success: true,
      pokemons: pokemons,
    });
  } catch (error) {
    console.error("Error fetching user pokemons:", error);
    res.status(500).json({
      success: false,
      error: `Error fetching user pokemons: ${error.message}`,
    });
  }
};
/**
 * Mark a Pokemon as favorite
 * @param req Request object containing Pokemon ID
 * @param res Response object
 */
export const markAsFavorite = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id; // Assuming user info is attached to request by auth middleware

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const pokemon = await PokemonModel.findOne({ id, owner: userId });

    if (!pokemon) {
      res.status(404).json({
        message: "Pokemon not found or you do not have permission to modify it",
      });
      return;
    }

    // Toggle the favorite status
    pokemon.is_favorite = !pokemon.is_favorite;
    await pokemon.save();

    res.status(200).json({
      message: `Pokemon ${
        pokemon.is_favorite ? "marked as" : "unmarked from"
      } favorite`,
      pokemon,
    });
  } catch (error) {
    console.error("Error marking Pokemon as favorite:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Mark a Pokemon as public
 * @param req Request object containing Pokemon ID
 * @param res Response object
 */
export const markAsPublic = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id; // Assuming user info is attached to request by auth middleware

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const pokemon = await PokemonModel.findOne({ id, owner: userId });

    if (!pokemon) {
      res.status(404).json({
        message: "Pokemon not found or you do not have permission to modify it",
      });
      return;
    }

    // Toggle the public status
    pokemon.is_public = !pokemon.is_public;
    await pokemon.save();

    res.status(200).json({
      message: `Pokemon ${
        pokemon.is_public ? "marked as" : "unmarked from"
      } public`,
      pokemon,
    });
  } catch (error) {
    console.error("Error marking Pokemon as public:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Get all favorite Pokemon for the current user
 * @param req Request object
 * @param res Response object
 */
export const getUserFavorites = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id; // Assuming user info is attached to request by auth middleware

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const favorites = await PokemonModel.find({
      owner: userId,
      is_favorite: true,
    });

    res.status(200).json({
      count: favorites.length,
      favorites,
    });
  } catch (error) {
    console.error("Error getting user favorites:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Get all public Pokemon from all users
 * @param req Request object
 * @param res Response object
 */
export const getPublicPokemons = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNumber = Number(page);
    const limitNumber = Number(limit);

    const skip = (pageNumber - 1) * limitNumber;

    const publicPokemons = await PokemonModel.find({ is_public: true })
      .skip(skip)
      .limit(limitNumber)
      .sort({ createdAt: -1 }); // Assuming there's a createdAt field, sort by newest first

    const total = await PokemonModel.countDocuments({ is_public: true });

    res.status(200).json({
      count: publicPokemons.length,
      total,
      page: pageNumber,
      totalPages: Math.ceil(total / limitNumber),
      pokemons: publicPokemons,
    });
  } catch (error) {
    console.error("Error getting public Pokemon:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
