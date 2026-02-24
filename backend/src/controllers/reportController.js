const reportService = require('../services/reportService');

const createReport = async (req, res, next) => {
  try {
    const report = await reportService.createReport({
      reviewId: req.body.reviewId,
      reporterId: req.user.userId,
      reason: req.body.reason,
      description: req.body.description,
    });

    res.status(201).json({
      success: true,
      data: {
        report,
        message: 'Report submitted successfully',
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReport,
};
