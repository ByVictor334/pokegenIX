import express from "express";
import {
  createPokemonBasedOnImageDescription,
  createPokedexBasedOnImage,
  getUserPokemons,
  getPokemonDetails,
} from "../Controllers/OpenIaController";
import isAuthenticated from "../Middlewares/AuthMiddleware";
import upload from "../Middlewares/UploadMiddleware";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: OpenAI
 *   description: OpenAI integration endpoints
 */

/**
 * @swagger
 * /api/openia/create-pokemon-description:
 *   post:
 *     summary: Create a Pokemon description based on an image
 *     tags: [OpenAI]
 *     description: Generates a Pokemon description based on the provided image
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Image file to generate Pokemon description from
 *     responses:
 *       200:
 *         description: Pokemon description generated successfully
 *       400:
 *         description: Invalid image format or missing image
 *       500:
 *         description: Server error
 */
router.post(
  "/create-pokemon-description",
  upload.single("image"),
  createPokemonBasedOnImageDescription
);

/**
 * @swagger
 * /api/openia/create-pokedex:
 *   post:
 *     summary: Create a Pokedex entry based on an image
 *     tags: [OpenAI]
 *     description: Generates a complete Pokedex entry based on the provided image
 *     security:
 *       - sessionAuth: []
 *       - idTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - imageLink
 *             properties:
 *               imageLink:
 *                 type: string
 *                 description: URL of the image to generate Pokedex entry from
 *     responses:
 *       200:
 *         description: Pokedex entry generated successfully
 *       400:
 *         description: Invalid image URL or missing URL
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */
router.post("/create-pokedex", isAuthenticated, createPokedexBasedOnImage);

/**
 * @swagger
 * /api/openia/user-pokemons:
 *   post:
 *     summary: Get all pokemons for the authenticated user
 *     tags: [OpenAI]
 *     description: Retrieves all pokemons owned by the authenticated user
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
 *       400:
 *         description: User not found
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */
router.post("/user-pokemons", isAuthenticated, getUserPokemons);

/**
 * @swagger
 * /api/openia/pokemon/{pokemonId}:
 *   post:
 *     summary: Get details of a specific pokemon
 *     tags: [OpenAI]
 *     description: Retrieves detailed information about a specific pokemon owned by the authenticated user
 *     security:
 *       - sessionAuth: []
 *       - idTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: pokemonId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the pokemon to retrieve
 *     responses:
 *       200:
 *         description: Pokemon details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 pokemon:
 *                   $ref: '#/components/schemas/Pokemon'
 *       400:
 *         description: Pokemon ID is required or user not found
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Pokemon not found or user doesn't have access to it
 *       500:
 *         description: Server error
 */
router.post("/pokemon/:pokemonId", isAuthenticated, getPokemonDetails);

export default router;
