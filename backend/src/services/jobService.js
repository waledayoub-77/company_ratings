// Job Service — Feature 5: Job Positions + CV Pipeline
const supabase = require('../config/database');

// ─── Admin: manage positions ──────────────────────────────────────────────────

async function createPosition({ companyId, adminUserId, title, description, requirements, salaryMin, salaryMax, isActive = true }) {
  const { data: company } = await supabase
    .from('companies')
    .select('id')
    .eq('id', companyId)
    .eq('user_id', adminUserId)
    .is('deleted_at', null)
    .single();
  if (!company) return { error: 'Company not found or not authorized' };

  const { data, error } = await supabase
    .from('job_positions')
    .insert({ 
      company_id: companyId, 
      title, 
      description: description || null, 
      requirements: requirements || null,
      salary_min: salaryMin ? parseInt(salaryMin) : null,
      salary_max: salaryMax ? parseInt(salaryMax) : null,
      is_active: isActive,
      created_by: adminUserId,
    })
    .select('*')
    .single();
  if (error) return { error: error.message };
  return { data };
}

async function updatePosition({ positionId, companyId, adminUserId, title, description, requirements, salaryMin, salaryMax, isActive }) {
  const { data: pos } = await supabase
    .from('job_positions')
    .select('id, company_id')
    .eq('id', positionId)
    .is('deleted_at', null)
    .single();
  if (!pos || pos.company_id !== companyId) return { error: 'Position not found' };

  const patch = {};
  if (title !== undefined) patch.title = title;
  if (description !== undefined) patch.description = description;
  if (requirements !== undefined) patch.requirements = requirements;
  if (salaryMin !== undefined) patch.salary_min = salaryMin ? parseInt(salaryMin) : null;
  if (salaryMax !== undefined) patch.salary_max = salaryMax ? parseInt(salaryMax) : null;
  if (isActive !== undefined) patch.is_active = isActive;

  const { data, error } = await supabase
    .from('job_positions')
    .update(patch)
    .eq('id', positionId)
    .select('*')
    .single();
  if (error) return { error: error.message };
  return { data };
}

async function deletePosition({ positionId, companyId, adminUserId }) {
  const { data: pos } = await supabase
    .from('job_positions')
    .select('id, company_id')
    .eq('id', positionId)
    .is('deleted_at', null)
    .single();
  if (!pos || pos.company_id !== companyId) return { error: 'Position not found' };
  const { error } = await supabase
    .from('job_positions')
    .update({ deleted_at: new Date().toISOString(), is_active: false })
    .eq('id', positionId);
  if (error) return { error: error.message };
  return { success: true };
}

async function getCompanyPositions(companyId, adminOnly = false) {
  let q = supabase
    .from('job_positions')
    .select('*')
    .eq('company_id', companyId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
  if (!adminOnly) q = q.eq('is_active', true);
  const { data, error } = await q;
  if (error) return { error: error.message };
  return { data };
}

// ─── Employee: applications ───────────────────────────────────────────────────

async function applyToPosition({ positionId, applicantId, coverLetter, cvUrl, cvFileName }) {
  // Check position is active
  const { data: pos } = await supabase
    .from('job_positions')
    .select('id, company_id, is_active, title')
    .eq('id', positionId)
    .is('deleted_at', null)
    .single();
  if (!pos || !pos.is_active) return { error: 'Job position not found or no longer active' };

  // Prevent duplicate applications
  const { data: existing } = await supabase
    .from('job_applications')
    .select('id')
    .eq('position_id', positionId)
    .eq('applicant_id', applicantId)
    .is('deleted_at', null)
    .maybeSingle();
  if (existing) return { error: 'You have already applied to this position' };

  const { data, error } = await supabase
    .from('job_applications')
    .insert({
      position_id: positionId,
      applicant_id: applicantId,
      cover_letter: coverLetter || null,
      cv_url: cvUrl || null,
      cv_file_name: cvFileName || null,
      status: 'pending',
    })
    .select('*')
    .single();
  if (error) return { error: error.message };
  return { data, position: pos };
}

async function getApplicationsForPosition(positionId, companyId) {
  const { data: pos } = await supabase
    .from('job_positions')
    .select('id, company_id')
    .eq('id', positionId)
    .single();
  if (!pos || pos.company_id !== companyId) return { error: 'Position not found' };

  const { data, error } = await supabase
    .from('job_applications')
    .select(`
      id, status, cover_letter, resume_url, applied_at, updated_at,
      employees:applicant_id ( id, full_name, user:employee_id ( email ) )
    `)
    .eq('position_id', positionId)
    .is('deleted_at', null)
    .order('applied_at', { ascending: false });
  if (error) return { error: error.message };
  return { data };
}

async function getMyApplications(applicantId) {
  const { data, error } = await supabase
    .from('job_applications')
    .select(`
      id, status, cover_letter, resume_url, applied_at, updated_at,
      job_positions:position_id ( id, title, company_id, companies:company_id ( id, name ) )
    `)
    .eq('applicant_id', applicantId)
    .is('deleted_at', null)
    .order('applied_at', { ascending: false });
  if (error) return { error: error.message };
  return { data };
}

async function updateApplicationStatus({ applicationId, companyId, status, adminUserId }) {
  if (!['pending', 'interview', 'approved', 'rejected'].includes(status)) {
    return { error: 'Invalid status' };
  }
  // Verify company admin owns this application's position
  const { data: app } = await supabase
    .from('job_applications')
    .select('id, position_id, applicant_id, job_positions:position_id(company_id)')
    .eq('id', applicationId)
    .is('deleted_at', null)
    .single();
  if (!app) return { error: 'Application not found' };
  if (app.job_positions?.company_id !== companyId) return { error: 'Not authorized' };

  const { data, error } = await supabase
    .from('job_applications')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', applicationId)
    .select('*')
    .single();
  if (error) return { error: error.message };
  return { data, applicantId: app.applicant_id };
}

module.exports = {
  createPosition,
  updatePosition,
  deletePosition,
  getCompanyPositions,
  applyToPosition,
  getApplicationsForPosition,
  getMyApplications,
  updateApplicationStatus,
};
