const supabase = require("../config/database");
const crypto = require("crypto");

/**
 * Check if a company email is revoked for a given company
 */
async function checkRevokedEmail(companyId, companyEmail) {
  if (!companyEmail) return false;
  const { data } = await supabase
    .from('revoked_company_emails')
    .select('id')
    .eq('company_id', companyId)
    .eq('email', companyEmail.toLowerCase())
    .maybeSingle();
  return !!data;
}

/**
 * Revoke a company email when employment ends
 */
async function revokeCompanyEmail(companyId, companyEmail, employeeId) {
  if (!companyEmail) return;
  const { error } = await supabase
    .from('revoked_company_emails')
    .upsert({
      company_id: companyId,
      email: companyEmail.toLowerCase(),
      reason: 'Employment ended by admin',
      revoked_at: new Date().toISOString(),
    }, { onConflict: 'company_id,email' });
  if (error) console.error('revokeCompanyEmail error:', error.message);
}

async function requestEmployment({ employeeId, companyId, position, department, startDate }) {
  // 1) company exists
  const { data: company, error: companyErr } = await supabase
    .from("companies")
    .select("id")
    .eq("id", companyId)
    .is("deleted_at", null)
    .single();

  if (companyErr || !company) return { error: "Company not found" };

  // 2) prevent duplicates — block if there's a pending request or an active current employment
  //    (allows re-applying only after employment is ended AND old record is not pending)
  const { data: existing, error: existingErr } = await supabase
    .from("employments")
    .select("id, verification_status, is_current")
    .eq("employee_id", employeeId)
    .eq("company_id", companyId)
    .is("deleted_at", null)
    .limit(10);

  if (existingErr) return { error: "Database error checking existing employment" };

  if (existing && existing.length > 0) {
    const hasPending = existing.some(e => e.verification_status === "pending");
    const hasCurrentApproved = existing.some(e => e.verification_status === "approved" && e.is_current === true);

    if (hasPending) return { error: "You already have a pending employment request for this company" };
    if (hasCurrentApproved) return { error: "You already have an active approved employment at this company" };
  }

  // 3) insert request
  const payload = {
    employee_id: employeeId,
    company_id: companyId,
    position,
    department: department || null,
    start_date: startDate,
    is_current: true,
    verification_status: "pending"
  };

  const { data, error } = await supabase
    .from("employments")
    .insert(payload)
    .select("*")
    .single();

  if (error) return { error: error.message };
  return { data };
}

async function listEmploymentsByEmployee(employeeId) {
  const { data, error } = await supabase
    .from("employments")
    .select(
      `
      id,
      company_id,
      position,
      department,
      start_date,
      end_date,
      is_current,
      verification_status,
      rejection_note,
      verified_at,
      created_at,
      companies (
        id,
        name,
        industry,
        location,
        logo_url
      )
    `
    )
    .eq("employee_id", employeeId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) return { error: error.message };
  return { data };
}

async function updateEmploymentStatus({ employmentId, companyId, adminUserId, status, rejectionNote }) {
  const { data: emp, error: empErr } = await supabase
    .from("employments")
    .select("id, company_id, employee_id")
    .eq("id", employmentId)
    .is("deleted_at", null)
    .single();

  if (empErr || !emp) return { error: "Employment not found" };
  if (emp.company_id !== companyId) return { error: "Not allowed for this company" };

  // If approving: soft-delete any prior approved (ended) records for this employee+company
  // to avoid violating the DB unique index on (employee_id, company_id) WHERE approved
  if (status === "approved") {
    await supabase
      .from("employments")
      .update({ deleted_at: new Date().toISOString() })
      .eq("employee_id", emp.employee_id)
      .eq("company_id", companyId)
      .eq("verification_status", "approved")
      .eq("is_current", false)
      .neq("id", employmentId)
      .is("deleted_at", null);
  }

  const patch = {
    verification_status: status,
    verified_by: status === "approved" ? adminUserId : null,
    verified_at: status === "approved" ? new Date().toISOString() : null,
    rejection_note: status === "rejected" ? (rejectionNote || "Rejected") : null
  };

  const { data, error } = await supabase
    .from("employments")
    .update(patch)
    .eq("id", employmentId)
    .select("*")
    .single();

  if (error) return { error: error.message };
  return { data };
}

