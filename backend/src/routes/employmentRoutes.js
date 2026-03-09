const express = require("express");
const router = express.Router();

const employmentController = require("../controllers/employmentController");
const { requireAuth } = require("../middlewares/authMiddleware");

// Feature 12: Self-request employment flow removed — employees join via invite or job application
// router.post("/request", requireAuth, employmentController.requestEmployment);
router.get("/", requireAuth, employmentController.listMyEmployments);

// Feature 1: Admin invite employee
router.post("/invite", requireAuth, employmentController.inviteEmployee);
router.post("/accept-invite", requireAuth, employmentController.acceptInvite);
router.get("/pending-invites", requireAuth, employmentController.getPendingInvites);
router.delete("/invite/:id", requireAuth, employmentController.cancelInvite);
router.patch("/invite/:id/resend", requireAuth, employmentController.resendInvite);

// Admin view — MUST be before "/:id/..."
router.get("/pending", requireAuth, employmentController.listPendingEmployments);
router.get("/all",     requireAuth, employmentController.listAllEmployments);

// List current employees (company admin view)
router.get("/current", requireAuth, employmentController.listCurrentEmployees);

// Approve / reject / end / cancel
router.patch("/:id/approve", requireAuth, employmentController.approveEmployment);
router.patch("/:id/reject", requireAuth, employmentController.rejectEmployment);
router.patch("/:id/end", requireAuth, employmentController.endEmployment);
router.patch("/:id/end-by-admin", requireAuth, employmentController.endEmploymentByAdmin);
router.delete("/:id/cancel", requireAuth, employmentController.cancelEmployment);

// Employee end-request flow
router.patch("/:id/request-end", requireAuth, employmentController.requestEndEmployment);
router.patch("/:id/approve-end-request", requireAuth, employmentController.approveEndRequest);
router.patch("/:id/reject-end-request", requireAuth, employmentController.rejectEndRequest);

module.exports = router;