const { verifyAccessToken } = require('../utils/jwt');
const supabase = require('../config/database');

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

    // Per-request suspension/deletion check (fixes A14 — no stale-token bypass)
    const { data: dbUser } = await supabase
      .from('users')
      .select('is_active, is_deleted')
      .eq('id', decoded.userId)
      .maybeSingle();

    if (!dbUser || dbUser.is_deleted) {
      return res.status(401).json({
        success: false,
        error: { message: 'Account not found', code: 'USER_NOT_FOUND' },
      });
    }

    if (!dbUser.is_active) {
      return res.status(403).json({
        success: false,
        error: { message: 'Your account has been suspended', code: 'ACCOUNT_SUSPENDED' },
      });
    }

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

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);

    req.user = decoded; // { userId, email, role }
    return next();
  } catch (err) {
    // if token invalid, just treat as guest (don’t block GET profile)
    req.user = null;
    return next();
  }
};

module.exports = { requireAuth, optionalAuth };


