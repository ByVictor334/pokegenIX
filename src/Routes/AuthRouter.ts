import express from "express";
import {
  loginWithGoogle,
  loginWithGoogleCallback,
  loginWithGoogleMobileCallback,
  logout,
  userProfile,
} from "../Controllers/AuthController";

import isAuthenticated from "../Middlewares/AuthMiddleware";
const router = express.Router();

// Web authentication routes
router.get("/login/google", loginWithGoogle);
router.get("/login/google/callback", loginWithGoogleCallback);

// Mobile authentication routes
router.post("/login/google/mobile", loginWithGoogleMobileCallback);

// Protected routes
router.get("/profile", isAuthenticated, userProfile);
router.post("/logout", isAuthenticated, logout);

export default router;
