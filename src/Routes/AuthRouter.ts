import express from "express";
import { loginWithGoogle } from "../Controllers/AuthController";

const router = express.Router();

router.post("/login/google", loginWithGoogle);

export default router;
