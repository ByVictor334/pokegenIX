import express from "express";
import { createPokemon } from "../Controllers/OpenIaController";
import isAuthenticated from "../Middlewares/AuthMiddleware";
import upload from "../Middlewares/UploadMiddleware";

const router = express.Router();

router.post(
  "/create-pokemon",
  isAuthenticated,
  upload.single("image"),
  createPokemon
);

export default router;
