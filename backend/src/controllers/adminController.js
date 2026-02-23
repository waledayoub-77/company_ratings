const adminService = require('../services/adminService');

const getReports = async (req, res, next) => {
  try {
    const data = await adminService.getReports({
      status: req.query.status,
      page: req.query.page,
      limit: req.query.limit,
    });

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const resolveReport = async (req, res, next) => {
  try {
    const report = await adminService.resolveReport({
      id: req.params.id,
      action: req.body.action,
      adminNote: req.body.adminNote,
      adminId: req.user.userId,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({
      success: true,
      data: {
        report,
        message: 'Report resolved successfully',
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getReports,
  resolveReport,
};
