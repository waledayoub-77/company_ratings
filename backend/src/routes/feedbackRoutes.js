const express = require("express");
const router = express.Router();

const { requireAuth } = require("../middlewares/authMiddleware");
const feedbackController = require("../controllers/feedbackController");

router.use(requireAuth);

// POST /api/feedback
router.post("/", feedbackController.createFeedback);

module.exports = router;