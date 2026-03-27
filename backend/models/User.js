import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, enum: ["mentor", "mentee"] },

  skills: [String],        // mentor
  interests: [String],    // mentee
  year: String,
  department: String,
  bio: String
}, { timestamps: true });

export default mongoose.model("User", userSchema);
