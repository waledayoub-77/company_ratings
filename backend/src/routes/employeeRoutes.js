const express = require("express");
const router = express.Router();

const { requireAuth, optionalAuth } = require("../middlewares/authMiddleware");
const employeeController = require("../controllers/employeeController");

// ✅ Guest can view, privacy handled inside controller
router.get("/:id", optionalAuth, employeeController.getEmployeeProfile);

// ✅ Only owner (or admin) can update
router.patch("/:id", requireAuth, employeeController.updateEmployeeProfile);

module.exports = router;