import express from "express";
import {
  createPokemonBasedOnImage,
  createPokemonBasedOnImageDescription,
} from "../Controllers/OpenIaController";
// import isAuthenticated from "../Middlewares/AuthMiddleware";
import upload from "../Middlewares/UploadMiddleware";

const router = express.Router();

router.post(
  "/create-pokemon",
  // isAuthenticated,
  upload.single("image"),
  createPokemonBasedOnImage
);

router.post(
  "/create-pokemon-description",
  upload.single("image"),
  createPokemonBasedOnImageDescription
);

export default router;
