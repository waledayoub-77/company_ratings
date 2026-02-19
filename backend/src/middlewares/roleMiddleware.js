/**
 * Role-based authorization middleware
 * Must be used AFTER requireAuth (relies on req.user being set)
 */

/**
 * Check if user has one of the allowed roles
 * @param {...string} roles - Allowed roles (e.g., 'employee', 'company_admin', 'system_admin')
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { message: 'Authentication required', code: 'UNAUTHORIZED' },
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: { message: 'Insufficient permissions', code: 'FORBIDDEN' },
      });
    }

    next();
  };
};

const requireEmployee = requireRole('employee');
const requireCompanyAdmin = requireRole('company_admin');
const requireSystemAdmin = requireRole('system_admin');

module.exports = {
  requireRole,
  requireEmployee,
  requireCompanyAdmin,
  requireSystemAdmin,
};
