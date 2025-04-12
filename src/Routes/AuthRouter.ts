import express, { Request, Response } from "express";
import {
  loginWithGoogle,
  loginWithGoogleCallback,
  loginWithGoogleMobileCallback,
  logout,
  userProfile,
} from "../Controllers/AuthController";

import isAuthenticated from "../Middlewares/AuthMiddleware";
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication endpoints
 */

/**
 * @swagger
 * /api/auth/login/google:
 *   get:
 *     summary: Initiate Google OAuth login
 *     tags: [Authentication]
 *     description: Redirects to Google OAuth consent screen
 *     responses:
 *       302:
 *         description: Redirect to Google OAuth
 */
router.get("/login/google", loginWithGoogle);

/**
 * @swagger
 * /api/auth/login/google/callback:
 *   get:
 *     summary: Google OAuth callback
 *     tags: [Authentication]
 *     description: Handles the callback from Google OAuth
 *     responses:
 *       200:
 *         description: Successfully authenticated
 *       401:
 *         description: Authentication failed
 */
router.get("/login/google/callback", loginWithGoogleCallback);

/**
 * @swagger
 * /api/auth/login/google/mobile:
 *   post:
 *     summary: Mobile Google authentication
 *     tags: [Authentication]
 *     description: Authenticate mobile users with Google
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_token
 *             properties:
 *               id_token:
 *                 type: string
 *                 description: Google ID token from mobile client
 *     responses:
 *       200:
 *         description: Successfully authenticated
 *       401:
 *         description: Authentication failed
 */
router.post("/login/google/mobile", loginWithGoogleMobileCallback);

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [Authentication]
 *     description: Retrieve the authenticated user's profile
 *     security:
 *       - sessionAuth: []
 *       - idTokenAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *       401:
 *         description: Not authenticated
 */
router.get("/profile", isAuthenticated, userProfile);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Authentication]
 *     description: End the user's session
 *     security:
 *       - sessionAuth: []
 *       - idTokenAuth: []
 *     responses:
 *       200:
 *         description: Successfully logged out
 *       401:
 *         description: Not authenticated
 */
router.post("/logout", isAuthenticated, logout);

/**
 * @swagger
 * /api/auth/hello:
 *   get:
 *     summary: Test hello world endpoint
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Hello world message returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Hello World
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Internal Server Error
 */
router.get("/hello", (_req: Request, res: Response) => {
  res.status(200).json({ message: "Hello World" });
});

export default router;
