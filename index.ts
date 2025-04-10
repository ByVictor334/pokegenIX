import express, { Request, Response } from "express";
import dotenv from "dotenv";
import connectDB from "./src/config/database";
import authRoutes from "./src/Routes/AuthRouter";
import openIaRoutes from "./src/Routes/OpenIaRouter";
import session from "express-session";
import MongoStore from "connect-mongo";

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Connect to MongoDB
connectDB();

// mongo-conect
app.use(
  session({
    secret: process.env.SESSION_SECRET as string,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI as string,
      collectionName: "sessions",
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 2, // 2 horas
      secure: false, // Cambia a true si usas HTTPS en producción
    },
  })
);

// Middleware for parsing JSON bodies
app.use(express.json());
// app.use(cookieParser());

// Middleware for parsing URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Example route with proper TypeScript types
app.get("/hello", async (_req: Request, res: Response) => {
  try {
    res.status(200).json({ message: "Hello World" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/openia", openIaRoutes);

// Error handling middleware
app.use(
  (err: Error, _req: Request, res: Response, _next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: "Something went wrong!" });
  }
);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
