/**
 * STUB VERSION - Role-based authorization middleware
 * This is a temporary stub to unblock the team.
 * TECH LEAD: Replace with real implementation on Day 2 Morning.
 * 
 * Real implementation will:
 * 1. Check req.user.role is in allowed roles
 * 2. Return 403 if not authorized
 */

/**
 * Check if user has one of the allowed roles
 * @param {...string} roles - Allowed roles (e.g., 'employee', 'company_admin', 'system_admin')
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    // TODO: TECH LEAD - Implement real role checking
    // Current stub always allows access
    next();
  };
};

/**
 * PRODUCTION VERSION - Uncomment when ready to deploy
 *
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { message: 'Authentication required', code: 'UNAUTHORIZED' }
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: { message: 'Insufficient permissions', code: 'FORBIDDEN' }
      });
    }
    
    next();
  };
};
*/

/**
 * Middleware to require employee role
 */
const requireEmployee = (req, res, next) => {
  // TODO: TECH LEAD - Implement real check
  next();
};

/**
 * PRODUCTION VERSION
 *
const requireEmployee = requireRole('employee');
*/

/**
 * Middleware to require company admin role
 */
const requireCompanyAdmin = (req, res, next) => {
  // TODO: TECH LEAD - Implement real check
  next();
};

/**
 * PRODUCTION VERSION
 *
const requireCompanyAdmin = requireRole('company_admin');
*/

/**
 * Middleware to require system admin role
 */
const requireSystemAdmin = (req, res, next) => {
  // TODO: TECH LEAD - Implement real check
  next();
};

/**
 * PRODUCTION VERSION
 *
const requireSystemAdmin = requireRole('system_admin');
*/

module.exports = {
  requireRole,
  requireEmployee,
  requireCompanyAdmin,
  requireSystemAdmin,
};
