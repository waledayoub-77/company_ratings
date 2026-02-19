const { verifyAccessToken } = require('../utils/jwt');

const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: { message: 'No token provided', code: 'UNAUTHORIZED' },
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
        error: { message: 'Token expired', code: 'TOKEN_EXPIRED' },
      });
    }
    return res.status(401).json({
      success: false,
      error: { message: 'Invalid token', code: 'INVALID_TOKEN' },
    });
  }
};

module.exports = { requireAuth };
