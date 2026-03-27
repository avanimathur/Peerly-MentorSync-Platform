import express from "express";
import Request from "../models/Request.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

/* Send mentor request */
router.post("/", protect, async (req, res) => {
  const { mentorId } = req.body;

  const request = await Request.create({
    mentor: mentorId,
    mentee: req.userId
  });

  res.json({ message: "Request sent", request });
});

/* Mentor: view incoming requests */
router.get("/incoming", protect, async (req, res) => {
  const requests = await Request.find({ mentor: req.userId })
    .populate("mentee", "name department year");

  res.json(requests);
});

/* Update request status */
router.put("/:id", protect, async (req, res) => {
  const { status } = req.body;

  const request = await Request.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  );

  res.json(request);
});

export default router;
