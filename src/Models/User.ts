import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
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
  role: {
    type: String,
    default: "user",
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  isAdmin: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
  isBanned: { type: Boolean, default: false },
  isBlocked: { type: Boolean, default: false },
  isSuspended: { type: Boolean, default: false },
});

const User = mongoose.model("User", userSchema);

export default User;
