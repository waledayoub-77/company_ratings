const express = require("express");
const router = express.Router();

const authRoutes = require("./authRoutes");
const companyRoutes = require("./companyRoutes");
const employmentRoutes = require("./employmentRoutes");
const feedbackRoutes = require("./feedbackRoutes");
const reviewRoutes = require("./reviewRoutes");
const employeeRoutes = require('./employeeRoutes');
const adminRoutes = require('./adminRoutes');
const notificationRoutes = require('./notificationRoutes');

router.use('/auth', authRoutes);
router.use('/companies', companyRoutes);
router.use('/employments', employmentRoutes);
router.use('/feedback', feedbackRoutes);
router.use('/reviews', reviewRoutes);
router.use('/employees', employeeRoutes);
router.use('/notifications', notificationRoutes);
router.use('/', adminRoutes);

module.exports = router;