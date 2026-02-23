const supabase = require('../config/database');
const { AppError } = require('../middlewares/errorHandler');
const { logAdminAction } = require('../utils/auditLogger');
const reportService = require('./reportService');
const {
  sendAccountSuspendedEmail,
  sendAccountUnsuspendedEmail,
} = require('./emailService');

// ─── REPORT DELEGATIONS ──────────────────────────────────────────────────────

const getReports = (filters) => reportService.getReports(filters);
const resolveReport = (payload) => reportService.resolveReport(payload);

// ─── USER MANAGEMENT ─────────────────────────────────────────────────────────

/**
 * List users with search, role filter, and pagination
 */
const getUsers = async ({ search, role, page = 1, limit = 20 }) => {
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const from = (safePage - 1) * safeLimit;
  const to = from + safeLimit - 1;

  let query = supabase
    .from('users')
    .select('id, email, role, email_verified, is_active, is_deleted, created_at', { count: 'exact' })
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (role) {
    query = query.eq('role', role);
  }

  if (search) {
    query = query.ilike('email', `%${search}%`);
  }

  const { data: users, error, count } = await query;
  if (error) throw error;

  // If search provided, also try searching by employee full_name
  // and merge results (Supabase doesn't support cross-table OR in a single select easily)
  let enrichedUsers = users || [];

  if (search) {
    // Fetch employees matching full_name to get their user_ids
    const { data: matchingEmployees } = await supabase
      .from('employees')
      .select('user_id, full_name')
      .ilike('full_name', `%${search}%`)
      .is('deleted_at', null);

    if (matchingEmployees && matchingEmployees.length > 0) {
      const matchedUserIds = matchingEmployees.map((e) => e.user_id);
      const existingIds = new Set(enrichedUsers.map((u) => u.id));
      const missingIds = matchedUserIds.filter((uid) => !existingIds.has(uid));

      if (missingIds.length > 0) {
        const { data: extraUsers } = await supabase
          .from('users')
          .select('id, email, role, email_verified, is_active, is_deleted, created_at')
          .in('id', missingIds)
          .is('deleted_at', null);

        if (extraUsers) {
          enrichedUsers = [...enrichedUsers, ...extraUsers];
        }
      }
    }
  }

  return {
    users: enrichedUsers.map((u) => ({
      id: u.id,
      email: u.email,
      role: u.role,
      emailVerified: u.email_verified,
      isActive: u.is_active,
      createdAt: u.created_at,
    })),
    pagination: {
      total: count || 0,
      page: safePage,
      pages: Math.ceil((count || 0) / safeLimit),
      limit: safeLimit,
    },
  };
};

/**
 * Suspend a user account
 * - Cannot suspend another system_admin
 * - Revokes all refresh tokens
 * - Logs to audit_logs
 */
const suspendUser = async ({ userId, adminId, reason, ipAddress, userAgent }) => {
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, email, role, is_active')
    .eq('id', userId)
    .is('deleted_at', null)
    .maybeSingle();

  if (userError) throw userError;
  if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');

  if (user.role === 'system_admin') {
    throw new AppError('Cannot suspend a system administrator', 403, 'CANNOT_SUSPEND_ADMIN');
  }

  if (!user.is_active) {
    throw new AppError('User is already suspended', 400, 'ALREADY_SUSPENDED');
  }

  // Suspend user
  const { error: updateError } = await supabase
    .from('users')
    .update({ is_active: false })
    .eq('id', userId);

  if (updateError) throw updateError;

  // Revoke all refresh tokens
  await supabase
    .from('refresh_tokens')
    .update({ is_revoked: true })
    .eq('user_id', userId);

  // Audit log
  await logAdminAction({
    adminId,
    action: 'suspend_user',
    entityType: 'user',
    entityId: userId,
    details: { reason: reason || 'No reason provided', email: user.email },
    ipAddress,
    userAgent,
  });

  // Send suspension email (non-blocking)
  try {
    await sendAccountSuspendedEmail({ to: user.email, name: user.email, reason });
  } catch (emailErr) {
    console.error('Failed to send suspension email:', emailErr.message);
  }

  // Return updated user
  const { data: updated } = await supabase
    .from('users')
    .select('id, email, role, email_verified, is_active, created_at')
    .eq('id', userId)
    .single();

  return {
    id: updated.id,
    email: updated.email,
    role: updated.role,
    emailVerified: updated.email_verified,
    isActive: updated.is_active,
    createdAt: updated.created_at,
  };
};

/**
 * Unsuspend (reactivate) a user account
 */
