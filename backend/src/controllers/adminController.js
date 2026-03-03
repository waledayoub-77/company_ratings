/**
 * adminController.js — Walid's admin panel + reports
 * Routes:
 *   POST   /api/reports                          — any authenticated user
 *   GET    /api/admin/reports                    — system_admin
 *   PATCH  /api/admin/reports/:id/resolve        — system_admin
 *   GET    /api/admin/users                      — system_admin (searches by email + full_name)
 *   PATCH  /api/admin/users/:id/suspend          — system_admin
 *   PATCH  /api/admin/users/:id/unsuspend        — system_admin
 *   DELETE /api/admin/users/:id                 — system_admin
 *   GET    /api/admin/companies                  — system_admin
 *   PATCH  /api/admin/companies/:id/verify       — system_admin
 *   PATCH  /api/admin/employments/:id/override   — system_admin
 *   GET    /api/admin/analytics                  — system_admin
 *   GET    /api/admin/audit-logs                 — system_admin
 */

const supabase = require('../config/database');
const {
  sendAccountSuspendedEmail,
  sendAccountUnsuspendedEmail,
  sendAccountDeletedEmail,
} = require('../services/emailService');

// ─── HELPER: log audit action ─────────────────────────────────────────────────
async function logAudit({ adminId, action, targetType, targetId, details }) {
  try {
    await supabase.from('audit_logs').insert({
      admin_id: adminId,
      action,
      entity_type: targetType,
      entity_id: targetId,
      details: details || null,
    });
  } catch (e) {
    console.error('Audit log write failed:', e.message);
  }
}

// ─── REPORTS ──────────────────────────────────────────────────────────────────

/**
 * POST /api/reports
 * Any authenticated user can report a review
 */
exports.submitReport = async (req, res) => {
  try {
    const reporterId = req.user?.userId;
    if (!reporterId) return res.status(401).json({ success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } });

    const { reviewId, reason, description } = req.body;

    const VALID_REASONS = ['false_info', 'spam', 'harassment', 'other'];
    if (!reviewId) return res.status(400).json({ success: false, error: { message: 'reviewId is required', code: 'MISSING_FIELD' } });
    if (!reason || !VALID_REASONS.includes(reason)) {
      return res.status(400).json({
        success: false,
        error: { message: `Invalid reason. Must be one of: ${VALID_REASONS.join(', ')}`, code: 'INVALID_REASON' },
      });
    }
    if (!description || description.trim().length < 10) {
      return res.status(400).json({ success: false, error: { message: 'Description must be at least 10 characters', code: 'MISSING_FIELD' } });
    }

    // Verify review exists
    const { data: review } = await supabase.from('company_reviews').select('id, employee_id').eq('id', reviewId).maybeSingle();
    if (!review) return res.status(404).json({ success: false, error: { message: 'Review not found', code: 'NOT_FOUND' } });

    // Prevent self-reporting
    const { data: employee } = await supabase.from('employees').select('id').eq('user_id', reporterId).maybeSingle();
    if (employee && review.employee_id === employee.id) {
      return res.status(400).json({ success: false, error: { message: 'You cannot report your own review', code: 'SELF_REPORT' } });
    }

    const { data: report, error } = await supabase
      .from('reported_reviews')
      .insert({
        reporter_id: reporterId,
        review_id: reviewId,
        reason,
        description: description.trim(),
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json({ success: true, data: report });
  } catch (err) {
    console.error('submitReport error:', err);
    return res.status(500).json({ success: false, error: { message: 'Server error', code: 'SERVER_ERROR' } });
  }
};

/**
 * GET /api/admin/reports?status=pending&page=1&limit=20
 */
exports.getReports = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabase
      .from('reported_reviews')
      .select('*, reporter:reporter_id(id, email, role), review:review_id(id, content, company_id)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (status) query = query.eq('status', status);

    const { data, error, count } = await query;
    if (error) throw error;

    return res.json({
      success: true,
      data: data || [],
      pagination: { total: count || 0, page: parseInt(page), limit: parseInt(limit) },
    });
  } catch (err) {
    console.error('getReports error:', err);
    return res.status(500).json({ success: false, error: { message: 'Server error', code: 'SERVER_ERROR' } });
  }
};

/**
 * GET /api/admin/reports/stats
 * Returns report counts grouped by reason and by status
 */
