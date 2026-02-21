const express = require("express");
const router = express.Router();
const supabase = require("../config/database");

const employmentController = require("../controllers/employmentController");
const { requireAuth } = require("../middlewares/authMiddleware");

// 🔐 Protect all employment routes
router.use(requireAuth);

router.post("/request", employmentController.requestEmployment);
router.get("/", employmentController.listMyEmployments);
router.patch("/:id/approve", employmentController.approveEmployment);
router.patch("/:id/reject", employmentController.rejectEmployment);

module.exports = router;