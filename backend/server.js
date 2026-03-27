import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import express from "express";
import mongoose from "mongoose";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import requestRoutes from "./routes/requestRoutes.js";
import matchRoutes from "./routes/matchRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envFilePath = path.join(__dirname, ".env");
if (fs.existsSync(envFilePath)) {
  const envFile = fs.readFileSync(envFilePath, "utf-8");

  envFile.split("\n").forEach((line) => {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith("#")) {
      return;
    }

    const [key, ...valueParts] = trimmedLine.split("=");
    const value = valueParts.join("=").trim();
    if (key && value && !process.env[key]) {
      process.env[key] = value;
    }
  });
}

const app = express();
const DEFAULT_MONGO_URI = "mongodb://127.0.0.1:27017/mentorConnect" ;
const MONGO_URI = process.env.MONGO_URI || process.env.mongo_uri || DEFAULT_MONGO_URI;
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/match", matchRoutes);

// MongoDB Connection
if (!process.env.MONGO_URI && !process.env.mongo_uri) {
  console.warn(`MONGO_URI is not present. Falling back to default: ${DEFAULT_MONGO_URI}`);
}

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  });

// Server start
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