exports.getReportStats = async (req, res) => {
  try {
    const { data: rows, error } = await supabase
      .from('reported_reviews')
      .select('reason, status');

    if (error) throw error;

    const byReason = {};
    const byStatus = { pending: 0, dismissed: 0, resolved: 0 };
    let total = 0;

    for (const row of rows || []) {
      byReason[row.reason] = (byReason[row.reason] || 0) + 1;
      if (byStatus[row.status] !== undefined) {
        byStatus[row.status]++;
      } else {
        byStatus[row.status] = 1;
      }
      total++;
    }

    return res.json({ success: true, data: { total, byReason, byStatus } });
  } catch (err) {
    console.error('getReportStats error:', err);
    return res.status(500).json({ success: false, error: { message: 'Server error', code: 'SERVER_ERROR' } });
  }
};

/**
 * PATCH /api/admin/reports/:id/resolve
 * Body: { action: 'dismissed' | 'removed' | 'warned', adminNote }
 */
exports.resolveReport = async (req, res) => {
  try {
    const adminId = req.user?.userId;
    const { id } = req.params;
    const { action, adminNote } = req.body;

    const VALID_ACTIONS = ['dismissed', 'resolved'];
    if (!action || !VALID_ACTIONS.includes(action)) {
      return res.status(400).json({
        success: false,
        error: { message: `Invalid action. Must be: ${VALID_ACTIONS.join(', ')}`, code: 'INVALID_ACTION' },
      });
    }

    const { data: report } = await supabase.from('reported_reviews').select('id, status').eq('id', id).maybeSingle();
    if (!report) return res.status(404).json({ success: false, error: { message: 'Report not found', code: 'NOT_FOUND' } });
    if (report.status !== 'pending') {
      return res.status(400).json({ success: false, error: { message: 'Report already resolved', code: 'ALREADY_RESOLVED' } });
    }

    const { data: updated, error } = await supabase
      .from('reported_reviews')
      .update({ status: action, admin_note: adminNote || null, resolved_by: adminId, resolved_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await logAudit({ adminId, action: `report_${action}`, targetType: 'report', targetId: id, details: { adminNote } });

    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error('resolveReport error:', err);
    return res.status(500).json({ success: false, error: { message: 'Server error', code: 'SERVER_ERROR' } });
  }
};

// ─── USERS ────────────────────────────────────────────────────────────────────

/**
 * GET /api/admin/users?page=1&limit=10&role=employee&search=foo
 * Searches by email AND employee full_name
 */
exports.getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search } = req.query;
    const safePage = Math.max(parseInt(page) || 1, 1);
    const safeLimit = Math.min(Math.max(parseInt(limit) || 10, 1), 100);
    const offset = (safePage - 1) * safeLimit;

    // Resolve extra user IDs from employee name search
    let extraUserIds = [];
    if (search) {
      const { data: matchingEmployees } = await supabase
        .from('employees')
        .select('user_id')
        .ilike('full_name', `%${search}%`)
        .is('deleted_at', null);
      if (matchingEmployees && matchingEmployees.length > 0) {
        extraUserIds = matchingEmployees.map((e) => e.user_id);
      }
    }

    let query = supabase
      .from('users')
      .select('id, email, role, is_active, email_verified, created_at, full_name', { count: 'exact' })
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + safeLimit - 1);

    if (role) query = query.eq('role', role);

    if (search && extraUserIds.length > 0) {
      // Match by email OR by user_id found from employee name search
      query = query.or(`email.ilike.%${search}%,id.in.(${extraUserIds.join(',')})`);
    } else if (search) {
      query = query.ilike('email', `%${search}%`);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    const users = data || [];

    // Enrich with full_name from employees table for users that don't have it in users table
    const missingNameIds = users.filter(u => !u.full_name).map(u => u.id);
    let empNameMap = {};
    if (missingNameIds.length > 0) {
      const { data: empRows } = await supabase
        .from('employees')
        .select('user_id, full_name')
        .in('user_id', missingNameIds)
        .is('deleted_at', null);
      if (empRows) {
        for (const emp of empRows) {
          if (emp.full_name) empNameMap[emp.user_id] = emp.full_name;
        }
      }
    }

    const enriched = users.map(u => ({
      ...u,
      full_name: u.full_name || empNameMap[u.id] || null,
    }));

    return res.json({
      success: true,
      data: enriched,
      pagination: { total: count || 0, page: safePage, limit: safeLimit, pages: Math.ceil((count || 0) / safeLimit) },
    });
  } catch (err) {
    console.error('getUsers error:', err);
    return res.status(500).json({ success: false, error: { message: 'Server error', code: 'SERVER_ERROR' } });
  }
};

