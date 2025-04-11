import { NextFunction, Request, Response } from "express";

// Extend Express Request type
declare module "express" {
  interface Request {
    device?: "web" | "mobile";
  }
}

function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  // Log authentication status instead of entire session

  if (req.session.token && req.session.token.access_token) {
    req.device = "web";
    next();
  } else if (req.body.id_token) {
    req.device = "mobile";
    next();
  } else {
    res.status(401).send("No autorizado. Inicia sesión primero.");
  }
}

export default isAuthenticated;
