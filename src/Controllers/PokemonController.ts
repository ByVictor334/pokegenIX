import { Request, Response } from "express";
import { PokemonModel } from "../Models/PokemonModel";

export class PokemonController {
  /**
   * Mark a Pokemon as favorite
   * @param req Request object containing Pokemon ID
   * @param res Response object
   */
  public static async markAsFavorite(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id; // Assuming user info is attached to request by auth middleware

      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const pokemon = await PokemonModel.findOne({ id, owner: userId });

      if (!pokemon) {
        res
          .status(404)
          .json({
            message:
              "Pokemon not found or you do not have permission to modify it",
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
  }

  /**
   * Mark a Pokemon as public
   * @param req Request object containing Pokemon ID
   * @param res Response object
   */
  public static async markAsPublic(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id; // Assuming user info is attached to request by auth middleware

      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const pokemon = await PokemonModel.findOne({ id, owner: userId });

      if (!pokemon) {
        res
          .status(404)
          .json({
            message:
              "Pokemon not found or you do not have permission to modify it",
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
  }
}
