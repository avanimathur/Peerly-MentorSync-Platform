import express from "express";
import User from "../models/User.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

/* Get matched mentors for mentee */
router.get("/mentors", protect, async (req, res) => {
  const mentee = await User.findById(req.userId);

  if (mentee.role !== "mentee") {
    return res.status(403).json({ message: "Only mentees allowed" });
  }

  const mentors = await User.find({ role: "mentor" });

  const matchedMentors = mentors.map(mentor => {
    const commonSkills = mentor.skills?.filter(skill =>
      mentee.interests?.includes(skill)
    );

    return {
      ...mentor._doc,
      matchScore: commonSkills.length
    };
  });

  matchedMentors.sort((a, b) => b.matchScore - a.matchScore);

  res.json(matchedMentors);
});

export default router;
