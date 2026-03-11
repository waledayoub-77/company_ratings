// Job Service — Job Positions + CV Application Pipeline
const supabase = require('../config/database');
const { AppError } = require('../middlewares/errorHandler');

/**
 * Create a new job posting
 */
const createJobPosition = async (companyId, userId, { title, department, description, requirements, employmentType, location, salary }) => {
  // All fields required
  if (!title || !title.trim()) throw new AppError('Title is required', 400);
  if (!description || !description.trim()) throw new AppError('Description is required', 400);
  if (!requirements || !requirements.trim()) throw new AppError('Requirements are required', 400);
  if (!location || !location.trim()) throw new AppError('Location is required', 400);
  const locationClean = location.trim();

  // Verify user owns the company
  const { data: company } = await supabase
    .from('companies')
    .select('id, user_id')
    .eq('id', companyId)
    .is('deleted_at', null)
    .single();

  if (!company || company.user_id !== userId) {
    throw new AppError('You do not own this company', 403);
  }

  const { data, error } = await supabase
    .from('job_positions')
    .insert({
      company_id: companyId,
      title: title.trim(),
      department: department || null,
      description: description.trim(),
      requirements: requirements.trim(),
      location: locationClean,
      employment_type: employmentType || 'full-time',
      salary: salary || null,
      is_active: true,
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Supabase error in createJobPosition:', error);
    throw new AppError('Failed to create job position', 500);
  }
  return data;
};

/**
 * Get active job positions for a company
 */
const getJobPositions = async (companyId) => {
  const { data, error } = await supabase
    .from('job_positions')
    .select('*')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) throw new AppError('Failed to fetch job positions', 500);
  return data || [];
};

/**
 * Get all job positions for a company (including closed) - admin view
 */
const getAllJobPositions = async (companyId) => {
  const { data, error } = await supabase
    .from('job_positions')
    .select('*')
    .eq('company_id', companyId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) throw new AppError('Failed to fetch job positions', 500);
  return data || [];
};

/**
 * Get all active job positions across all companies (for employee job board)
 */
const getAllActiveJobs = async () => {
  const { data, error } = await supabase
    .from('job_positions')
    .select('*, companies(name, logo_url, industry, location)')
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw new AppError('Failed to fetch job positions', 500);
  return data || [];
};

/**
 * Get single job position
 */
const getJobPositionById = async (positionId) => {
  const { data, error } = await supabase
    .from('job_positions')
    .select('*, companies(name, logo_url, industry, location)')
    .eq('id', positionId)
    .is('deleted_at', null)
    .single();

  if (error || !data) throw new AppError('Job position not found', 404);
  return data;
};

/**
 * Close a job position
 */
const closeJobPosition = async (positionId, userId) => {
  const position = await getJobPositionById(positionId);

  const { data: company } = await supabase
    .from('companies')
    .select('user_id')
    .eq('id', position.company_id)
    .single();

  if (!company || company.user_id !== userId) {
    throw new AppError('Only the company admin can close this position', 403);
  }

  const { data, error } = await supabase
    .from('job_positions')
    .update({ is_active: false, closed_at: new Date().toISOString() })
    .eq('id', positionId)
    .select()
    .single();

  if (error) throw new AppError('Failed to close job position', 500);
  return data;
};

/**
 * Soft delete a job position
 */
const deleteJobPosition = async (positionId, userId) => {
  const position = await getJobPositionById(positionId);

  const { data: company } = await supabase
    .from('companies')
    .select('user_id')
    .eq('id', position.company_id)
    .single();

  if (!company || company.user_id !== userId) {
    throw new AppError('Only the company admin can delete this position', 403);
  }

  const { error } = await supabase
    .from('job_positions')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', positionId);

  if (error) throw new AppError('Failed to delete job position', 500);
  return { message: 'Job position deleted' };
};

/**
 * Apply to a job position
 */
