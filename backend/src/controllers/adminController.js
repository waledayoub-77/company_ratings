const adminService = require('../services/adminService');

// ─── REPORTS ─────────────────────────────────────────────────────────────────

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

// ─── USERS ───────────────────────────────────────────────────────────────────

const getUsers = async (req, res, next) => {
  try {
    const data = await adminService.getUsers({
      search: req.query.search,
      role: req.query.role,
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

const suspendUser = async (req, res, next) => {
  try {
    const user = await adminService.suspendUser({
      userId: req.params.id,
      adminId: req.user.userId,
      reason: req.body.reason,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({
      success: true,
      data: {
        user,
        message: 'User suspended successfully',
      },
    });
  } catch (error) {
    next(error);
  }
};

const unsuspendUser = async (req, res, next) => {
  try {
    const user = await adminService.unsuspendUser({
      userId: req.params.id,
      adminId: req.user.userId,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({
      success: true,
      data: {
        user,
        message: 'User unsuspended successfully',
      },
    });
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const result = await adminService.deleteUser({
      userId: req.params.id,
      adminId: req.user.userId,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// ─── COMPANIES ───────────────────────────────────────────────────────────────

const getCompanies = async (req, res, next) => {
  try {
    const data = await adminService.getCompanies({
      search: req.query.search,
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

const verifyCompany = async (req, res, next) => {
  try {
    const company = await adminService.verifyCompany({
      companyId: req.params.id,
      adminId: req.user.userId,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({
      success: true,
      data: {
        company,
        message: 'Company verified successfully',
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── EMPLOYMENT OVERRIDE ─────────────────────────────────────────────────────

const overrideEmployment = async (req, res, next) => {
  try {
    const employment = await adminService.overrideEmployment({
      employmentId: req.params.id,
      adminId: req.user.userId,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({
      success: true,
      data: {
        employment,
        message: 'Employment approved (admin override)',
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── ANALYTICS ───────────────────────────────────────────────────────────────

const getAnalytics = async (req, res, next) => {
  try {
    const data = await adminService.getAnalytics();

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

// ─── AUDIT LOGS ──────────────────────────────────────────────────────────────

const getAuditLogs = async (req, res, next) => {
  try {
    const data = await adminService.getAuditLogs({
      adminId: req.query.adminId,
      action: req.query.action,
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

module.exports = {
  // Reports
  getReports,
  resolveReport,
  // Users
  getUsers,
  suspendUser,
  unsuspendUser,
  deleteUser,
  // Companies
  getCompanies,
  verifyCompany,
  // Employment
  overrideEmployment,
  // Analytics
  getAnalytics,
  // Audit
  getAuditLogs,
};
