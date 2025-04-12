import express from "express";
import { PokemonController } from "../Controllers/PokemonController";
import isAuthenticated from "../Middlewares/AuthMiddleware";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Pokemon
 *   description: Pokemon management endpoints
 */

/**
 * @swagger
 * /api/pokemon/{id}/favorite:
 *   patch:
 *     summary: Toggle favorite status of a Pokemon
 *     tags: [Pokemon]
 *     description: Marks or unmarks a Pokemon as favorite for the authenticated user
 *     security:
 *       - sessionAuth: []
 *       - idTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the Pokemon to toggle favorite status
 *     responses:
 *       200:
 *         description: Pokemon favorite status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 pokemon:
 *                   $ref: '#/components/schemas/Pokemon'
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Pokemon not found or user doesn't have access
 *       500:
 *         description: Server error
 */

router.patch(
  "/:id/favorite",
  isAuthenticated,
  PokemonController.markAsFavorite
);

/**
 * @swagger
 * /api/pokemon/{id}/public:
 *   patch:
 *     summary: Toggle public status of a Pokemon
 *     tags: [Pokemon]
 *     description: Marks or unmarks a Pokemon as public for the authenticated user
 *     security:
 *       - sessionAuth: []
 *       - idTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the Pokemon to toggle public status
 *     responses:
 *       200:
 *         description: Pokemon public status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 pokemon:
 *                   $ref: '#/components/schemas/Pokemon'
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Pokemon not found or user doesn't have access
 *       500:
 *         description: Server error
 */
router.patch("/:id/public", isAuthenticated, PokemonController.markAsPublic);

export default router;
