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

  // 2) prevent duplicates (same employee + company, not soft-deleted)
  const { data: existing, error: existingErr } = await supabase
    .from("employments")
    .select("id")
    .eq("employee_id", employeeId)
    .eq("company_id", companyId)
    .is("deleted_at", null)
    .limit(1);

  if (existingErr) return { error: "Database error checking existing employment" };
  if (existing && existing.length > 0) return { error: "Employment request already exists for this company" };

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
    .select("id, company_id")
    .eq("id", employmentId)
    .is("deleted_at", null)
    .single();

  if (empErr || !emp) return { error: "Employment not found" };
  if (emp.company_id !== companyId) return { error: "Not allowed for this company" };

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