import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const userSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    default: () => uuidv4(),
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  picture: {
    type: String,
    default: "",
  },
  provider: {
    type: String,
    default: "google",
  },
  googleId: {
    type: String,
    default: "",
  },
  role: {
    type: String,
    default: "user",
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
  isBanned: { type: Boolean, default: false },
  isBlocked: { type: Boolean, default: false },
  isSuspended: { type: Boolean, default: false },
});

export const UserModel = mongoose.model("User", userSchema);
