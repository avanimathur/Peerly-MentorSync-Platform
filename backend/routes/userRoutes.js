import express from "express";
import User from "../models/User.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.put("/profile", protect, async (req, res) => {
  const updatedUser = await User.findByIdAndUpdate(
    req.userId,
    req.body,
    { new: true }
  );

  res.json(updatedUser);
});

router.get("/mentors", async (req, res) => {
  const mentors = await User.find({ role: "mentor" });
  res.json(mentors);
});

export default router;