/**
 * Create an employment invitation from company admin
 */
async function inviteEmployee({ companyId, email, position, department, startDate }) {
  // Check if company exists
  const { data: company, error: companyErr } = await supabase
    .from('companies')
    .select('id, name')
    .eq('id', companyId)
    .is('deleted_at', null)
    .single();
  if (companyErr || !company) return { error: 'Company not found' };

  // Check if email is revoked for this company
  const isRevoked = await checkRevokedEmail(companyId, email);
  if (isRevoked) return { error: 'This email has been revoked for this company and cannot be used to rejoin' };

  // Check if the user already exists
  const { data: existingUser } = await supabase
    .from('users')
    .select('id, email, role, full_name')
    .eq('email', email.toLowerCase())
    .maybeSingle();

  if (!existingUser) {
    return { error: 'No account found for this email. The user must register first before they can be invited.' };
  }

  // Get or create employee record
  let { data: emp } = await supabase
    .from('employees')
    .select('id')
    .eq('user_id', existingUser.id)
    .is('deleted_at', null)
    .maybeSingle();

  if (!emp) {
    // Create employee record for existing user
    const { data: newEmp, error: empErr } = await supabase
      .from('employees')
      .insert({ user_id: existingUser.id, full_name: existingUser.full_name || 'Employee' })
      .select()
      .single();
    if (empErr) return { error: 'Failed to create employee profile for this user' };
    emp = newEmp;
  }

  const employeeId = emp.id;

  // Check existing employment
  const { data: existing } = await supabase
    .from('employments')
    .select('id, verification_status, is_current')
    .eq('employee_id', employeeId)
    .eq('company_id', companyId)
    .is('deleted_at', null)
    .limit(10);

  if (existing && existing.length > 0) {
    const hasPending = existing.some(e => e.verification_status === 'pending');
    const hasCurrentApproved = existing.some(e => e.verification_status === 'approved' && e.is_current === true);
    if (hasPending) return { error: 'There is already a pending invitation for this employee' };
    if (hasCurrentApproved) return { error: 'This employee already works at this company' };
  }

  // Generate invite token
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const payload = {
    employee_id: employeeId,
    company_id: companyId,
    position: position || 'Employee',
    department: department || null,
    start_date: startDate || new Date().toISOString().split('T')[0],
    is_current: true,
    verification_status: 'pending',
    source: 'invite',
    invite_token: token,
    invite_expires_at: expiresAt,
    invite_email: email.toLowerCase(),
  };

  const { data, error } = await supabase
    .from('employments')
    .insert(payload)
    .select('*')
    .single();

  if (error) return { error: error.message };
  return { data, token, companyName: company.name };
}

/**
 * Accept an employment invitation
 */
async function acceptInvite(token, userId) {
  // Find the invitation
  const { data: employment, error: findErr } = await supabase
    .from('employments')
    .select('*')
    .eq('invite_token', token)
    .eq('source', 'invite')
    .is('deleted_at', null)
    .single();

  if (findErr || !employment) return { error: 'Invitation not found or already used' };
  if (employment.verification_status === 'approved') return { error: 'Invitation already accepted' };
  if (new Date(employment.invite_expires_at) < new Date()) return { error: 'Invitation has expired' };

  // Get or create employee record for this user
  let { data: employee } = await supabase
    .from('employees')
    .select('id')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .maybeSingle();

  if (!employee) {
    // Get user info to create employee record
    const { data: user } = await supabase.from('users').select('full_name').eq('id', userId).single();
    const { data: newEmp, error: empErr } = await supabase
      .from('employees')
      .insert({ user_id: userId, full_name: user?.full_name || 'Employee' })
      .select()
      .single();
    if (empErr) return { error: 'Failed to create employee profile' };
    employee = newEmp;
  }

  // Soft-delete any prior approved ended records to avoid unique constraint issues
  await supabase
    .from('employments')
    .update({ deleted_at: new Date().toISOString() })
    .eq('employee_id', employee.id)
    .eq('company_id', employment.company_id)
    .eq('verification_status', 'approved')
    .eq('is_current', false)
    .neq('id', employment.id)
    .is('deleted_at', null);

  // Update the employment record
  const { data: updated, error: upErr } = await supabase
    .from('employments')
    .update({
      employee_id: employee.id,
      verification_status: 'approved',
      verified_at: new Date().toISOString(),
      invite_token: null,
    })
    .eq('id', employment.id)
    .select('*')
    .single();

  if (upErr) return { error: upErr.message };
  return { data: updated };
}

