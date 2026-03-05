const express = require("express");
const router = express.Router();

const employmentController = require("../controllers/employmentController");
const { requireAuth } = require("../middlewares/authMiddleware");

// RANEEM: Employment workflow
// Feature 12: self-request disabled — employees are invited by company admins only
// router.post("/request", requireAuth, employmentController.requestEmployment);
router.get("/", requireAuth, employmentController.listMyEmployments);

// Feature 1: Admin invite + employee accept
router.post("/invite", requireAuth, employmentController.inviteEmployee);
router.post("/accept-invite", requireAuth, employmentController.acceptInvite);
router.get("/pending-invites", requireAuth, employmentController.getPendingInvites);
router.delete("/:id/cancel-invite", requireAuth, employmentController.cancelInvite);

// Admin view — MUST be before "/:id/..."
router.get("/pending", requireAuth, employmentController.listPendingEmployments);
router.get("/all",     requireAuth, employmentController.listAllEmployments);

// Approve / reject / end / cancel
router.patch("/:id/approve", requireAuth, employmentController.approveEmployment);
router.patch("/:id/reject", requireAuth, employmentController.rejectEmployment);
router.patch("/:id/end", requireAuth, employmentController.endEmployment);
router.patch("/:id/end-by-admin", requireAuth, employmentController.endByAdmin);
router.delete("/:id/cancel", requireAuth, employmentController.cancelEmployment);

module.exports = router;