const express = require("express");
const router = express.Router();

const { requireAuth } = require("../middlewares/authMiddleware");
const feedbackController = require("../controllers/feedbackController");

router.use(requireAuth);

// POST /api/feedback  — submit new peer feedback
router.post("/", feedbackController.createFeedback);

// GET /api/feedback/received  — see feedback received about yourself (admin can pass ?employeeId=)
router.get("/received", feedbackController.getFeedbackReceived);

// GET /api/feedback/given  — see feedback you submitted (admin can pass ?employeeId=)
router.get("/given", feedbackController.getFeedbackGiven);

module.exports = router;