import express from "express";
import {
  loginWithGoogle,
  loginWithGoogleCallback,
  loginWithGoogleCallbackMobile,
  userProfile,
  getVerifyGoogleIdToken,
} from "../Controllers/AuthController";
import isAuthenticated from "../Middlewares/AuthMiddleware";
const router = express.Router();

router.get("/login/google", loginWithGoogle);
router.get("/login/google/callback", loginWithGoogleCallback);
router.post("/login/google/verify-token", getVerifyGoogleIdToken);
router.get("/login/google/callback/mobile", loginWithGoogleCallbackMobile);

router.get("/profile", isAuthenticated, userProfile);
export default router;
