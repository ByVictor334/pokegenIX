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

const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(
  "1019043913093-mjpolve8q18hrmr8nc6uk6cub8n2gbnt.apps.googleusercontent.com"
);

const createUser = async (profile: GoogleProfile) => {
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
  return user;
};

async function verifyGoogleIdToken(idToken: string) {
  console.log(
    "%csrcControllersAuthController.ts:83 ticket",
    "color: white; background-color: #007acc;",
    idToken
  );
  const ticket = await client.verifyIdToken({
    idToken,
    audience:
      "1019043913093-mjpolve8q18hrmr8nc6uk6cub8n2gbnt.apps.googleusercontent.com", // verifica que el token fue emitido para tu app
  });

  const payload = ticket.getPayload();

  // Puedes acceder a datos como:
  // payload.email, payload.name, payload.sub, etc.

  return payload; // lo usas para crear la sesión o usuario
}

const loginWithGoogle = async (_req: Request, res: Response): Promise<void> => {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: CLIENT_ID as string,
    redirect_uri: REDIRECT_URI as string,
    scope: SCOPES.join(" "),
    state: "random_string_123", // opcional, útil para CSRF protection
  });

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
    const user = await createUser(profile);
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

    // respond with a json
    res.status(200).json({
      message: "Login successful",
      user: user,
      token: req.session.token,
    });
  } catch (error) {
    return res.status(500).send("Error interno");
  }
};

const loginWithGoogleCallbackMobile = async (
  req: Request,
  res: Response
): Promise<Response | void> => {
  const { code, code_verifier } = req.body;

  if (!code || !code_verifier) {
    return res.status(400).json({ error: "Faltan parámetros requeridos" });
  }

  try {
    const params = new URLSearchParams({
      code,
      client_id: process.env.CLIENT_ID as string,
      redirect_uri: "com.ryogan.PokedexIA:/oauth2redirect", // debe coincidir con el de Google Console
      grant_type: "authorization_code",
      code_verifier,
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
      console.error("Error al intercambiar código (iOS):", data);
      return res.status(500).json({ error: "Error al obtener token" });
    }

    const profileRes = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: { Authorization: `Bearer ${data.access_token}` },
      }
    );

    const profile = (await profileRes.json()) as GoogleProfile;

    // Opcional: verificar el id_token (puedo ayudarte con eso si quieres)
    // Opcional: guardar sesión, base de datos, etc.
    const user = await createUser(profile);

    // 🔁 Devolver token a la app o iniciar sesión en backend
    res.json({
      access_token: data.access_token,
      id_token: data.id_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
      user: user,
    });
  } catch (err) {
    console.error("Error en /mobile/callback:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const userProfile = async (
  req: Request,
  res: Response
): Promise<Response | void> => {
  const token = req.session.token as GoogleToken;

  try {
    const profile = await UserModel.findById(token.id);

    if (!profile) {
      return res.status(401).send({
        message: "User not found",
      });
    }

    return res.status(200).json(profile);
  } catch (err) {
    console.error("Error al obtener perfil:", err);
    return res.status(500).send("Error al obtener perfil");
  }
};

const getVerifyGoogleIdToken = async (req: Request, res: Response) => {
  const { id_token } = req.body;

  try {
    const userInfo = await verifyGoogleIdToken(id_token);

    // Aquí puedes buscar en tu DB al usuario por `userInfo.sub` o `userInfo.email`
    // o crearlo si no existe

    // Por ejemplo:
    // const user = await User.findOrCreate({ googleId: userInfo.sub })

    res.json({ success: true, user: userInfo });
  } catch (err) {
    console.error("Token inválido", err);
    res.status(401).json({ error: "Token no válido" });
  }
};

export {
  loginWithGoogle,
  loginWithGoogleCallback,
  loginWithGoogleCallbackMobile,
  userProfile,
  getVerifyGoogleIdToken,
};
