import express from "express";
import {
  createPokemonBasedOnImage,
  createPokemonBasedOnImageDescription,
  createPokedexBasedOnImage,
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
 * /api/openia/create-pokemon:
 *   post:
 *     summary: Create a Pokemon based on an image
 *     tags: [OpenAI]
 *     description: Generates a Pokemon character based on the provided image
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
 *                 description: Image file to generate Pokemon from
 *     responses:
 *       200:
 *         description: Pokemon generated successfully
 *       400:
 *         description: Invalid image format or missing image
 *       500:
 *         description: Server error
 */
router.post(
  "/create-pokemon",
  // isAuthenticated,
  upload.single("image"),
  createPokemonBasedOnImage
);

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
 *               - imageUrl
 *             properties:
 *               imageUrl:
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

export default router;
