const supabase = require('../config/database');
const employmentService = require('../services/employmentService');
const {
  sendEmploymentRequestEmail,
  sendEmploymentApprovedEmail,
  sendEmploymentRejectedEmail,
  sendInviteEmail,
  sendEmploymentEndedByAdminEmail,
} = require('../services/emailService');
const { createNotification } = require('../services/notificationService');

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

    // Gate: user must have identity verified by system admin before requesting employment
    const { data: userRecord, error: userErr } = await supabase
      .from('users')
      .select('identity_verified')
      .eq('id', userId)
      .single();

    if (userErr || !userRecord?.identity_verified) {
      return res.status(403).json({
        message: "Identity verification required. Please submit your ID document on your Profile page and wait for admin approval.",
        code: "IDENTITY_NOT_VERIFIED"
      });
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

    // Notify company admin that a new employment request was submitted (non-blocking)
    try {
      const [{ data: empProfile }, { data: companyData }] = await Promise.all([
        supabase.from('employees').select('full_name').eq('id', employee.id).single(),
        supabase.from('companies').select('name, user_id').eq('id', companyId).single()
      ]);
      if (companyData?.user_id) {
        const { data: adminUser } = await supabase.from('users').select('email, full_name').eq('id', companyData.user_id).single();
        if (adminUser) {
          await sendEmploymentRequestEmail({
            to: adminUser.email,
            adminName: adminUser.full_name,
            employeeName: empProfile?.full_name || 'An employee',
            companyName: companyData.name
          });
        }
        await createNotification({
          userId: companyData.user_id,
          type: 'employment_request',
          title: 'New Employment Request',
          message: `${empProfile?.full_name || 'An employee'} requested to join ${companyData.name}.`,
          link: '/company-admin',
        });
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
    const today = new Date().toISOString().split('T')[0];
    const endDate = req.body.endDate || today;
    const userId = req.user.userId;

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

    // Validate end date is not before start date
    if (employment.start_date && endDate < employment.start_date) {
      return res.status(400).json({ message: `End date cannot be before the start date (${employment.start_date}).` });
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

    if (upErr) {
      console.error("endEmployment DB error:", upErr);
      // Return friendly message for constraint violations
      const msg = upErr?.message || '';
      if (msg.includes('violates check') || msg.includes('constraint')) {
        return res.status(400).json({ message: "End date is not valid for this employment record." });
      }
      throw upErr;
    }

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

    const { data: companies, error: cErr } = await supabase
      .from("companies")
      .select("id, name")
      .eq("user_id", adminUserId)
      .is("deleted_at", null);

    if (cErr || !companies || companies.length === 0) {
      return res.status(400).json({ message: "No companies found for this admin" });
    }

    // Check which company this employment belongs to
    const { data: employment } = await supabase
      .from("employments")
      .select("company_id")
      .eq("id", employmentId)
      .maybeSingle();

    const company = companies.find(c => c.id === (employment && employment.company_id));
    if (!company) return res.status(403).json({ message: "This employment does not belong to your company" });

    const result = await employmentService.updateEmploymentStatus({
      employmentId,
      companyId: company.id,
      adminUserId,
      status: "approved"
    });

    if (result.error) return res.status(400).json({ message: result.error });

    // Send approval email + notification to employee (non-blocking)
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
        await createNotification({
          userId: empData.user_id,
          type: 'employment_approved',
          title: 'Employment Approved',
          message: `Your employment at ${company.name} has been approved.`,
          link: '/dashboard',
        });
      }
    } catch (_) {}

    return res.json({ data: result.data });
  } catch (e) {
    console.error("approveEmployment error:", e);
    return res.status(500).json({ message: "Server error" });
  }
};
// GET /api/employments/all  — all statuses (pending + approved + rejected)
exports.listAllEmployments = async (req, res) => {
  try {
    const role = req.user?.role;
    if (role !== 'company_admin') {
      return res.status(403).json({ message: 'Company admin only' });
    }
    const userId = req.user.userId;
    const { data: companies, error: cErr } = await supabase
      .from('companies')
      .select('id, name')
      .eq('user_id', userId)
      .is('deleted_at', null);

    if (cErr) throw cErr;
    if (!companies || companies.length === 0) {
      return res.status(404).json({ message: 'No companies found for this admin' });
    }

    const companyIds = companies.map((c) => c.id);

    const { data, error } = await supabase
      .from('employments')
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
        rejection_note,
        created_at,
        employees:employee_id!inner ( id, full_name, deleted_at )
      `)
      .in('company_id', companyIds)
      .is('deleted_at', null)
      .is('employees.deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return res.status(200).json({ data });
  } catch (err) {
    console.error('listAllEmployments error:', err);
    return res.status(500).json({ message: 'Server error' });
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

    const { data: companies, error: cErr } = await supabase
      .from("companies")
      .select("id, name")
      .eq("user_id", userId)
      .is("deleted_at", null);

    if (cErr) throw cErr;
    if (!companies || companies.length === 0) {
      return res.status(404).json({ message: "No companies found for this admin" });
    }

    const companyIds = companies.map((c) => c.id);

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
      .in("company_id", companyIds)
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

    const { data: companies, error: cErr } = await supabase
      .from("companies")
      .select("id, name")
      .eq("user_id", adminUserId)
      .is("deleted_at", null);

    if (cErr || !companies || companies.length === 0) {
      return res.status(400).json({ message: "No companies found for this admin" });
    }

    const { data: empRecord } = await supabase
      .from("employments")
      .select("company_id")
      .eq("id", employmentId)
      .maybeSingle();

    const company = companies.find(c => c.id === (empRecord && empRecord.company_id));
    if (!company) return res.status(403).json({ message: "This employment does not belong to your company" });

    const result = await employmentService.updateEmploymentStatus({
      employmentId,
      companyId: company.id,
      adminUserId,
      status: "rejected",
      rejectionNote
    });

    if (result.error) return res.status(400).json({ message: result.error });

    // Send rejection email + notification to employee (non-blocking)
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
        await createNotification({
          userId: empData.user_id,
          type: 'employment_rejected',
          title: 'Employment Request Declined',
          message: `Your employment request at ${company.name} was declined.${rejectionNote ? ` Reason: ${rejectionNote}` : ''}`,
          link: '/dashboard',
        });
      }
    } catch (_) {}

    return res.json({ data: result.data });
  } catch (e) {
    console.error("rejectEmployment error:", e);
    return res.status(500).json({ message: "Server error" });
  }
};

// PATCH /api/employments/:id/reject — defined above, duplicate removed

// DELETE /api/employments/:id/cancel — employee cancels their own pending request
exports.cancelEmployment = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const employmentId = req.params.id;

    // Resolve employee record
    const { data: employee, error: empErr } = await supabase
      .from('employees')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (empErr || !employee) return res.status(400).json({ message: 'Employee profile not found' });

    // Fetch the employment and verify ownership + pending status
    const { data: employment, error: fetchErr } = await supabase
      .from('employments')
      .select('id, employee_id, verification_status')
      .eq('id', employmentId)
      .is('deleted_at', null)
      .single();

    if (fetchErr || !employment) return res.status(404).json({ message: 'Employment request not found' });
    if (employment.employee_id !== employee.id) return res.status(403).json({ message: 'Forbidden' });
    if (employment.verification_status !== 'pending') {
      return res.status(400).json({ message: 'Only pending requests can be cancelled' });
    }

    const { error: delErr } = await supabase
      .from('employments')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', employmentId);

    if (delErr) throw delErr;

    return res.json({ message: 'Employment request cancelled' });
  } catch (e) {
    console.error('cancelEmployment error:', e);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ─── Feature 1: POST /api/employments/invite ─────────────────────────────────
exports.inviteEmployee = async (req, res) => {
  try {
    const adminUserId = req.user?.userId;
    if (!adminUserId || req.user.role !== 'company_admin') {
      return res.status(403).json({ message: 'Company admin only' });
    }
    const { companyId, inviteEmail, position, department, startDate } = req.body;
    if (!companyId || !inviteEmail || !position || !startDate) {
      return res.status(400).json({ message: 'companyId, inviteEmail, position, startDate are required' });
    }

    const result = await employmentService.inviteEmployee({
      companyId, adminUserId, inviteEmail, position, department, startDate,
    });
    if (result.error) return res.status(400).json({ message: result.error });

    // Send invite email (non-blocking)
    try {
      const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',')[0].trim();
      await sendInviteEmail({
        to: inviteEmail,
        companyName: result.company.name,
        inviteUrl: `${frontendUrl}/accept-invite?token=${result.token}`,
        position,
      });
    } catch (_) {}

    return res.status(201).json({ success: true, data: result.data });
  } catch (e) {
    console.error('inviteEmployee error:', e);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ─── Feature 1: POST /api/employments/accept-invite ──────────────────────────
exports.acceptInvite = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: 'token required' });

    const result = await employmentService.acceptInvite({ token, userId });
    if (result.error) return res.status(400).json({ message: result.error });

    // Notify company admin that invitation was accepted (non-blocking)
    try {
      const { data: empData } = await supabase.from('employees').select('full_name, user_id').eq('user_id', userId).single();
      const { data: compData } = await supabase.from('companies').select('name, user_id').eq('id', result.data.company_id).single();
      if (compData?.user_id) {
        await createNotification({
          userId: compData.user_id,
          type: 'employment_request',
          title: 'Invitation Accepted',
          message: `${empData?.full_name || 'An employee'} accepted the invitation to join ${compData.name}.`,
          link: '/company-admin#requests',
        });
      }
    } catch (_) {}

    return res.json({ success: true, data: result.data });
  } catch (e) {
    console.error('acceptInvite error:', e);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ─── Feature 1: GET /api/employments/pending-invites ─────────────────────────
exports.getPendingInvites = async (req, res) => {
  try {
    const adminUserId = req.user?.userId;
    if (!adminUserId || req.user.role !== 'company_admin') {
      return res.status(403).json({ message: 'Company admin only' });
    }
    const { data: companies } = await supabase
      .from('companies')
      .select('id')
      .eq('user_id', adminUserId)
      .is('deleted_at', null);
    if (!companies?.length) return res.json({ data: [] });

    // Collect all pending invites for all companies
    const allInvites = [];
    for (const c of companies) {
      const result = await employmentService.getPendingInvites(c.id);
      if (result.data) allInvites.push(...result.data);
    }
    return res.json({ success: true, data: allInvites });
  } catch (e) {
    console.error('getPendingInvites error:', e);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ─── Feature 1: DELETE /api/employments/:id/cancel-invite ────────────────────
exports.cancelInvite = async (req, res) => {
  try {
    const adminUserId = req.user?.userId;
    if (!adminUserId || req.user.role !== 'company_admin') {
      return res.status(403).json({ message: 'Company admin only' });
    }
    const { id } = req.params;
    // Verify admin owns this invite's company
    const { data: invite } = await supabase
      .from('employments')
      .select('id, company_id, source, verification_status')
      .eq('id', id)
      .is('deleted_at', null)
      .single();
    if (!invite) return res.status(404).json({ message: 'Invite not found' });

    const { data: company } = await supabase
      .from('companies')
      .select('id')
      .eq('id', invite.company_id)
      .eq('user_id', adminUserId)
      .single();
    if (!company) return res.status(403).json({ message: 'Not authorized for this company' });

    if (invite.source !== 'invite' || invite.verification_status !== 'pending') {
      return res.status(400).json({ message: 'Only pending invites can be cancelled' });
    }

    await supabase.from('employments').update({ deleted_at: new Date().toISOString() }).eq('id', id);
    return res.json({ success: true, message: 'Invite cancelled' });
  } catch (e) {
    console.error('cancelInvite error:', e);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ─── Feature 2: PATCH /api/employments/:id/end-by-admin ──────────────────────
exports.endByAdmin = async (req, res) => {
  try {
    const adminUserId = req.user?.userId;
    if (!adminUserId || req.user.role !== 'company_admin') {
      return res.status(403).json({ message: 'Company admin only' });
    }
    const { id } = req.params;
    const { endReason, endDate } = req.body;

    // Get admin's company
    const { data: companies } = await supabase
      .from('companies')
      .select('id, name')
      .eq('user_id', adminUserId)
      .is('deleted_at', null);
    if (!companies?.length) return res.status(400).json({ message: 'No companies found' });

    const { data: employment } = await supabase
      .from('employments')
      .select('company_id')
      .eq('id', id)
      .single();
    const company = companies.find(c => c.id === employment?.company_id);
    if (!company) return res.status(403).json({ message: 'Not authorized for this employment' });

    const result = await employmentService.endByAdmin({
      employmentId: id,
      companyId: company.id,
      adminUserId,
      endReason,
      endDate,
    });
    if (result.error) return res.status(400).json({ message: result.error });

    // Notify employee (non-blocking)
    try {
      const { data: empData } = await supabase
        .from('employees')
        .select('full_name, user_id')
        .eq('id', result.data.employee_id)
        .single();
      if (empData?.user_id) {
        const { data: empUser } = await supabase.from('users').select('email').eq('id', empData.user_id).single();
        if (empUser) {
          await sendEmploymentEndedByAdminEmail({
            to: empUser.email,
            name: empData.full_name,
            companyName: company.name,
            reason: endReason || null,
          });
        }
        await createNotification({
          userId: empData.user_id,
          type: 'employment_ended',
          title: 'Employment Ended',
          message: `Your employment at ${company.name} has been ended by the company admin.${endReason ? ` Reason: ${endReason}` : ''}`,
          link: '/dashboard#employment',
        });
      }
    } catch (_) {}

    return res.json({ success: true, data: result.data });
  } catch (e) {
    console.error('endByAdmin error:', e);
    return res.status(500).json({ message: 'Server error' });
  }
};