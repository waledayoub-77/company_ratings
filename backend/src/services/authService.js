const bcrypt = require('bcryptjs');
const { supabase } = require('../config/database');
const { AppError } = require('../middlewares/errorHandler');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');

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

  // TODO: uncomment when email verification is implemented (Day 2)
  // if (!user.email_verified) {
  //   throw new AppError('Please verify your email before logging in', 403, 'EMAIL_NOT_VERIFIED');
  // }

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
  // 1. Find token in DB
  const { data: storedToken } = await supabase
    .from('refresh_tokens')
    .select('*')
    .eq('token', token)
    .maybeSingle();

  if (!storedToken) {
    throw new AppError('Invalid refresh token', 401, 'INVALID_TOKEN');
  }

  // 2. Check not revoked or expired
  if (storedToken.is_revoked) {
    throw new AppError('Refresh token has been revoked', 401, 'TOKEN_REVOKED');
  }

  if (new Date(storedToken.expires_at) < new Date()) {
    throw new AppError('Refresh token has expired', 401, 'TOKEN_EXPIRED');
  }

  // 3. Verify JWT signature
  const decoded = verifyRefreshToken(token);

  // 4. Revoke the old token (rotation — each refresh token is one-time use)
  await supabase
    .from('refresh_tokens')
    .update({ is_revoked: true })
    .eq('id', storedToken.id);

  // 5. Issue new tokens
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

module.exports = { registerUser, loginUser, refreshToken, logout, getMe };

//baraa