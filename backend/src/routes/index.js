const express = require("express");
const router = express.Router();

const authRoutes = require("./authRoutes");
const companyRoutes = require("./companyRoutes");
const employmentRoutes = require("./employmentRoutes");
const feedbackRoutes = require("./feedbackRoutes");
const reviewRoutes = require("./reviewRoutes");
const employeeRoutes = require("./employeeRoutes"); // ✅ add this
const adminRoutes = require("./adminRoutes"); // ✅ Walid's admin routes

router.use("/auth", authRoutes);
router.use("/companies", companyRoutes);
router.use("/employments", employmentRoutes);
router.use("/feedback", feedbackRoutes);
router.use("/reviews", reviewRoutes);
router.use("/employees", employeeRoutes); // ✅ add this
router.use("/", adminRoutes); // ✅ mounts /reports, /admin/*, etc.

module.exports = router;