const unsuspendUser = async ({ userId, adminId, ipAddress, userAgent }) => {
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, email, role, is_active')
    .eq('id', userId)
    .is('deleted_at', null)
    .maybeSingle();

  if (userError) throw userError;
  if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');

  if (user.is_active) {
    throw new AppError('User is not suspended', 400, 'NOT_SUSPENDED');
  }

  const { error: updateError } = await supabase
    .from('users')
    .update({ is_active: true })
    .eq('id', userId);

  if (updateError) throw updateError;

  await logAdminAction({
    adminId,
    action: 'unsuspend_user',
    entityType: 'user',
    entityId: userId,
    details: { email: user.email },
    ipAddress,
    userAgent,
  });

  // Send reactivation email (non-blocking)
  try {
    await sendAccountUnsuspendedEmail({ to: user.email, name: user.email });
  } catch (emailErr) {
    console.error('Failed to send unsuspension email:', emailErr.message);
  }

  const { data: updated } = await supabase
    .from('users')
    .select('id, email, role, email_verified, is_active, created_at')
    .eq('id', userId)
    .single();

  return {
    id: updated.id,
    email: updated.email,
    role: updated.role,
    emailVerified: updated.email_verified,
    isActive: updated.is_active,
    createdAt: updated.created_at,
  };
};

/**
 * Soft-delete a user (BR-018: reviews remain, show "Deleted User")
 * - Cannot delete system_admin
 */
const deleteUser = async ({ userId, adminId, ipAddress, userAgent }) => {
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, email, role')
    .eq('id', userId)
    .is('deleted_at', null)
    .maybeSingle();

  if (userError) throw userError;
  if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');

  if (user.role === 'system_admin') {
    throw new AppError('Cannot delete a system administrator', 403, 'CANNOT_DELETE_ADMIN');
  }

  // Soft delete
  const { error: deleteError } = await supabase
    .from('users')
    .update({ deleted_at: new Date().toISOString(), is_deleted: true, is_active: false })
    .eq('id', userId);

  if (deleteError) throw deleteError;

  // Revoke all refresh tokens
  await supabase
    .from('refresh_tokens')
    .update({ is_revoked: true })
    .eq('user_id', userId);

  await logAdminAction({
    adminId,
    action: 'delete_user',
    entityType: 'user',
    entityId: userId,
    details: { email: user.email },
    ipAddress,
    userAgent,
  });

  return { message: 'User deleted successfully' };
};

// ─── COMPANY MANAGEMENT ──────────────────────────────────────────────────────

/**
 * List companies (admin view) with search and pagination
 */
const getCompanies = async ({ search, page = 1, limit = 20 }) => {
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const from = (safePage - 1) * safeLimit;
  const to = from + safeLimit - 1;

  let query = supabase
    .from('companies')
    .select('id, user_id, name, industry, location, overall_rating, total_reviews, is_verified, created_at', { count: 'exact' })
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (search) {
    query = query.or(`name.ilike.%${search}%,industry.ilike.%${search}%,location.ilike.%${search}%`);
  }

  const { data: companies, error, count } = await query;
  if (error) throw error;

  return {
    companies: (companies || []).map((c) => ({
      id: c.id,
      userId: c.user_id,
      name: c.name,
      industry: c.industry,
      location: c.location,
      overallRating: c.overall_rating,
      totalReviews: c.total_reviews,
      isVerified: c.is_verified,
      createdAt: c.created_at,
    })),
    pagination: {
      total: count || 0,
      page: safePage,
      pages: Math.ceil((count || 0) / safeLimit),
      limit: safeLimit,
    },
  };
};

/**
 * Verify a company (admin toggle)
 */
const verifyCompany = async ({ companyId, adminId, ipAddress, userAgent }) => {
  const { data: company, error: fetchError } = await supabase
    .from('companies')
    .select('id, name, is_verified')
    .eq('id', companyId)
    .is('deleted_at', null)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!company) throw new AppError('Company not found', 404, 'COMPANY_NOT_FOUND');

  if (company.is_verified) {
    throw new AppError('Company is already verified', 400, 'ALREADY_VERIFIED');
  }

  const { data: updated, error: updateError } = await supabase
    .from('companies')
    .update({ is_verified: true })
    .eq('id', companyId)
    .select()
    .single();

  if (updateError) throw updateError;

  await logAdminAction({
    adminId,
    action: 'verify_company',
    entityType: 'company',
    entityId: companyId,
    details: { companyName: company.name },
    ipAddress,
    userAgent,
  });

  return updated;
};

// ─── EMPLOYMENT OVERRIDE ─────────────────────────────────────────────────────

/**
 * Admin force-approve an employment (override)
 */