/**
 * PATCH /api/admin/users/:id/suspend
 * Body: { reason }
 */
exports.suspendUser = async (req, res) => {
  try {
    const adminId = req.user?.userId;
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || reason.trim().length < 3) return res.status(400).json({ success: false, error: { message: 'Reason is required (min 3 chars)', code: 'MISSING_FIELD' } });

    const { data: target } = await supabase.from('users').select('id, role, is_active').eq('id', id).eq('is_deleted', false).maybeSingle();
    if (!target) return res.status(404).json({ success: false, error: { message: 'User not found', code: 'NOT_FOUND' } });
    if (target.role === 'system_admin') return res.status(400).json({ success: false, error: { message: 'Cannot suspend a system admin', code: 'FORBIDDEN_ACTION' } });
    if (!target.is_active) return res.status(400).json({ success: false, error: { message: 'User is already suspended', code: 'ALREADY_SUSPENDED' } });

    const { data: updated, error } = await supabase
      .from('users')
      .update({ is_active: false })
      .eq('id', id)
      .select('id, email, role, is_active')
      .maybeSingle();

    if (error) throw error;
    if (!updated) return res.status(404).json({ success: false, error: { message: 'User not found after update', code: 'USER_NOT_FOUND' } });

    // Revoke all refresh tokens
    await supabase.from('refresh_tokens').update({ is_revoked: true }).eq('user_id', id);

    await logAudit({ adminId, action: 'user_suspended', targetType: 'user', targetId: id, details: { reason, targetEmail: updated.email } });

    try {
      await sendAccountSuspendedEmail({ to: updated.email, name: updated.email, reason });
    } catch (emailErr) {
      console.error('Failed to send suspension email:', emailErr.message);
    }

    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error('suspendUser error:', err);
    return res.status(500).json({ success: false, error: { message: 'Server error', code: 'SERVER_ERROR' } });
  }
};

/**
 * PATCH /api/admin/users/:id/unsuspend
 */
exports.unsuspendUser = async (req, res) => {
  try {
    const adminId = req.user?.userId;
    const { id } = req.params;

    const { data: target } = await supabase.from('users').select('id, is_active, role').eq('id', id).eq('is_deleted', false).maybeSingle();
    if (!target) return res.status(404).json({ success: false, error: { message: 'User not found', code: 'NOT_FOUND' } });
    if (target.is_active) return res.status(400).json({ success: false, error: { message: 'User is not suspended', code: 'NOT_SUSPENDED' } });

    const { data: updated, error } = await supabase
      .from('users')
      .update({ is_active: true })
      .eq('id', id)
      .select('id, email, role, is_active')
      .maybeSingle();

    if (error) throw error;
    if (!updated) return res.status(404).json({ success: false, error: { message: 'User not found after update', code: 'USER_NOT_FOUND' } });

    await logAudit({ adminId, action: 'user_unsuspended', targetType: 'user', targetId: id, details: {} });

    try {
      await sendAccountUnsuspendedEmail({ to: updated.email, name: updated.email });
    } catch (emailErr) {
      console.error('Failed to send unsuspension email:', emailErr.message);
    }

    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error('unsuspendUser error:', err);
    return res.status(500).json({ success: false, error: { message: 'Server error', code: 'SERVER_ERROR' } });
  }
};

/**
 * DELETE /api/admin/users/:id
 * Soft-delete. Cannot delete system_admin.
 */
exports.deleteUser = async (req, res) => {
  try {
    const adminId = req.user?.userId;
    const { id } = req.params;

    const { data: target } = await supabase.from('users').select('id, email, role, is_deleted').eq('id', id).maybeSingle();
    if (!target || target.is_deleted) return res.status(404).json({ success: false, error: { message: 'User not found', code: 'NOT_FOUND' } });
    if (target.role === 'system_admin') return res.status(400).json({ success: false, error: { message: 'Cannot delete a system admin', code: 'FORBIDDEN_ACTION' } });
    if (id === adminId) return res.status(400).json({ success: false, error: { message: 'Cannot delete your own account', code: 'FORBIDDEN_ACTION' } });

    await supabase.from('users').update({ is_deleted: true, is_active: false, deleted_at: new Date().toISOString() }).eq('id', id);
    await supabase.from('refresh_tokens').update({ is_revoked: true }).eq('user_id', id);
    await logAudit({ adminId, action: 'user_deleted', targetType: 'user', targetId: id, details: { email: target.email } });

    try {
      await sendAccountDeletedEmail({ to: target.email, name: target.email });
    } catch (emailErr) {
      console.error('Failed to send deletion email:', emailErr.message);
    }

    return res.json({ success: true, data: { message: 'User deleted successfully' } });
  } catch (err) {
    console.error('deleteUser error:', err);
    return res.status(500).json({ success: false, error: { message: 'Server error', code: 'SERVER_ERROR' } });
  }
};

