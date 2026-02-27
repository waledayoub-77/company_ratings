const express = require("express");
const router = express.Router();

const { requireAuth } = require("../middlewares/authMiddleware");
const feedbackController = require("../controllers/feedbackController");
const { validateFeedback } = require('../utils/validators');
const { validate } = require('../middlewares/validateMiddleware');

router.use(requireAuth);

// POST /api/feedback  — submit new peer feedback
router.post("/", validateFeedback, validate, feedbackController.createFeedback);

// POST /api/feedback/:id/report  — report a feedback entry to admins
router.post("/:id/report", feedbackController.reportFeedback);

// GET /api/feedback/coworkers  — list coworkers eligible to receive feedback from the logged-in employee
router.get("/coworkers", feedbackController.getCoworkers);

// GET /api/feedback/received  — see feedback received about yourself (admin can pass ?employeeId=)
router.get("/received", feedbackController.getFeedbackReceived);

// GET /api/feedback/given  — see feedback you submitted (admin can pass ?employeeId=)
router.get("/given", feedbackController.getFeedbackGiven);

module.exports = router;