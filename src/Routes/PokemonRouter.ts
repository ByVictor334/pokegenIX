import express from "express";
import {
  markAsFavorite,
  markAsPublic,
  getUserFavorites,
  getPublicPokemons,
  getUserPokemons,
} from "../Controllers/PokemonController";
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
 * /api/pokemon/user-pokemons:
 *   post:
 *     summary: Get all pokemons for the authenticated user
 *     tags: [Pokemon]
 *     description: Retrieves all pokemons owned by the authenticated user, if no pokemons are owned, it will retrieve all public pokemons
 *     security:
 *       - sessionAuth: []
 *       - idTokenAuth: []
 *     responses:
 *       200:
 *         description: User pokemons retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 pokemons:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Pokemon'
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */
router.post("/user-pokemons", isAuthenticated, getUserPokemons);

/**
 * @swagger
 * /api/pokemon/favorites:
 *   get:
 *     summary: Get user's favorite Pokemon
 *     tags: [Pokemon]
 *     description: Retrieves all Pokemon marked as favorites by the authenticated user
 *     security:
 *       - sessionAuth: []
 *       - idTokenAuth: []
 *     responses:
 *       200:
 *         description: List of favorite Pokemon retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Pokemon'
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */
router.get("/favorites", isAuthenticated, getUserFavorites);

/**
 * @swagger
 * /api/pokemon/public:
 *   get:
 *     summary: Get public Pokemon
 *     tags: [Pokemon]
 *     description: Retrieves all Pokemon marked as public
 *     responses:
 *       200:
 *         description: List of public Pokemon retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Pokemon'
 *       500:
 *         description: Server error
 */
router.get("/public", getPublicPokemons);

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
router.patch("/:id/favorite", isAuthenticated, markAsFavorite);

/**
 * @swagger
 * /api/pokemon/{id}/public:
 *   patch:
 *     summary: Toggle public status of a Pokemon
 *     tags: [Pokemon]
 *     description: Marks or unmarks a Pokemon as public
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
router.patch("/:id/public", isAuthenticated, markAsPublic);

export default router;
