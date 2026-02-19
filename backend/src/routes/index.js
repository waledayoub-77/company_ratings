const express = require('express');
const router = express.Router();

// Import route modules (create these files as you build each module)
// const authRoutes = require('./authRoutes');
// const companyRoutes = require('./companyRoutes');
// const reviewRoutes = require('./reviewRoutes');
// const employmentRoutes = require('./employmentRoutes');
// const feedbackRoutes = require('./feedbackRoutes');
// const adminRoutes = require('./adminRoutes');

// Mount routes
// router.use('/auth', authRoutes);
// router.use('/companies', companyRoutes);
// router.use('/reviews', reviewRoutes);
// router.use('/employments', employmentRoutes);
// router.use('/feedback', feedbackRoutes);
// router.use('/admin', adminRoutes);

// Temporary welcome route for testing
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      message: 'Welcome to Company Rating System API',
      version: '1.0.0',
      endpoints: {
        auth: '/api/auth',
        companies: '/api/companies',
        reviews: '/api/reviews',
        employments: '/api/employments',
        feedback: '/api/feedback',
        admin: '/api/admin',
      },
    },
  });
});

module.exports = router;
