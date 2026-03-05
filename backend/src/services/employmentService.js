const supabase = require("../config/database");

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

module.exports = {
  requestEmployment,
  listEmploymentsByEmployee,
  updateEmploymentStatus,
  inviteEmployee,
  acceptInvite,
  getPendingInvites,
  endByAdmin,
};

// ─── Feature 1: Admin invite employee ────────────────────────────────────────

async function inviteEmployee({ companyId, adminUserId, inviteEmail, position, department, startDate }) {
  // Verify admin owns the company
  const { data: company, error: cErr } = await supabase
    .from('companies')
    .select('id, name')
    .eq('id', companyId)
    .eq('user_id', adminUserId)
    .is('deleted_at', null)
    .single();
  if (cErr || !company) return { error: 'Company not found or not authorized' };

  // Feature 4: check revoked emails
  const { data: revoked } = await supabase
    .from('revoked_company_emails')
    .select('id')
    .eq('company_id', companyId)
    .eq('company_email', inviteEmail.toLowerCase())
    .limit(1);
  if (revoked && revoked.length > 0) {
    return { error: 'This email address has been revoked from this company and cannot be re-invited.' };
  }

  // Find user by email (may not exist yet)
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('email', inviteEmail.toLowerCase())
    .maybeSingle();
  const employeeId = user?.id
    ? (await supabase.from('employees').select('id').eq('user_id', user.id).maybeSingle()).data?.id
    : null;

  if (employeeId) {
    // Check for existing active employment
    const { data: existing } = await supabase
      .from('employments')
      .select('id, verification_status, is_current')
      .eq('employee_id', employeeId)
      .eq('company_id', companyId)
      .is('deleted_at', null);
    if (existing?.some(e => e.verification_status === 'pending' || (e.verification_status === 'approved' && e.is_current))) {
      return { error: 'This employee already has a pending or active employment at this company' };
    }
  }

  const token = require('crypto').randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const payload = {
    company_id: companyId,
    position,
    department: department || null,
    start_date: startDate,
    is_current: true,
    verification_status: 'pending',
    source: 'invite',
    invite_email: inviteEmail.toLowerCase(),
    invitation_token: token,
    invitation_expires_at: expiresAt,
  };
  if (employeeId) payload.employee_id = employeeId;

  const { data, error } = await supabase
    .from('employments')
    .insert(payload)
    .select('*')
    .single();

  if (error) return { error: error.message };
  return { data, token, company };
}

async function acceptInvite({ token, userId }) {
  // Find the invite
  const { data: invite, error: iErr } = await supabase
    .from('employments')
    .select('*')
    .eq('invitation_token', token)
    .is('deleted_at', null)
    .maybeSingle();

  if (iErr || !invite) return { error: 'Invalid or expired invite link' };
  if (!invite.invitation_expires_at || new Date(invite.invitation_expires_at) < new Date()) {
    return { error: 'This invite link has expired' };
  }
  if (invite.verification_status !== 'pending' || invite.source !== 'invite') {
    return { error: 'This invite has already been used or is no longer valid' };
  }

  // Get the employee record for this user
  const { data: employee } = await supabase
    .from('employees')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();
  if (!employee) return { error: 'Employee profile not found. Please complete your profile first.' };

  // Confirm email matches (if invite_email set)
  const { data: userRecord } = await supabase.from('users').select('email').eq('id', userId).single();
  if (invite.invite_email && userRecord?.email?.toLowerCase() !== invite.invite_email.toLowerCase()) {
    return { error: 'This invite was not sent to your email address' };
  }

  // Identity check
  const { data: userVerif } = await supabase.from('users').select('identity_verified').eq('id', userId).single();
  if (!userVerif?.identity_verified) {
    return { error: 'Identity verification required before accepting invites.' };
  }

  const { data, error } = await supabase
    .from('employments')
    .update({ employee_id: employee.id, invitation_token: null, invitation_expires_at: null })
    .eq('id', invite.id)
    .select('*')
    .single();

  if (error) return { error: error.message };
  return { data };
}

async function getPendingInvites(companyId) {
  const { data, error } = await supabase
    .from('employments')
    .select('id, invite_email, position, department, start_date, created_at, invitation_expires_at, employee_id, employees:employee_id(id, full_name)')
    .eq('company_id', companyId)
    .eq('source', 'invite')
    .eq('verification_status', 'pending')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
  if (error) return { error: error.message };
  return { data };
}

// ─── Feature 2: Admin end employment ─────────────────────────────────────────

async function endByAdmin({ employmentId, companyId, adminUserId, endReason, endDate }) {
  const today = new Date().toISOString().split('T')[0];
  const resolvedEndDate = endDate || today;

  const { data: emp, error: empErr } = await supabase
    .from('employments')
    .select('*')
    .eq('id', employmentId)
    .eq('company_id', companyId)
    .is('deleted_at', null)
    .single();

  if (empErr || !emp) return { error: 'Employment not found' };
  if (!emp.is_current) return { error: 'Employment is already ended' };
  if (emp.verification_status !== 'approved') return { error: 'Only approved employments can be ended by admin' };

  const patch = {
    end_date: resolvedEndDate,
    is_current: false,
    ended_by_admin: true,
    ended_by_admin_id: adminUserId,
    end_reason: endReason || null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('employments')
    .update(patch)
    .eq('id', employmentId)
    .select('*')
    .single();

  if (error) return { error: error.message };

  // Feature 4: If company_email present, record to revoked_company_emails
  if (emp.company_email) {
    await supabase.from('revoked_company_emails').upsert({
      company_id: companyId,
      company_email: emp.company_email.toLowerCase(),
      employee_id: emp.employee_id,
      ended_at: new Date().toISOString(),
    }, { onConflict: 'company_id,company_email', ignoreDuplicates: false });
  }

  return { data };
}