const applyToJob = async (positionId, applicantUserId, { cvUrl, coverLetter }) => {
  const position = await getJobPositionById(positionId);
  if (!position.is_active) throw new AppError('This position is no longer accepting applications', 400);

  // Look up employee record for this user
  const { data: employee } = await supabase
    .from('employees')
    .select('id')
    .eq('user_id', applicantUserId)
    .is('deleted_at', null)
    .maybeSingle();

  if (!employee) throw new AppError('Employee profile not found. Please complete your profile first.', 400);

  // Gate: employee must be verified by system admin before applying
  const { data: applicantUser } = await supabase
    .from('users')
    .select('identity_verified')
    .eq('id', applicantUserId)
    .single();

  if (!applicantUser?.identity_verified) {
    throw new AppError('You must be verified by a system admin before applying for jobs. Please submit your ID document on your Profile page and wait for approval.', 403);
  }

  // Check for duplicate application
  const { data: existing } = await supabase
    .from('job_applications')
    .select('id')
    .eq('position_id', positionId)
    .eq('applicant_id', employee.id)
    .maybeSingle();

  if (existing) throw new AppError('You have already applied to this position', 400);

  const { data, error } = await supabase
    .from('job_applications')
    .insert({
      position_id: positionId,
      company_id: position.company_id,
      applicant_id: employee.id,
      resume_url: cvUrl,
      cover_letter: coverLetter || null,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Supabase error in applyToJob:', error);
    throw new AppError('Failed to submit application', 500);
  }
  return data;
};

/**
 * Get applications for a job position (company admin)
 */
const getApplications = async (positionId, userId) => {
  const position = await getJobPositionById(positionId);

  const { data: company } = await supabase
    .from('companies')
    .select('user_id')
    .eq('id', position.company_id)
    .single();

  if (!company || company.user_id !== userId) {
    throw new AppError('Only the company admin can view applications', 403);
  }

  const { data, error } = await supabase
    .from('job_applications')
    .select('*, employees:applicant_id(id, full_name, user_id, users:user_id(email, id, avatar_url))')
    .eq('position_id', positionId)
    .order('created_at', { ascending: false });

  if (error) throw new AppError('Failed to fetch applications', 500);
  return data || [];
};

/**
 * Update application status
 */
const updateApplicationStatus = async (applicationId, userId, { status, adminNote }) => {
  const { data: application, error: appErr } = await supabase
    .from('job_applications')
    .select('*, job_positions!inner(title, company_id)')
    .eq('id', applicationId)
    .single();

  if (appErr || !application) throw new AppError('Application not found', 404);

  const { data: company } = await supabase
    .from('companies')
    .select('user_id, name')
    .eq('id', application.company_id)
    .single();

  if (!company || company.user_id !== userId) {
    throw new AppError('Only the company admin can update application status', 403);
  }

  // Valid transitions — 'interview→approved' only happens when employee accepts hire invite
  const validTransitions = {
    pending: ['interview', 'rejected'],
    interview: ['rejected'],
  };

  const allowed = validTransitions[application.status];
  if (!allowed || !allowed.includes(status)) {
    throw new AppError(`Cannot transition from ${application.status} to ${status}`, 400);
  }

  const updateData = {
    status,
    admin_note: adminNote || null,
    reviewed_by: userId,
    reviewed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('job_applications')
    .update(updateData)
    .eq('id', applicationId)
    .select()
    .single();

  if (error) throw new AppError('Failed to update application status', 500);

  return { data, companyName: company.name, positionTitle: application.job_positions.title };
};

/**
 * Get applications by user (employee view)
 */
const getMyApplications = async (userId) => {
  // Look up employee record for this user
  const { data: employee } = await supabase
    .from('employees')
    .select('id')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .maybeSingle();

  if (!employee) throw new AppError('Employee profile not found', 404);

  const { data, error } = await supabase
    .from('job_applications')
    .select('*, job_positions!inner(title, department, company_id, companies(name, logo_url))')
    .eq('applicant_id', employee.id)
    .order('created_at', { ascending: false });

  if (error) throw new AppError('Failed to fetch your applications', 500);
  return data || [];
};

/**
 * Send interview invitation (admin)
 */
const sendInvite = async (applicationId, userId) => {
  const { data: application, error: appErr } = await supabase
    .from('job_applications')
    .select('*, job_positions!inner(title, company_id)')
    .eq('id', applicationId)
    .single();

  if (appErr || !application) throw new AppError('Application not found', 404);
  if (application.status !== 'interview') throw new AppError('Application must be in interview status to send an invite', 400);

  const { data: company } = await supabase
    .from('companies')
    .select('user_id, name')
    .eq('id', application.company_id)
    .single();

  if (!company || company.user_id !== userId) throw new AppError('Only the company admin can send invitations', 403);

  const { data, error } = await supabase
    .from('job_applications')
    .update({ invite_sent_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', applicationId)
    .select()
    .single();

  if (error) throw new AppError('Failed to record invite', 500);

  const { data: employee } = await supabase
    .from('employees')
    .select('full_name, users:user_id(email, id)')
    .eq('id', application.applicant_id)
    .single();

  return { data, companyName: company.name, positionTitle: application.job_positions.title, employee };
};

/**
 * Send hire invitation (admin — for applications in interview status)
 */
const sendHireInvite = async (applicationId, userId) => {
  const { data: application, error: appErr } = await supabase
    .from('job_applications')
    .select('*, job_positions!inner(title, company_id)')
    .eq('id', applicationId)
    .single();

  if (appErr || !application) throw new AppError('Application not found', 404);
  if (application.status !== 'interview') throw new AppError('Application must be in interview status before sending a hire invitation', 400);

  const { data: company } = await supabase
    .from('companies')
    .select('user_id, name')
    .eq('id', application.company_id)
    .single();

  if (!company || company.user_id !== userId) throw new AppError('Only the company admin can send hire invitations', 403);

  const { data, error } = await supabase
    .from('job_applications')
    .update({ hire_invite_sent_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', applicationId)
    .select()
    .single();

  if (error) throw new AppError('Failed to send hire invitation', 500);

  const { data: employee } = await supabase
    .from('employees')
    .select('full_name, users:user_id(email, id)')
    .eq('id', application.applicant_id)
    .single();

  return { data, companyName: company.name, positionTitle: application.job_positions.title, employee };
};

/**
 * Accept hire invitation (employee) — creates employment record
 */
const acceptHireInvite = async (applicationId, userId) => {
  const { data: employee } = await supabase
    .from('employees')
    .select('id, users:user_id(identity_verified)')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .maybeSingle();

  if (!employee) throw new AppError('Employee profile not found', 404);

  const identityVerified = employee?.users?.identity_verified;
  if (!identityVerified) {
    throw new AppError('You must be verified by a system admin before you can accept employment offers. Please submit your ID document on your Profile page and wait for approval.', 403);
  }

  // Enforce single current employment constraint
  const { data: activeEmployment } = await supabase
    .from('employments')
    .select('id, company_id')
    .eq('employee_id', employee.id)
    .eq('is_current', true)
    .eq('verification_status', 'approved')
    .is('deleted_at', null)
    .maybeSingle();

  if (activeEmployment) {
    throw new AppError(
      'You are currently employed at another company. You must end your current employment before accepting a new offer.',
      400
    );
  }

  const { data: application, error: appErr } = await supabase
    .from('job_applications')
    .select('*, job_positions!inner(title, company_id)')
    .eq('id', applicationId)
    .eq('applicant_id', employee.id)
    .single();

  if (appErr || !application) throw new AppError('Application not found', 404);
  if (application.hire_invite_accepted_at) throw new AppError('Hire invitation already accepted', 400);
  if (!application.hire_invite_sent_at) throw new AppError('No hire invitation has been sent for this application', 400);
  if (application.status !== 'interview') throw new AppError('Application is not in interview status', 400);

  // Update application: accepted + set status to 'approved'
  const { data, error } = await supabase
    .from('job_applications')
    .update({
      hire_invite_accepted_at: new Date().toISOString(),
      status: 'approved',
      updated_at: new Date().toISOString(),
    })
    .eq('id', applicationId)
    .select()
    .single();

  if (error) throw new AppError('Failed to accept hire invitation', 500);

  const { data: company } = await supabase
    .from('companies')
    .select('name, user_id')
    .eq('id', application.company_id)
    .single();

  // Create employment record
  // Soft-delete any prior approved ended records to avoid unique constraint issues
  await supabase
    .from('employments')
    .update({ deleted_at: new Date().toISOString() })
    .eq('employee_id', employee.id)
    .eq('company_id', application.company_id)
    .eq('verification_status', 'approved')
    .eq('is_current', false)
    .is('deleted_at', null);

  await supabase.from('employments').insert({
    employee_id: employee.id,
    company_id: application.company_id,
    position: application.job_positions.title,
    is_current: true,
    verification_status: 'approved',
    source: 'job_application',
    start_date: new Date().toISOString().split('T')[0],
    verified_at: new Date().toISOString(),
    verified_by: company?.user_id,
  });

  return { data, companyName: company?.name, positionTitle: application.job_positions.title, adminUserId: company?.user_id };
};

/**
 * Accept interview invitation (employee)
 */
const acceptInvite = async (applicationId, userId) => {
  const { data: employee } = await supabase
    .from('employees')
    .select('id')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .maybeSingle();

  if (!employee) throw new AppError('Employee profile not found', 404);

  const { data: application, error: appErr } = await supabase
    .from('job_applications')
    .select('*, job_positions!inner(title, company_id)')
    .eq('id', applicationId)
    .eq('applicant_id', employee.id)
    .single();

  if (appErr || !application) throw new AppError('Application not found', 404);
  if (!application.invite_sent_at) throw new AppError('No invitation has been sent for this application', 400);
  if (application.invite_accepted_at) throw new AppError('Invitation already accepted', 400);

  const { data, error } = await supabase
    .from('job_applications')
    .update({ invite_accepted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', applicationId)
    .select()
    .single();

  if (error) throw new AppError('Failed to accept invite', 500);

  const { data: company } = await supabase
    .from('companies')
    .select('name, user_id')
    .eq('id', application.company_id)
    .single();

  return { data, companyName: company?.name, positionTitle: application.job_positions.title, adminUserId: company?.user_id };
};

/**
 * Employee rejects a hire invitation
 */
const rejectHireInvite = async (applicationId, userId) => {
  const { data: employee } = await supabase
    .from('employees')
    .select('id')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .maybeSingle();

  if (!employee) throw new AppError('Employee profile not found', 404);

  const { data: application, error: appErr } = await supabase
    .from('job_applications')
    .select('*, job_positions!inner(title, company_id)')
    .eq('id', applicationId)
    .eq('applicant_id', employee.id)
    .single();

  if (appErr || !application) throw new AppError('Application not found', 404);
  if (!application.hire_invite_sent_at) throw new AppError('No hire invitation has been sent for this application', 400);
  if (application.hire_invite_accepted_at) throw new AppError('Hire invitation already accepted', 400);

  const { data, error } = await supabase
    .from('job_applications')
    .update({
      hire_invite_rejected_at: new Date().toISOString(),
      status: 'rejected',
      updated_at: new Date().toISOString(),
    })
    .eq('id', applicationId)
    .select()
    .single();

  // If the column doesn't exist in the database the update will fail.
  // Fall back to updating only the `status` so the employee sees 'rejected'.
  if (error) {
    console.warn('Failed to set hire_invite_rejected_at:', error);
    const { data: fallbackData, error: fallbackErr } = await supabase
      .from('job_applications')
      .update({ status: 'rejected', updated_at: new Date().toISOString() })
      .eq('id', applicationId)
      .select()
      .single();
    if (fallbackErr) {
      console.error('Fallback update also failed in rejectHireInvite:', fallbackErr);
      throw new AppError('Failed to reject hire invitation', 500);
    }
    // Use fallback result
    return { data: fallbackData, companyName: (await supabase.from('companies').select('name, user_id').eq('id', application.company_id).single()).data?.name, positionTitle: application.job_positions.title, adminUserId: (await supabase.from('companies').select('user_id').eq('id', application.company_id).single()).data?.user_id };
  }

  const { data: company } = await supabase
    .from('companies')
    .select('name, user_id')
    .eq('id', application.company_id)
    .single();

  return { data, companyName: company?.name, positionTitle: application.job_positions.title, adminUserId: company?.user_id };
};

module.exports = {
  createJobPosition,
  getJobPositions,
  getAllJobPositions,
  getAllActiveJobs,
  getJobPositionById,
  closeJobPosition,
  deleteJobPosition,
  applyToJob,
  getApplications,
  updateApplicationStatus,
  getMyApplications,
  sendInvite,
  acceptInvite,
  sendHireInvite,
  acceptHireInvite,
  rejectHireInvite,
};
