const { verifyAccessToken } = require('../utils/jwt');

/**
 * STUB VERSION - Authentication middleware
 * This is a temporary stub to unblock the team.
 * TECH LEAD: Replace with real implementation on Day 1 Afternoon.
 * 
 * Real implementation will:
 * 1. Extract token from Authorization header (Bearer <token>)
 * 2. Verify token using verifyAccessToken()
 * 3. Set req.user with decoded payload
 * 4. Handle errors (missing token, invalid token, expired token)
 */
const requireAuth = (req, res, next) => {
  // TODO: TECH LEAD - Implement real JWT verification
  // Current stub for team to start working
  req.user = { 
    userId: 'test-user-id', 
    email: 'test@test.com', 
    role: 'employee' 
  };
  next();
};

/**
 * PRODUCTION VERSION - Uncomment when ready to deploy
 * 
const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: { message: 'No token provided', code: 'UNAUTHORIZED' }
      });
    }
    
    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);
    
    req.user = decoded; // { userId, email, role }
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: { message: 'Token expired', code: 'TOKEN_EXPIRED' }
      });
    }
    return res.status(401).json({
      success: false,
      error: { message: 'Invalid token', code: 'INVALID_TOKEN' }
    });
  }
};
*/

module.exports = { requireAuth };
