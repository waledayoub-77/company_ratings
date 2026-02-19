const express = require('express');
const router = express.Router();

// Import route modules
const companyRoutes = require('./companyRoutes');
const reviewRoutes = require('./reviewRoutes');

// Mount routes
router.use('/companies', companyRoutes);
router.use('/reviews', reviewRoutes);

// API welcome route
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Company Rating System API',
    version: '1.0.0',
    endpoints: {
      companies: '/api/companies',
      reviews: '/api/reviews'
    }
  });
});

module.exports = router;

