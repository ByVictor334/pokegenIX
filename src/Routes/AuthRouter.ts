import express from "express";
import {
  loginWithGoogle,
  loginWithGoogleCallback,
  userProfile,
} from "../Controllers/AuthController";
import isAuthenticated from "../Middlewares/AuthMiddleware";
const router = express.Router();

router.get("/login/google", loginWithGoogle);
router.get("/login/google/callback", loginWithGoogleCallback);

router.get("/profile", isAuthenticated, userProfile);
export default router;
