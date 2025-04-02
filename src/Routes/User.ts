import express from "express";
import { register, logout, registerWithGoogle } from "../Controllers/User";

const router = express.Router();

router.post("/register", register);
router.post("/register/google", registerWithGoogle);
router.post("/logout", logout);

export default router;
