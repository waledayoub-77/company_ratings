const supabase = require("../config/database");

async function checkVerifiedEmployment(employeeId, companyId) {
  const { data, error } = await supabase
    .from("employments")
    .select("id")
    .eq("employee_id", employeeId)
    .eq("company_id", companyId)
    .eq("verification_status", "approved")
    .is("deleted_at", null)
    .limit(1);

  if (error) return false;
  return Array.isArray(data) && data.length > 0;
}

module.exports = checkVerifiedEmployment;