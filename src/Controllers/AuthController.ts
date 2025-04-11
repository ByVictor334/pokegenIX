import { Request, Response } from "express";
import { UserModel } from "../Models/UserModel";
import { OAuth2Client } from "google-auth-library";

const REDIRECT_URI = process.env.REDIRECT_URI;
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_ID_MOBILE = process.env.CLIENT_ID_MOBILE;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const SCOPES = ["openid", "email", "profile"];

const oauth2ClientWeb = new OAuth2Client({
  clientId: CLIENT_ID,
  clientSecret: CLIENT_SECRET,
  redirectUri: REDIRECT_URI,
});
const clientMobile = new OAuth2Client(CLIENT_ID_MOBILE);

const saveUserProfile = async (profile: {
  name: string;
  email: string;
  picture: string;
  provider: string;
  googleId: string;
}) => {
  const user = await UserModel.findOneAndUpdate(
    { email: profile.email },
    {
      $set: {
        name: profile.name,
        email: profile.email,
        picture: profile.picture,
        googleId: profile.googleId,
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

async function verifyGoogleIdTokenMobile(idToken: string) {
  const ticket = await clientMobile.verifyIdToken({
    idToken,
    audience: CLIENT_ID_MOBILE,
  });

  const payload = ticket.getPayload();
  return payload;
}

async function verifyGoogleIdTokenWeb(idToken: string) {
  const ticket = await oauth2ClientWeb.verifyIdToken({
    idToken,
    audience: CLIENT_ID,
  });

  const payload = ticket.getPayload();
  return payload;
}

// const refreshToken = async (
//   req: Request,
//   res: Response
// ): Promise<Response | void> => {
//   try {
//     if (!req.session.token?.refresh_token) {
//       return res.status(400).json({ message: "No refresh token available" });
//     }

//     const { tokens } = await oauth2ClientWeb.refreshAccessToken(
//       req.session.token?.access_token as string
//     );
//     oauth2ClientWeb.setCredentials(tokens);

//     const payload = await verifyGoogleIdTokenWeb(tokens.id_token as string);

//     req.session.token = {
//       ...req.session.token,
//       access_token: tokens.access_token as string,
//       id_token: tokens.id_token as string,
//       expires_in: payload?.exp as number,
//     };

//     return res.status(200).json({
//       message: "Token refreshed successfully",
//       token: req.session.token,
//     });
//   } catch (error) {
//     console.error("Error refreshing token:", error);
//     return res.status(500).json({ message: "Error refreshing token" });
//   }
// };

const loginWithGoogle = async (_req: Request, res: Response): Promise<void> => {
  const authUrl = oauth2ClientWeb.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    redirect_uri: REDIRECT_URI,
    prompt: "consent",
  });

  res.redirect(authUrl);
};

const loginWithGoogleCallback = async (
  req: Request,
  res: Response
): Promise<Response | void> => {
  const code = req.query.code;

  if (!code) {
    return res.status(400).json({ message: "Authorization code is required" });
  }

  try {
    const { tokens } = await oauth2ClientWeb.getToken(code as string);
    oauth2ClientWeb.setCredentials(tokens);

    const payload = await verifyGoogleIdTokenWeb(tokens.id_token as string);

    if (!payload?.email || !payload?.name || !payload?.sub) {
      return res.status(400).json({ message: "Invalid token payload" });
    }

    const user = await saveUserProfile({
      name: payload.name,
      email: payload.email,
      picture: payload.picture as string,
      provider: "google",
      googleId: payload.sub,
    });

    req.session.token = {
      id: user.id,
      access_token: tokens.access_token as string,
      id_token: tokens.id_token as string,
      refresh_token: tokens.refresh_token as string,
      expires_in: payload.exp as number,
      role: user.role,
    };
    req.session.user = {
      name: user.name,
      email: user.email,
      picture: user.picture,
      sub: user.googleId,
    };

    res.redirect(process.env.CLIENT_URL || "http://localhost:3000/auth");
  } catch (error) {
    console.error("Error in web login:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const loginWithGoogleMobileCallback = async (
  req: Request,
  res: Response
): Promise<Response | void> => {
  const { id_token } = req.body;

  if (!id_token) {
    return res.status(400).json({ message: "ID token is required" });
  }

  try {
    const payload = await verifyGoogleIdTokenMobile(id_token);

    if (!payload?.email || !payload?.name || !payload?.sub) {
      return res.status(400).json({ message: "Invalid token payload" });
    }

    const user = await saveUserProfile({
      name: payload.name,
      email: payload.email,
      picture: payload.picture as string,
      provider: "google",
      googleId: payload.sub,
    });

    req.session.token = {
      id: user.id,
      access_token: id_token,
      id_token: id_token,
      refresh_token: "",
      expires_in: payload.exp as number,
      role: user.role,
    };
    req.session.user = {
      name: user.name,
      email: user.email,
      picture: user.picture,
      sub: user.googleId,
    };

    res.status(200).json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        picture: user.picture,
        role: user.role,
      },
      token: req.session.token,
    });
  } catch (error) {
    console.error("Error in mobile login:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const userProfile = async (
  req: Request,
  res: Response
): Promise<Response | void> => {
  try {
    const device = req.device;

    let user;

    if (device === "mobile") {
      const payload = await verifyGoogleIdTokenMobile(req.body.id_token);
      user = await UserModel.findOne({ email: payload?.email });
    }

    if (device === "web") {
      user = await UserModel.findOne({ email: req.session.user?.email });
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "Profile retrieved successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        picture: user.picture,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Error retrieving profile:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const logout = async (
  req: Request,
  res: Response
): Promise<Response | void> => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      return res.status(500).json({ message: "Error during logout" });
    }
    res.clearCookie("connect.sid");
    return res.json({ message: "Logged out successfully" });
  });
};

export {
  loginWithGoogle,
  loginWithGoogleCallback,
  loginWithGoogleMobileCallback,
  userProfile,
  logout,
};
