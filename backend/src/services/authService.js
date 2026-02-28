const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { AppError } = require('../middlewares/errorHandler');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const supabase = require('../config/database');
const { sendVerifyEmail, sendWelcomeEmail, sendResetPasswordEmail } = require('./emailService');

const registerUser = async ({ email, password, role = 'employee', fullName, full_name, companyName }) => {
  // Block self-registration as system_admin (S1)
  if (role === 'system_admin') {
    throw new AppError('Cannot register as system_admin', 403, 'FORBIDDEN_ROLE');
  }

  // Accept both camelCase and snake_case for full name
  fullName = fullName || full_name;
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
    // BUG-039 fix: check for duplicate company name before inserting
    const { data: existingCompany } = await supabase
      .from('companies')
      .select('id')
      .eq('name', companyName)
      .is('deleted_at', null)
      .maybeSingle();
    if (existingCompany) {
      // Roll back the user insert if company name already taken
      await supabase.from('users').delete().eq('id', user.id);
      throw new AppError('A company with this name already exists', 409, 'COMPANY_NAME_EXISTS');
    }
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

  // Resolve fullName from the right table per role
  let fullName = user.full_name || null;
  if (user.role === 'employee') {
    const { data: emp } = await supabase
      .from('employees').select('full_name').eq('user_id', user.id).maybeSingle();
    fullName = emp?.full_name || fullName;
  } else if (user.role === 'company_admin') {
    const { data: company } = await supabase
      .from('companies').select('id, name').eq('user_id', user.id).is('deleted_at', null).maybeSingle();
    fullName = company?.name || fullName;
    var companyId = company?.id || null;
  }

  return {
    user: { id: user.id, email: user.email, role: user.role, fullName, emailVerified: user.email_verified, ...(companyId ? { companyId } : {}) },
    access_token: accessToken,
    refresh_token: refreshToken,
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
    .select('id, email, role, email_verified, is_active, created_at, full_name')
    .eq('id', userId)
    .eq('is_deleted', false)
    .single();

  if (error || !user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  let employeeId = null;
  let fullName   = user.full_name || null;

  if (user.role === 'employee') {
    const { data: emp } = await supabase
      .from('employees')
      .select('id, full_name')
      .eq('user_id', userId)
      .maybeSingle();
    employeeId = emp?.id || null;
    fullName   = emp?.full_name || fullName;
  } else if (user.role === 'company_admin') {
    const { data: company } = await supabase
      .from('companies')
      .select('id, name')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .maybeSingle();
    fullName = company?.name || fullName;
    var companyId = company?.id || null;
  }
  // system_admin: fullName comes from users.full_name (set above)

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    fullName,
    employeeId,
    ...(companyId ? { companyId } : {}),
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

  try {
    await sendResetPasswordEmail({ to: user.email, name: user.email, token });
  } catch (emailErr) {
    console.error('⚠️ Failed to send reset email (non-fatal):', emailErr.message);
  }
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

// ─── UPDATE ME (authenticated profile update) ─────────────────────────────────
const updateMe = async (userId, userRole, { fullName, bio, currentPosition, email }) => {
  let emailChanged = false;

  // ── Email change (all roles) ──────────────────────────────────────────────
  if (email !== undefined) {
    const trimmed = email.trim().toLowerCase();
    const { data: currentUser } = await supabase
      .from('users').select('email').eq('id', userId).maybeSingle();
    if (currentUser && trimmed !== currentUser.email) {
      const { data: taken } = await supabase
        .from('users').select('id').eq('email', trimmed).maybeSingle();
      if (taken) throw new AppError('Email is already in use by another account', 409, 'EMAIL_EXISTS');
      await supabase.from('users').update({ email: trimmed }).eq('id', userId);
      // Revoke all sessions — user must re-login with new email
      await supabase.from('refresh_tokens').update({ is_revoked: true }).eq('user_id', userId);
      emailChanged = true;
    }
  }

  // ── Role-specific field updates ───────────────────────────────────────────
  if (userRole === 'employee') {
    const { data: emp } = await supabase
      .from('employees').select('id').eq('user_id', userId).maybeSingle();
    if (emp) {
      const updates = {};
      if (fullName        !== undefined) updates.full_name         = fullName.trim();
      if (bio             !== undefined) updates.bio               = bio;
      if (currentPosition !== undefined) updates.current_position = currentPosition.trim();
      if (Object.keys(updates).length) {
        const { error: empErr } = await supabase.from('employees').update(updates).eq('id', emp.id);
        if (empErr) throw empErr;
      }
    }
  } else if (userRole === 'company_admin') {
    const { data: company } = await supabase
      .from('companies').select('id').eq('user_id', userId).is('deleted_at', null).maybeSingle();
    if (company && fullName) {
      await supabase.from('companies').update({ name: fullName.trim() }).eq('id', company.id);
    }
  } else if (userRole === 'system_admin') {
    // Persists to users.full_name (requires the add_full_name_to_users migration)
    if (fullName !== undefined) {
      await supabase.from('users').update({ full_name: fullName.trim() }).eq('id', userId);
    }
  }

  return { emailChanged };
};

// ─── CHANGE PASSWORD (authenticated) ────────────────────────────────────────
const changePassword = async (userId, { currentPassword, newPassword }) => {
  const { data: user, error } = await supabase
    .from('users')
    .select('password_hash')
    .eq('id', userId)
    .maybeSingle();

  if (error || !user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');

  const valid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!valid) throw new AppError('Current password is incorrect', 401, 'WRONG_PASSWORD');

  const same = await bcrypt.compare(newPassword, user.password_hash);
  if (same) throw new AppError('New password must be different from your current password', 400, 'SAME_PASSWORD');

  const password_hash = await bcrypt.hash(newPassword, 12);
  await supabase.from('users').update({ password_hash }).eq('id', userId);

  // Revoke all refresh tokens so old sessions are invalidated
  await supabase
    .from('refresh_tokens')
    .update({ is_revoked: true })
    .eq('user_id', userId);
};

module.exports = { registerUser, loginUser, refreshToken, logout, getMe, updateMe, verifyEmail, forgotPassword, resetPassword, changePassword, validateResetToken };

// ─── VALIDATE RESET TOKEN ─────────────────────────────────────────────────────
async function validateResetToken(token) {
  const { data: record } = await supabase
    .from('password_reset_tokens')
    .select('id, used_at, expires_at')
    .eq('token', token)
    .maybeSingle();

  if (!record) return { valid: false, reason: 'Invalid reset link.' };
  if (record.used_at) return { valid: false, reason: 'This reset link has already been used.' };
  if (new Date(record.expires_at) < new Date()) return { valid: false, reason: 'This reset link has expired.' };
  return { valid: true };
}

//baraa