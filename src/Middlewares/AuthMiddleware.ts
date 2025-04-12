import { NextFunction, Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import { UserModel } from "../Models/UserModel";

// Extend Express Request type
declare module "express" {
  interface Request {
    device?: "web" | "mobile";
    user?: any; // Replace 'any' with your User type
  }
}

// Initialize Google OAuth client
const clientWeb = new OAuth2Client(process.env.CLIENT_ID);
const clientMobile = new OAuth2Client(process.env.CLIENT_ID_MOBILE);

async function isAuthenticated(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void | Response> {
  try {
    if (req.session.token && req.session.token.access_token) {
      // Verify web access token
      const ticket = await clientWeb.verifyIdToken({
        idToken: req.session.token.id_token,
        audience: process.env.CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new Error("Invalid token payload");
      }

      // Find user for web client
      const user = await UserModel.findOne({ email: payload.email });
      if (!user) {
        return res
          .status(404)
          .send("Usuario no encontrado. Por favor, regístrate primero.");
      }

      req.user = user;
      req.device = "web";
      next();
    } else if (req.body.id_token) {
      // Verify mobile ID token
      const ticket = await clientMobile.verifyIdToken({
        idToken: req.body.id_token,
        audience: process.env.CLIENT_ID_MOBILE,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new Error("Invalid token payload");
      }

      // Find user for mobile client
      const user = await UserModel.findOne({ email: payload.email });
      if (!user) {
        return res
          .status(404)
          .send("Usuario no encontrado. Por favor, regístrate primero.");
      }

      req.user = user;
      req.device = "mobile";
      next();
    } else {
      res.status(401).send("No autorizado. Inicia sesión primero.");
    }
  } catch (error) {
    console.error("Token verification failed:", error);
    res.status(401).send("Token inválido o expirado.");
  }
}

export default isAuthenticated;