const overrideEmployment = async ({ employmentId, adminId, ipAddress, userAgent }) => {
  const { data: employment, error: fetchError } = await supabase
    .from('employments')
    .select('id, employee_id, company_id, verification_status')
    .eq('id', employmentId)
    .is('deleted_at', null)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!employment) throw new AppError('Employment not found', 404, 'EMPLOYMENT_NOT_FOUND');

  if (employment.verification_status === 'approved') {
    throw new AppError('Employment is already approved', 400, 'ALREADY_APPROVED');
  }

  const { data: updated, error: updateError } = await supabase
    .from('employments')
    .update({
      verification_status: 'approved',
      verified_by: adminId,
      verified_at: new Date().toISOString(),
    })
    .eq('id', employmentId)
    .select()
    .single();

  if (updateError) throw updateError;

  await logAdminAction({
    adminId,
    action: 'override_employment',
    entityType: 'employment',
    entityId: employmentId,
    details: {
      employeeId: employment.employee_id,
      companyId: employment.company_id,
      previousStatus: employment.verification_status,
    },
    ipAddress,
    userAgent,
  });

  return updated;
};

// ─── PLATFORM ANALYTICS ──────────────────────────────────────────────────────

/**
 * Get platform-wide analytics for the admin dashboard
 */
const getAnalytics = async () => {
  // Total users (non-deleted)
  const { count: totalUsers } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .is('deleted_at', null);

  // Total companies
  const { count: totalCompanies } = await supabase
    .from('companies')
    .select('*', { count: 'exact', head: true })
    .is('deleted_at', null);

  // Total reviews
  const { count: totalReviews } = await supabase
    .from('company_reviews')
    .select('*', { count: 'exact', head: true })
    .is('deleted_at', null);

  // Average platform rating
  const { data: ratingData } = await supabase
    .from('company_reviews')
    .select('overall_rating')
    .is('deleted_at', null);

  const averagePlatformRating =
    ratingData && ratingData.length > 0
      ? Number(
          (ratingData.reduce((sum, r) => sum + r.overall_rating, 0) / ratingData.length).toFixed(1)
        )
      : 0;

  // Users by role
  const { data: roleData } = await supabase
    .from('users')
    .select('role')
    .is('deleted_at', null);

  const usersByRole = (roleData || []).reduce(
    (acc, u) => {
      acc[u.role] = (acc[u.role] || 0) + 1;
      return acc;
    },
    { employee: 0, company_admin: 0, system_admin: 0 }
  );

  // Reviews this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count: reviewsThisMonth } = await supabase
    .from('company_reviews')
    .select('*', { count: 'exact', head: true })
    .is('deleted_at', null)
    .gte('created_at', startOfMonth.toISOString());

  // Pending reports
  const { count: pendingReports } = await supabase
    .from('reported_reviews')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  // Recent activity from audit_logs (last 20)
  const { data: recentLogs } = await supabase
    .from('audit_logs')
    .select('action, entity_type, created_at')
    .order('created_at', { ascending: false })
    .limit(20);

  const recentActivity = (recentLogs || []).map((log) => ({
    action: log.action,
    entityType: log.entity_type,
    timestamp: log.created_at,
  }));

  return {
    totalUsers: totalUsers || 0,
    totalCompanies: totalCompanies || 0,
    totalReviews: totalReviews || 0,
    averagePlatformRating,
    usersByRole,
    reviewsThisMonth: reviewsThisMonth || 0,
    pendingReports: pendingReports || 0,
    recentActivity,
  };
};

// ─── AUDIT LOGS ──────────────────────────────────────────────────────────────

/**
 * List audit logs with filters and pagination
 */
const getAuditLogs = async ({ adminId, action, page = 1, limit = 20 }) => {
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const from = (safePage - 1) * safeLimit;
  const to = from + safeLimit - 1;

  let query = supabase
    .from('audit_logs')
    .select(
      `id, admin_id, action, entity_type, entity_id, details, ip_address, user_agent, created_at,
       users!audit_logs_admin_id_fkey (email)`,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(from, to);

  if (adminId) {
    query = query.eq('admin_id', adminId);
  }

  if (action) {
    query = query.eq('action', action);
  }

  const { data: logs, error, count } = await query;
  if (error) throw error;

  return {
    logs: (logs || []).map((log) => ({
      id: log.id,
      adminId: log.admin_id,
      adminEmail: log.users?.email || null,
      action: log.action,
      entityType: log.entity_type,
      entityId: log.entity_id,
      details: log.details,
      ipAddress: log.ip_address,
      userAgent: log.user_agent,
      createdAt: log.created_at,
    })),
    pagination: {
      total: count || 0,
      page: safePage,
      pages: Math.ceil((count || 0) / safeLimit),
      limit: safeLimit,
    },
  };
};

module.exports = {
  // Reports (delegated)
  getReports,
  resolveReport,
  // Users
  getUsers,
  suspendUser,
  unsuspendUser,
  deleteUser,
  // Companies
  getCompanies,
  verifyCompany,
  // Employment
  overrideEmployment,
  // Analytics
  getAnalytics,
  // Audit
  getAuditLogs,
};
