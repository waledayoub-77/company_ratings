// Verification Service — handles ID + company doc verification
const supabase = require('../config/database');
const { AppError } = require('../middlewares/errorHandler');

/**
 * Upload identity verification document
 */
const submitIdentityVerification = async (userId, { documentUrl, documentType }) => {
  // Check for existing pending request
  const { data: existing } = await supabase
    .from('verification_requests')
    .select('id, status')
    .eq('user_id', userId)
    .eq('verification_type', 'identity')
    .in('status', ['pending', 'approved'])
    .maybeSingle();

  if (existing?.status === 'approved') {
    throw new AppError('Your identity is already verified', 400, 'ALREADY_VERIFIED');
  }
  if (existing?.status === 'pending') {
    throw new AppError('You already have a pending verification request', 400, 'PENDING_EXISTS');
  }

  const { data, error } = await supabase
    .from('verification_requests')
    .insert({
      user_id: userId,
      verification_type: 'identity',
      document_url: documentUrl,
      document_type: documentType || 'national_id',
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Supabase error in submitIdentityVerification:', error);
    throw new AppError('Failed to submit verification request', 500);
  }

  return data;
};

/**
 * Upload company document verification
 */
const submitCompanyVerification = async (userId, companyId, { documentUrl, documentType }) => {
  // Verify user owns this company
  const { data: company } = await supabase
    .from('companies')
    .select('id, user_id')
    .eq('id', companyId)
    .is('deleted_at', null)
    .single();

  if (!company || company.user_id !== userId) {
    throw new AppError('You do not own this company', 403);
  }

  // Check existing
  const { data: existing } = await supabase
    .from('verification_requests')
    .select('id, status')
    .eq('user_id', userId)
    .eq('verification_type', 'company')
    .in('status', ['pending', 'approved'])
    .maybeSingle();

  if (existing?.status === 'approved') {
    throw new AppError('Company documents already verified', 400, 'ALREADY_VERIFIED');
  }
  if (existing?.status === 'pending') {
    throw new AppError('A verification request is already pending', 400, 'PENDING_EXISTS');
  }

  const { data, error } = await supabase
    .from('verification_requests')
    .insert({
      user_id: userId,
      verification_type: 'company',
      document_url: documentUrl,
      document_type: documentType || 'business_license',
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Supabase error in submitCompanyVerification:', error);
    throw new AppError('Failed to submit company verification', 500);
  }

  return data;
};

/**
 * Get all verification requests (admin)
 */
const getVerificationRequests = async (filters = {}) => {
  const { status, type, page = 1, limit = 20 } = filters;
  const offset = (Math.max(1, parseInt(page)) - 1) * Math.max(1, parseInt(limit));

  let query = supabase
    .from('verification_requests')
    .select('*, users!verification_requests_user_id_fkey(email, full_name, role)', { count: 'exact' });

  if (status) query = query.eq('status', status);
  if (type) query = query.eq('verification_type', type);

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + parseInt(limit) - 1);

  if (error) {
    console.error('❌ Supabase error in getVerificationRequests:', error);
    throw new AppError('Failed to fetch verification requests', 500);
  }

  return {
    requests: data || [],
    pagination: {
      total: count || 0,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil((count || 0) / parseInt(limit)),
    },
  };
};

/**
 * Approve verification request (admin)
 */
const approveVerification = async (requestId, adminId, adminNotes) => {
  const { data: request, error: fetchError } = await supabase
    .from('verification_requests')
    .select('*')
    .eq('id', requestId)
    .single();

  if (fetchError || !request) {
    throw new AppError('Verification request not found', 404);
  }
  if (request.status !== 'pending') {
    throw new AppError('Request has already been processed', 400);
  }

  // Update the request
  await supabase
    .from('verification_requests')
    .update({
      status: 'approved',
      reviewed_by: adminId,
      reviewed_at: new Date().toISOString(),
      admin_notes: adminNotes || null,
    })
    .eq('id', requestId);

  // Mark user/company as verified
  if (request.verification_type === 'identity') {
    await supabase
      .from('users')
      .update({ identity_verified: true })
      .eq('id', request.user_id);


  } else if (request.verification_type === 'company') {
    // Find the company owned by this user
    const { data: company } = await supabase
      .from('companies')
      .select('id')
      .eq('user_id', request.user_id)
      .is('deleted_at', null)
      .maybeSingle();

    if (company) {
      await supabase
        .from('companies')
        .update({ is_document_verified: true })
        .eq('id', company.id);
    }
  }

  return { message: 'Verification approved' };
};

/**
 * Reject verification request (admin)
 */
const rejectVerification = async (requestId, adminId, adminNotes) => {
  const { data: request, error: fetchError } = await supabase
    .from('verification_requests')
    .select('*')
    .eq('id', requestId)
    .single();

  if (fetchError || !request) {
    throw new AppError('Verification request not found', 404);
  }
  if (request.status !== 'pending') {
    throw new AppError('Request has already been processed', 400);
  }

  await supabase
    .from('verification_requests')
    .update({
      status: 'rejected',
      reviewed_by: adminId,
      reviewed_at: new Date().toISOString(),
      admin_notes: adminNotes || 'Rejected',
    })
    .eq('id', requestId);

  return { message: 'Verification rejected' };
};

/**
 * Get user's verification status
 */
const getMyVerificationStatus = async (userId) => {
  const { data: user } = await supabase
    .from('users')
    .select('identity_verified')
    .eq('id', userId)
    .single();

  const { data: requests } = await supabase
    .from('verification_requests')
    .select('id, verification_type, status, document_type, admin_notes, created_at, reviewed_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  return {
    identityVerified: user?.identity_verified || false,
    requests: requests || [],
  };
};

module.exports = {
  submitIdentityVerification,
  submitCompanyVerification,
  getVerificationRequests,
  approveVerification,
  rejectVerification,
  getMyVerificationStatus,
};
