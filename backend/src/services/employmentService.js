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
  updateEmploymentStatus
};