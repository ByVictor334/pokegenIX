import { Request, Response } from "express";
import { UserModel } from "../Models/UserModel";

// Add interface for token stored in session
interface GoogleToken {
  id: string;
  name: string;
  email: string;
  picture: string;
  role: string;
  access_token: string;
  id_token: string;
  refresh_token: string;
  expires_in: number;
}

// Extend express session to include our token
declare module "express-session" {
  interface Session {
    token?: GoogleToken;
  }
}

// Add interface for Google OAuth response
interface GoogleOAuthResponse {
  access_token: string;
  id_token: string;
  refresh_token: string;
  expires_in: number;
  error?: string;
}

// Add interface for Google Profile response
interface GoogleProfile {
  sub: string;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  email: string;
  email_verified: boolean;
  locale: string;
  error?: string;
}

const AUTH_BASE_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const CLIENT_ID = process.env.CLIENT_ID;
const REDIRECT_URI = process.env.REDIRECT_URI;
const SCOPES = ["openid", "email", "profile"];

const loginWithGoogle = async (_req: Request, res: Response): Promise<void> => {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: CLIENT_ID as string,
    redirect_uri: REDIRECT_URI as string,
    scope: SCOPES.join(" "),
    state: "random_string_123", // opcional, útil para CSRF protection
  });

  console.log(
    "%csrcControllersAuthController.ts:54 params",
    "color: white; background-color: #007acc;",
    params
  );

  res.redirect(`${AUTH_BASE_URL}?${params.toString()}`);
};

const loginWithGoogleCallback = async (
  req: Request,
  res: Response
): Promise<Response | void> => {
  const code = req.query.code;

  if (!code) {
    return res.status(400).send("Falta el código de autorización");
  }

  try {
    const params = new URLSearchParams({
      code: code as string,
      client_id: process.env.CLIENT_ID as string,
      client_secret: process.env.CLIENT_SECRET as string,
      redirect_uri: process.env.REDIRECT_URI as string,
      grant_type: "authorization_code",
    });

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const data = (await response.json()) as GoogleOAuthResponse;

    if (data.error) {
      console.error("Error al intercambiar el código:", data);
      return res.status(500).send("Error al obtener el token");
    }

    const profileRes = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: { Authorization: `Bearer ${data.access_token}` },
      }
    );

    const profile = (await profileRes.json()) as GoogleProfile;

    // Guardar o actualizar en base de datos
    const user = await UserModel.findOneAndUpdate(
      { email: profile.email },
      {
        $set: {
          name: profile.name,
          email: profile.email,
          picture: profile.picture,
          googleId: profile.sub,
          lastLogin: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true, returnDocument: "after" }
    );

    // 💾 Guardar el token en la sesión
    // Guardar en sesión

    req.session.token = {
      id: user.id,
      name: user.name,
      email: user.email,
      picture: user.picture,
      role: user.role,
      access_token: data.access_token,
      id_token: data.id_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
    };

    res.redirect("http://localhost:3000"); // Redirige al frontend
  } catch (error) {
    return res.status(500).send("Error interno");
  }
};

const userProfile = async (
  req: Request,
  res: Response
): Promise<Response | void> => {
  const token = req.session.token;

  if (!token?.access_token) {
    return res.status(401).send("No hay token de acceso");
  }

  try {
    const response = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: {
          Authorization: `Bearer ${token.access_token}`,
        },
      }
    );

    const profile = (await response.json()) as GoogleProfile;

    if (profile.error) {
      return res.status(401).send("Token inválido o expirado");
    }

    return res.status(200).json(profile);
  } catch (err) {
    console.error("Error al obtener perfil:", err);
    return res.status(500).send("Error al obtener perfil");
  }
};

export { loginWithGoogle, loginWithGoogleCallback, userProfile };
