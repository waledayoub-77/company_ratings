const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { AppError } = require('../middlewares/errorHandler');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const supabase = require('../config/database');
const { sendVerifyEmail, sendWelcomeEmail, sendResetPasswordEmail } = require('./emailService');

const registerUser = async ({ email, password, role, fullName, companyName }) => {
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (existingUser) {
    throw new AppError('Email already exists', 409, 'EMAIL_EXISTS');
  }
  const password_hash = await bcrypt.hash(password, 12);

  const { data: user, error } = await supabase
    .from('users')
    .insert({ email, password_hash, role, email_verified: false })
    .select()
    .single();

  if (error) throw error;

  if (role === 'employee') {
    await supabase
      .from('employees')
      .insert({ user_id: user.id, full_name: fullName });
  }

  if (role === 'company_admin') {
    await supabase
      .from('companies')
      .insert({ user_id: user.id, name: companyName, industry: 'Not specified', location: 'Not specified' });
  }

  // Send verification email (non-blocking — user is created even if email fails)
  try {
    const verifyToken = crypto.randomBytes(32).toString('hex');
    await supabase.from('email_verification_tokens').insert({
      user_id: user.id,
      token: verifyToken,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });
    const displayName = fullName || companyName || email;
    await sendVerifyEmail({ to: email, name: displayName, token: verifyToken });
    await sendWelcomeEmail({ to: email, name: displayName });
  } catch (e) {
    console.error('Failed to send verification email:', e.message);
  }
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    emailVerified: user.email_verified,
  };
};

const loginUser = async ({ email, password }) => {
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .eq('is_deleted', false)
    .maybeSingle();

  if (!user) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  // Re-enabled: email must be verified before login
  if (!user.email_verified) {
    throw new AppError('Please verify your email before logging in', 403, 'EMAIL_NOT_VERIFIED');
  }

  if (!user.is_active) {
    throw new AppError('Your account has been suspended', 403, 'ACCOUNT_SUSPENDED');
  }

  const payload = { userId: user.id, email: user.email, role: user.role };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  await supabase.from('refresh_tokens').insert({
    user_id: user.id,
    token: refreshToken,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  return {
    user: { id: user.id, email: user.email, role: user.role, emailVerified: user.email_verified },
    accessToken,
    refreshToken,
  };
};

const refreshToken = async (token) => {
  const { data: storedToken } = await supabase
    .from('refresh_tokens')
    .select('*')
    .eq('token', token)
    .maybeSingle();

  if (!storedToken) {
    throw new AppError('Invalid refresh token', 401, 'INVALID_TOKEN');
  }

 
  if (storedToken.is_revoked) {
    throw new AppError('Refresh token has been revoked', 401, 'TOKEN_REVOKED');
  }

  if (new Date(storedToken.expires_at) < new Date()) {
    throw new AppError('Refresh token has expired', 401, 'TOKEN_EXPIRED');
  }


  const decoded = verifyRefreshToken(token);
  await supabase
    .from('refresh_tokens')
    .update({ is_revoked: true })
    .eq('id', storedToken.id);

  
  const payload = { userId: decoded.userId, email: decoded.email, role: decoded.role };
  const newAccessToken = generateAccessToken(payload);
  const newRefreshToken = generateRefreshToken(payload);

  await supabase.from('refresh_tokens').insert({
    user_id: decoded.userId,
    token: newRefreshToken,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

const logout = async (token) => {
  const { data: storedToken } = await supabase
    .from('refresh_tokens')
    .select('id')
    .eq('token', token)
    .maybeSingle();

  if (!storedToken) {
    throw new AppError('Invalid refresh token', 401, 'INVALID_TOKEN');
  }

  await supabase
    .from('refresh_tokens')
    .update({ is_revoked: true })
    .eq('id', storedToken.id);
};

const getMe = async (userId) => {
  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, role, email_verified, is_active, created_at')
    .eq('id', userId)
    .eq('is_deleted', false)
    .single();

  if (error || !user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    emailVerified: user.email_verified,
    isActive: user.is_active,
    createdAt: user.created_at,
  };
};

// ─── VERIFY EMAIL ─────────────────────────────────────────────────────────────
const verifyEmail = async (token) => {
  const { data: record } = await supabase
    .from('email_verification_tokens')
    .select('*')
    .eq('token', token)
    .maybeSingle();

  if (!record) throw new AppError('Invalid verification link', 400, 'INVALID_TOKEN');
  if (record.used_at) throw new AppError('Verification link already used', 400, 'TOKEN_USED');
  if (new Date(record.expires_at) < new Date()) throw new AppError('Verification link has expired', 400, 'TOKEN_EXPIRED');

  // Mark email as verified
  await supabase.from('users').update({ email_verified: true }).eq('id', record.user_id);

  // Mark token as used
  await supabase
    .from('email_verification_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('id', record.id);
};

// ─── FORGOT PASSWORD ──────────────────────────────────────────────────────────
const forgotPassword = async (email) => {
  const { data: user } = await supabase
    .from('users')
    .select('id, email, email_verified')
    .eq('email', email)
    .eq('is_deleted', false)
    .maybeSingle();

  // Always return success — don't reveal if email exists
  if (!user) return;

  const token = crypto.randomBytes(32).toString('hex');

  // Invalidate any previous unused tokens for this user
  await supabase
    .from('password_reset_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .is('used_at', null);

  await supabase.from('password_reset_tokens').insert({
    user_id: user.id,
    token,
    expires_at: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
  });

  await sendResetPasswordEmail({ to: user.email, name: user.email, token });
};

// ─── RESET PASSWORD ───────────────────────────────────────────────────────────
const resetPassword = async (token, newPassword) => {
  const { data: record } = await supabase
    .from('password_reset_tokens')
    .select('*')
    .eq('token', token)
    .maybeSingle();

  if (!record) throw new AppError('Invalid reset link', 400, 'INVALID_TOKEN');
  if (record.used_at) throw new AppError('Reset link already used', 400, 'TOKEN_USED');
  if (new Date(record.expires_at) < new Date()) throw new AppError('Reset link has expired', 400, 'TOKEN_EXPIRED');

  const password_hash = await bcrypt.hash(newPassword, 12);

  await supabase.from('users').update({ password_hash }).eq('id', record.user_id);

  // Mark token as used
  await supabase
    .from('password_reset_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('id', record.id);

  // Revoke all refresh tokens (force re-login on all devices)
  await supabase
    .from('refresh_tokens')
    .update({ is_revoked: true })
    .eq('user_id', record.user_id);
};

module.exports = { registerUser, loginUser, refreshToken, logout, getMe, verifyEmail, forgotPassword, resetPassword };

//baraa