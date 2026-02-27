const authService = require('../services/authService');

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: { message: 'currentPassword and newPassword are required', code: 'MISSING_FIELDS' },
      });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: { message: 'New password must be at least 8 characters', code: 'PASSWORD_TOO_SHORT' },
      });
    }
    await authService.changePassword(req.user.userId, { currentPassword, newPassword });
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
};

const register = async (req, res, next) => {
  try {
    const user = await authService.registerUser(req.body);
    res.status(201).json({
      success: true,
      data: {
        user,
        message: 'Registration successful. Please check your email to verify.',
      },
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const result = await authService.loginUser(req.body);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: { message: 'Refresh token is required', code: 'MISSING_TOKEN' },
      });
    }
    const tokens = await authService.refreshToken(refreshToken);
    res.json({ success: true, data: tokens });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: { message: 'Refresh token is required', code: 'MISSING_TOKEN' },
      });
    }
    await authService.logout(refreshToken);
    res.json({ success: true, data: { message: 'Logged out successfully' } });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await authService.getMe(req.user.userId);
    res.json({ success: true, data: { user } });
  } catch (error) {
    next(error);
  }
};

const verifyEmail = async (req, res, next) => {
  try {
    await authService.verifyEmail(req.params.token);
    res.json({ success: true, data: { message: 'Email verified successfully. You can now log in.' } });
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    await authService.forgotPassword(req.body.email);
    // Always return 200 — don't reveal if email exists
    res.json({ success: true, data: { message: 'If that email exists, a reset link has been sent.' } });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    await authService.resetPassword(req.params.token, req.body.password);
    res.json({ success: true, data: { message: 'Password reset successfully. Please log in.' } });
  } catch (error) {
    next(error);
  }
};

const updateMe = async (req, res, next) => {
  try {
    const { fullName, bio, currentPosition, email } = req.body;
    const result = await authService.updateMe(req.user.userId, req.user.role, { fullName, bio, currentPosition, email });
    res.json({ success: true, message: 'Profile updated successfully', emailChanged: result.emailChanged });
  } catch (error) {
    next(error);
  }
};

// PATCH /auth/me/deactivate — user self-deactivates (is_active = false, tokens revoked)
const deactivateAccount = async (req, res, next) => {
  try {
    const supabase = require('../config/database');
    const userId = req.user.userId;
    const { error: updateErr } = await supabase
      .from('users')
      .update({ is_active: false })
      .eq('id', userId);
    if (updateErr) throw updateErr;
    // Revoke all refresh tokens so they can't re-authenticate silently
    await supabase.from('refresh_tokens').update({ is_revoked: true }).eq('user_id', userId);
    res.json({ success: true, message: 'Account deactivated. A system admin can reactivate it.' });
  } catch (error) {
    next(error);
  }
};

// DELETE /auth/me — user soft-deletes their own account (data preserved)
const deleteAccount = async (req, res, next) => {
  try {
    const supabase = require('../config/database');
    const userId = req.user.userId;
    const { data: user } = await supabase.from('users').select('role').eq('id', userId).single();
    if (user?.role === 'system_admin') {
      return res.status(403).json({ success: false, error: { message: 'System admins cannot self-delete', code: 'FORBIDDEN' } });
    }
    const now = new Date().toISOString();
    const { error: updateErr } = await supabase
      .from('users')
      .update({ deleted_at: now, is_active: false, is_deleted: true })
      .eq('id', userId);
    if (updateErr) throw updateErr;
    await supabase.from('refresh_tokens').update({ is_revoked: true }).eq('user_id', userId);
    res.json({ success: true, message: 'Account deleted. Your data has been preserved per our policy.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, refresh, logout, getMe, updateMe, verifyEmail, forgotPassword, resetPassword, changePassword, deactivateAccount, deleteAccount };

//baraa