/**
 * Get pending invitations for a company
 */
async function getPendingInvites(companyId) {
  const { data, error } = await supabase
    .from('employments')
    .select('id, invite_email, position, department, start_date, invite_expires_at, created_at')
    .eq('company_id', companyId)
    .eq('source', 'invite')
    .eq('verification_status', 'pending')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) return { error: error.message };
  return { data: data || [] };
}

/**
 * Cancel an invitation
 */
async function cancelInvite(inviteId, companyId) {
  const { data: emp } = await supabase
    .from('employments')
    .select('id, company_id, source, verification_status')
    .eq('id', inviteId)
    .is('deleted_at', null)
    .single();

  if (!emp) return { error: 'Invitation not found' };
  if (emp.company_id !== companyId) return { error: 'Not your company' };
  if (emp.source !== 'invite') return { error: 'Not an invitation' };
  if (emp.verification_status !== 'pending') return { error: 'Invite already processed' };

  const { error } = await supabase
    .from('employments')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', inviteId);

  if (error) return { error: error.message };
  return { data: true };
}

/**
 * Resend an invitation (regenerate token)
 */
async function resendInvite(inviteId, companyId) {
  const { data: emp } = await supabase
    .from('employments')
    .select('id, company_id, source, verification_status, invite_email')
    .eq('id', inviteId)
    .is('deleted_at', null)
    .single();

  if (!emp) return { error: 'Invitation not found' };
  if (emp.company_id !== companyId) return { error: 'Not your company' };
  if (emp.source !== 'invite') return { error: 'Not an invitation' };
  if (emp.verification_status !== 'pending') return { error: 'Invite already processed' };

  const newToken = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('employments')
    .update({ invite_token: newToken, invite_expires_at: expiresAt })
    .eq('id', inviteId)
    .select('*')
    .single();

  if (error) return { error: error.message };

  // Get company name for email
  const { data: company } = await supabase
    .from('companies')
    .select('name')
    .eq('id', companyId)
    .single();

  return { data, token: newToken, companyName: company?.name || 'Company', email: emp.invite_email };
}

/**
 * End an employee's employment by admin
 */
async function endEmploymentByAdmin({ employmentId, companyId, adminUserId, endDate, reason }) {
  const { data: emp, error: empErr } = await supabase
    .from('employments')
    .select('id, company_id, employee_id, is_current, company_email')
    .eq('id', employmentId)
    .is('deleted_at', null)
    .single();

  if (empErr || !emp) return { error: 'Employment not found' };
  if (emp.company_id !== companyId) return { error: 'Employment does not belong to your company' };
  if (!emp.is_current) return { error: 'Employment already ended' };

  const { data, error } = await supabase
    .from('employments')
    .update({
      is_current: false,
      end_date: endDate || new Date().toISOString().split('T')[0],
      ended_by_admin: true,
      ended_by_admin_id: adminUserId,
      end_reason: reason || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', employmentId)
    .select('*')
    .single();

  if (error) return { error: error.message };

  // Revoke company email if set (Feature 4)
  if (emp.company_email) {
    await revokeCompanyEmail(companyId, emp.company_email, emp.employee_id);
  }

  return { data };
}

module.exports = {
  requestEmployment,
  listEmploymentsByEmployee,
  updateEmploymentStatus,
  inviteEmployee,
  acceptInvite,
  getPendingInvites,
  cancelInvite,
  resendInvite,
  endEmploymentByAdmin,
  checkRevokedEmail,
  revokeCompanyEmail,
};