const express = require("express");
const router = express.Router();

const employmentController = require("../controllers/employmentController");
const { requireAuth } = require("../middlewares/authMiddleware");

// RANEEM: Employment workflow
router.post("/request", requireAuth, employmentController.requestEmployment);
router.get("/", requireAuth, employmentController.listMyEmployments);

// ✅ Admin view — MUST be before "/:id/..."
router.get("/pending", requireAuth, employmentController.listPendingEmployments);

// Approve / reject / end
router.patch("/:id/approve", requireAuth, employmentController.approveEmployment);
router.patch("/:id/reject", requireAuth, employmentController.rejectEmployment);
router.patch("/:id/end", requireAuth, employmentController.endEmployment);

module.exports = router;