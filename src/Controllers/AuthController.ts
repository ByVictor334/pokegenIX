import { Request, Response } from "express";

const AUTH_BASE_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const CLIENT_ID = process.env.CLIENT_ID;
const REDIRECT_URI = process.env.REDIRECT_URI;
const SCOPES = ["openid", "email", "profile"];

const loginWithGoogle = async (req: Request, res: Response) => {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: CLIENT_ID as string,
    redirect_uri: REDIRECT_URI as string,
    scope: SCOPES.join(" "),
    state: "random_string_123", // opcional, útil para CSRF protection
  });

  res.redirect(`${AUTH_BASE_URL}?${params.toString()}`);
};

const loginWithGoogleCallback = async (req: Request, res: Response) => {
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

    const data = await response.json();

    if (data.error) {
      console.error("Error al intercambiar el código:", data);
      return res.status(500).send("Error al obtener el token");
    }

    // 💾 Guardar el token en la sesión
    req.session.token = {
      access_token: data.access_token,
      id_token: data.id_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
    };

    res.status(200).json({ message: "Token guardado en la sesión" });
  } catch (error) {
    res.status(500).send("Error interno");
  }
};

const userProfile = async (req: Request, res: Response) => {
  const accessToken = req.session.token.access_token;

  try {
    const response = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const profile = await response.json();

    if (profile.error) {
      return res.status(401).send("Token inválido o expirado");
    }

    res.status(200).json(profile);
  } catch (err) {
    console.error("Error al obtener perfil:", err);
    res.status(500).send("Error al obtener perfil");
  }
};
export { loginWithGoogle, loginWithGoogleCallback, userProfile };