/**
 * PATCH /api/admin/users/bulk-suspend
 * Body: { userIds: string[], reason: string }
 */
exports.bulkSuspendUsers = async (req, res) => {
  try {
    const adminId = req.user?.userId;
    const { userIds, reason } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ success: false, error: { message: 'userIds must be a non-empty array', code: 'MISSING_FIELD' } });
    }
    if (userIds.length > 100) {
      return res.status(400).json({ success: false, error: { message: 'Cannot suspend more than 100 users at once', code: 'LIMIT_EXCEEDED' } });
    }
    if (!reason || reason.trim().length < 3) {
      return res.status(400).json({ success: false, error: { message: 'Reason is required (min 3 chars)', code: 'MISSING_FIELD' } });
    }

    const { data: targets, error: fetchError } = await supabase
      .from('users')
      .select('id, role, is_active, email')
      .in('id', userIds)
      .eq('is_deleted', false);

    if (fetchError) throw fetchError;

    const skipped = [];
    const toSuspend = [];

    for (const user of targets || []) {
      if (user.role === 'system_admin') {
        skipped.push({ id: user.id, reason: 'Cannot suspend system_admin' });
      } else if (!user.is_active) {
        skipped.push({ id: user.id, reason: 'Already suspended' });
      } else if (user.id === adminId) {
        skipped.push({ id: user.id, reason: 'Cannot suspend yourself' });
      } else {
        toSuspend.push(user.id);
      }
    }

    if (toSuspend.length === 0) {
      return res.status(400).json({ success: false, error: { message: 'No eligible users to suspend', code: 'NO_ELIGIBLE_USERS' }, skipped });
    }

    const { error: updateError } = await supabase.from('users').update({ is_active: false }).in('id', toSuspend);
    if (updateError) throw updateError;

    await supabase.from('refresh_tokens').update({ is_revoked: true }).in('user_id', toSuspend);

    await logAudit({
      adminId,
      action: 'bulk_suspend',
      targetType: 'user',
      targetId: null,
      details: { suspendedIds: toSuspend, reason: reason.trim(), skipped },
    });

    return res.json({
      success: true,
      data: { suspended: toSuspend.length, skipped: skipped.length, suspendedIds: toSuspend, skippedDetails: skipped },
    });
  } catch (err) {
    console.error('bulkSuspendUsers error:', err);
    return res.status(500).json({ success: false, error: { message: 'Server error', code: 'SERVER_ERROR' } });
  }
};

// ─── COMPANIES ────────────────────────────────────────────────────────────────

/**
 * GET /api/admin/companies?page=1&limit=10
 */
exports.getAdminCompanies = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { data, error, count } = await supabase
      .from('companies')
      .select('*, owner:user_id(id, email)', { count: 'exact' })
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (error) throw error;

    return res.json({
      success: true,
      data: data || [],
      pagination: { total: count || 0, page: parseInt(page), limit: parseInt(limit) },
    });
  } catch (err) {
    console.error('getAdminCompanies error:', err);
    return res.status(500).json({ success: false, error: { message: 'Server error', code: 'SERVER_ERROR' } });
  }
};

/**
 * PATCH /api/admin/companies/:id/verify
 */
exports.verifyCompany = async (req, res) => {
  try {
    const adminId = req.user?.userId;
    const { id } = req.params;

    const { data: company } = await supabase.from('companies').select('id, name, is_verified').eq('id', id).is('deleted_at', null).maybeSingle();
    if (!company) return res.status(404).json({ success: false, error: { message: 'Company not found', code: 'NOT_FOUND' } });
    if (company.is_verified) return res.status(400).json({ success: false, error: { message: 'Company is already verified', code: 'ALREADY_VERIFIED' } });

    const { data: updated, error } = await supabase
      .from('companies')
      .update({ is_verified: true })
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw error;

    await logAudit({ adminId, action: 'company_verified', targetType: 'company', targetId: id, details: { companyName: company.name } });

    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error('verifyCompany error:', err);
    return res.status(500).json({ success: false, error: { message: 'Server error', code: 'SERVER_ERROR' } });
  }
};

