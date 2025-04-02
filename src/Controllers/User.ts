import { Request, Response } from "express";
import User from "../Models/User";
import { OAuth2Client } from "google-auth-library";
import { generateToken } from "../Utils/JWT";
import { Role } from "../Types/User";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const register = async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  const user = await User.create({ name, email, password });
  res.status(201).json(user);
};

export const registerWithGoogle = async (req: Request, res: Response) => {
  const { token } = req.body;

  try {
    // Verifica el token con Google
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      return res.status(400).json({ error: "Token de Google inválido" });
    }

    const { sub, email, name, picture } = payload;

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        id: sub,
        email,
        name,
        picture,
        role: "user",
      });
    }

    // Genera un JWT propio
    const jwtToken = generateToken({
      id: user.id,
      email: user.email,
      picture: user.picture,
      role: user.role as Role,
    });

    res.cookie("access_token", jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 3600 * 1000,
    });

    res.json({ message: "Login exitoso", token: jwtToken, user });
  } catch (error) {
    res.status(400).json({ error: "Token de Google inválido" });
  }
};

export const logout = async (req: Request, res: Response) => {
  res.clearCookie("access_token");
  res.json({ message: "Logout exitoso" });
};
