import express from "express";
import { PokemonController } from "../Controllers/PokemonController";
import isAuthenticated from "../Middlewares/AuthMiddleware";

const router = express.Router();

/**
 * @route PATCH /api/pokemon/:id/favorite
 * @desc Mark a Pokemon as favorite
 * @access Private
 */
router.patch(
  "/:id/favorite",
  isAuthenticated,
  PokemonController.markAsFavorite
);

/**
 * @route PATCH /api/pokemon/:id/public
 * @desc Mark a Pokemon as public
 * @access Private
 */
router.patch("/:id/public", isAuthenticated, PokemonController.markAsPublic);

export default router;
