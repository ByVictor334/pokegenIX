import { NextFunction, Request, Response } from "express";

function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.session.token && req.session.token.access_token) {
    next();
  } else {
    res.status(401).send("No autorizado. Inicia sesión primero.");
  }
}

export default isAuthenticated;
