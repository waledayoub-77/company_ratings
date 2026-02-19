const bcrypt = require('bcryptjs');
const { supabase } = require('../config/database');
const { AppError } = require('../middlewares/errorHandler');
const { generateAccessToken, generateRefreshToken } = require('../utils/jwt');

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

module.exports = { registerUser, loginUser };

//baraa