/**
 * PATCH /api/admin/companies/:id/reject
 * Reject (unverify) a company
 */
exports.rejectCompany = async (req, res) => {
  try {
    const adminId = req.user?.userId;
    const { id } = req.params;

    const { data: company } = await supabase.from('companies').select('id, name, is_verified').eq('id', id).is('deleted_at', null).maybeSingle();
    if (!company) return res.status(404).json({ success: false, error: { message: 'Company not found', code: 'NOT_FOUND' } });
    if (!company.is_verified) return res.status(400).json({ success: false, error: { message: 'Company is not verified', code: 'NOT_VERIFIED' } });

    const { data: updated, error } = await supabase
      .from('companies')
      .update({ is_verified: false })
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw error;

    await logAudit({ adminId, action: 'company_rejected', targetType: 'company', targetId: id, details: { companyName: company.name } });

    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error('rejectCompany error:', err);
    return res.status(500).json({ success: false, error: { message: 'Server error', code: 'SERVER_ERROR' } });
  }
};

// ─── EMPLOYMENT OVERRIDE ──────────────────────────────────────────────────────

/**
 * PATCH /api/admin/employments/:id/override
 * Force-approve an employment record
 */
exports.overrideEmployment = async (req, res) => {
  try {
    const adminId = req.user?.userId;
    const { id } = req.params;

    const { data: employment } = await supabase
      .from('employments')
      .select('id, verification_status, company_id')
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();

    if (!employment) return res.status(404).json({ success: false, error: { message: 'Employment not found', code: 'NOT_FOUND' } });

    const { data: updated, error } = await supabase
      .from('employments')
      .update({ verification_status: 'approved', verified_by: adminId, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await logAudit({ adminId, action: 'employment_overridden', targetType: 'employment', targetId: id, details: { previousStatus: employment.verification_status } });

    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error('overrideEmployment error:', err);
    return res.status(500).json({ success: false, error: { message: 'Server error', code: 'SERVER_ERROR' } });
  }
};

// ─── ANALYTICS ────────────────────────────────────────────────────────────────

/**
 * GET /api/admin/analytics
 */
exports.getAnalytics = async (req, res) => {
  try {
    const [
      { count: totalUsers },
      { count: totalCompanies },
      { count: totalReviews },
      { count: totalReports },
      { count: pendingEmployments },
      { count: activeUsers },
    ] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('is_deleted', false),
      supabase.from('companies').select('id', { count: 'exact', head: true }).is('deleted_at', null),
      supabase.from('company_reviews').select('id', { count: 'exact', head: true }).is('deleted_at', null),
      supabase.from('reported_reviews').select('id', { count: 'exact', head: true }),
      supabase.from('employments').select('id', { count: 'exact', head: true }).eq('verification_status', 'pending').is('deleted_at', null),
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('is_active', true).eq('is_deleted', false),
    ]);

    const { count: pendingReports } = await supabase.from('reported_reviews').select('id', { count: 'exact', head: true }).eq('status', 'pending');

    return res.json({
      success: true,
      data: {
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        totalCompanies: totalCompanies || 0,
        totalReviews: totalReviews || 0,
        totalReports: totalReports || 0,
        pendingReports: pendingReports || 0,
        pendingEmployments: pendingEmployments || 0,
      },
    });
  } catch (err) {
    console.error('getAnalytics error:', err);
    return res.status(500).json({ success: false, error: { message: 'Server error', code: 'SERVER_ERROR' } });
  }
};

// ─── AUDIT LOGS ───────────────────────────────────────────────────────────────

/**
 * GET /api/admin/audit-logs?limit=20&page=1
 */
exports.getAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { data, error, count } = await supabase
      .from('audit_logs')
      .select('*, admin:admin_id(id, email)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (error) throw error;

    return res.json({
      success: true,
      data: data || [],
      pagination: { total: count || 0, page: parseInt(page), limit: parseInt(limit) },
    });
  } catch (err) {
    console.error('getAuditLogs error:', err);
    return res.status(500).json({ success: false, error: { message: 'Server error', code: 'SERVER_ERROR' } });
  }
};
