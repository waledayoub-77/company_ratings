const supabase = require("../config/database");
const employmentService = require("../services/employmentService");
const {
  sendEmploymentRequestEmail,
  sendEmploymentApprovedEmail,
  sendEmploymentRejectedEmail
} = require("../services/emailService");

// POST /api/employments/request
exports.requestEmployment = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    // fetch employee_id from employees table
    const { data: employee, error: empErr } = await supabase
      .from("employees")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (empErr || !employee) {
      return res.status(400).json({ message: "Employee profile not linked to user" });
    }

    const { companyId, position, department, startDate } = req.body;
    if (!companyId || !position || !startDate) {
      return res.status(400).json({ message: "companyId, position, startDate are required" });
    }

    const result = await employmentService.requestEmployment({
      employeeId: employee.id,
      companyId,
      position,
      department,
      startDate
    });

    if (result.error) return res.status(400).json({ message: result.error });

    // Send email notification to company admin (non-blocking)
    try {
      const [{ data: empProfile }, { data: companyData }] = await Promise.all([
        supabase.from("employees").select("full_name").eq("id", employee.id).single(),
        supabase.from("companies").select("name, user_id").eq("id", companyId).single()
      ]);
      if (companyData?.user_id) {
        const { data: adminUser } = await supabase.from("users").select("email, full_name").eq("id", companyData.user_id).single();
        if (adminUser) {
          await sendEmploymentRequestEmail({
            to: adminUser.email,
            adminName: adminUser.full_name,
            employeeName: empProfile?.full_name || "An employee",
            companyName: companyData.name
          });
        }
      }
    } catch (_) {}

    return res.status(201).json({ data: result.data });
  } catch (e) {
    console.error('requestEmployment error:', e);
    console.error('requestEmployment body:', req.body);
    return res.status(500).json({ message: "Server error" });
  }
};
exports.endEmployment = async (req, res) => {
  try {
    const { id } = req.params;
    const { endDate } = req.body;
    const userId = req.user.userId;

    if (!endDate) {
      return res.status(400).json({
        success: false,
        error: { message: "endDate is required", code: "VALIDATION_ERROR" },
      });
    }

    const supabase = require("../config/database");

    // find employee id for logged-in user
    const { data: employee, error: empErr } = await supabase
      .from("employees")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (empErr || !employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // ensure employment belongs to this employee
    const { data: employment, error: eErr } = await supabase
      .from("employments")
      .select("*")
      .eq("id", id)
      .eq("employee_id", employee.id)
      .single();

    if (eErr || !employment) {
      return res.status(404).json({ message: "Employment not found" });
    }

    if (employment.is_current === false) {
      return res.status(400).json({ message: "Employment already ended" });
    }

    const { data: updated, error: upErr } = await supabase
      .from("employments")
      .update({
        end_date: endDate,
        is_current: false,
        updated_at: new Date(),
      })
      .eq("id", id)
      .select()
      .single();

    if (upErr) throw upErr;

    return res.status(200).json({ data: updated });
  } catch (err) {
    console.error("endEmployment error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// GET /api/employments
exports.listMyEmployments = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { data: employee, error: empErr } = await supabase
      .from("employees")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (empErr || !employee) {
      return res.status(400).json({ message: "Employee profile not linked to user" });
    }

    const result = await employmentService.listEmploymentsByEmployee(employee.id);
    if (result.error) return res.status(400).json({ message: result.error });

    return res.json({ data: result.data });
  } catch (e) {
    return res.status(500).json({ message: "Server error" });
  }
};

// PATCH /api/employments/:id/approve
exports.approveEmployment = async (req, res) => {
  try {
    const adminUserId = req.user?.userId;
    const role = req.user?.role;
    const employmentId = req.params.id;

    if (!adminUserId) return res.status(401).json({ message: "Unauthorized" });
    if (role !== "company_admin") return res.status(403).json({ message: "Company admin only" });

    const { data: company, error: cErr } = await supabase
      .from("companies")
      .select("id, name")
      .eq("user_id", adminUserId)
      .is("deleted_at", null)
      .single();

    if (cErr || !company) return res.status(400).json({ message: "Company not found for admin" });

    const result = await employmentService.updateEmploymentStatus({
      employmentId,
      companyId: company.id,
      adminUserId,
      status: "approved"
    });

    if (result.error) return res.status(400).json({ message: result.error });

    // Send approval email to employee (non-blocking)
    try {
      const { data: empData } = await supabase.from("employees").select("full_name, user_id").eq("id", result.data.employee_id).single();
      if (empData?.user_id) {
        const { data: empUser } = await supabase.from("users").select("email").eq("id", empData.user_id).single();
        if (empUser) {
          await sendEmploymentApprovedEmail({
            to: empUser.email,
            name: empData.full_name,
            companyName: company.name
          });
        }
      }
    } catch (_) {}

    return res.json({ data: result.data });
  } catch (e) {
    console.error("approveEmployment error:", e);
    return res.status(500).json({ message: "Server error" });
  }
};
exports.listPendingEmployments = async (req, res) => {
  try {
    const role = req.user?.role;
    if (role !== "company_admin") {
      return res.status(403).json({ message: "Company admin only" });
    }

    const supabase = require("../config/database");
    const userId = req.user.userId;

    const { data: company, error: cErr } = await supabase
      .from("companies")
      .select("id, name")
      .eq("user_id", userId)
      .maybeSingle();

    if (cErr) throw cErr;
    if (!company) return res.status(404).json({ message: "Company not found for this admin" });

    const { data, error } = await supabase
      .from("employments")
      .select(`
        id,
        employee_id,
        company_id,
        position,
        department,
        start_date,
        end_date,
        is_current,
        verification_status,
        created_at,
        employees:employee_id ( id, full_name )
      `)
      .eq("company_id", company.id)
      .eq("verification_status", "pending")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return res.status(200).json({ data });
  } catch (err) {
    console.error("listPendingEmployments error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.rejectEmployment = async (req, res) => {
  try {
    const adminUserId = req.user?.userId;
    const role = req.user?.role;
    const employmentId = req.params.id;
    const { rejectionNote } = req.body;

    if (!adminUserId) return res.status(401).json({ message: "Unauthorized" });
    if (role !== "company_admin") return res.status(403).json({ message: "Company admin only" });

    const { data: company, error: cErr } = await supabase
      .from("companies")
      .select("id, name")
      .eq("user_id", adminUserId)
      .is("deleted_at", null)
      .single();

    if (cErr || !company) return res.status(400).json({ message: "Company not found for admin" });

    const result = await employmentService.updateEmploymentStatus({
      employmentId,
      companyId: company.id,
      adminUserId,
      status: "rejected",
      rejectionNote
    });

    if (result.error) return res.status(400).json({ message: result.error });

    // Send rejection email to employee (non-blocking)
    try {
      const { data: empData } = await supabase.from("employees").select("full_name, user_id").eq("id", result.data.employee_id).single();
      if (empData?.user_id) {
        const { data: empUser } = await supabase.from("users").select("email").eq("id", empData.user_id).single();
        if (empUser) {
          await sendEmploymentRejectedEmail({
            to: empUser.email,
            name: empData.full_name,
            companyName: company.name,
            reason: rejectionNote || null
          });
        }
      }
    } catch (_) {}

    return res.json({ data: result.data });
  } catch (e) {
    console.error("rejectEmployment error:", e);
    return res.status(500).json({ message: "Server error" });
  }
};

// PATCH /api/employments/:id/reject — defined above, duplicate removed