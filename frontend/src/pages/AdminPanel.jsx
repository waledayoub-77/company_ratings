import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Shield,
  Users,
  Building2,
  FileText,
  Flag,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  ChevronDown,
  Eye,
  Ban,
  Trash2,
  BarChart3,
  Activity,
  Clock,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react'
import PageHeader from '../components/ui/PageHeader.jsx'
import Badge from '../components/ui/Badge.jsx'
import Reveal from '../components/ui/Reveal.jsx'
import {
  getAdminAnalytics,
  getReports,
  getReportStats,
  resolveReport,
  getAdminCompanies,
  verifyCompany,
  getAdminUsers,
  suspendUser,
  unsuspendUser,
  deleteUser,
  getAuditLogs,
} from '../api/admin.js'

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('overview')
  const [reportCount, setReportCount] = useState(0)
  const [companyCount, setCompanyCount] = useState(0)

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'reports', label: 'Reports', icon: Flag, badge: reportCount || null },
    { id: 'companies', label: 'Companies', icon: Building2, badge: companyCount || null },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'audit', label: 'Audit Log', icon: Activity },
  ]

  return (
    <div className="min-h-screen bg-ice-50">
      <PageHeader
        tag="System Admin"
        title="Platform Administration"
        subtitle="Moderate content, manage users and companies, and monitor platform health."
      />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 pb-20">
        {/* Tabs */}
        <div className="flex items-center gap-1 mb-8 border-b border-navy-100/50 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id ? 'text-navy-900' : 'text-navy-400 hover:text-navy-600'
              }`}
            >
              <tab.icon size={15} />
              {tab.label}
              {tab.badge && (
                <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {tab.badge}
                </span>
              )}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="adminTab"
                  className="absolute bottom-0 left-2 right-2 h-[2px] bg-navy-500 rounded-full"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && <OverviewTab onSwitch={setActiveTab} setReportCount={setReportCount} setCompanyCount={setCompanyCount} />}
        {activeTab === 'reports' && <ReportsTab setReportCount={setReportCount} />}
        {activeTab === 'companies' && <CompaniesTab setCompanyCount={setCompanyCount} />}
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'audit' && <AuditTab />}
      </div>
    </div>
  )
}

/* ─── Overview Tab ─── */
function OverviewTab({ onSwitch, setReportCount, setCompanyCount }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError('')
      try {
        const res = await getAdminAnalytics()
        setStats(res.data)
        setReportCount(res.data.pendingReports || 0)
      } catch (err) {
        setError(err.message || 'Failed to load analytics')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [setReportCount])

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} />

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers?.toLocaleString() || '0', icon: Users, change: `${stats.activeUsers || 0} active` },
    { label: 'Companies', value: stats.totalCompanies?.toLocaleString() || '0', icon: Building2, change: `${stats.pendingEmployments || 0} pending employments` },
    { label: 'Reviews', value: stats.totalReviews?.toLocaleString() || '0', icon: FileText, change: `${stats.totalReports || 0} total reports` },
    { label: 'Open Reports', value: String(stats.pendingReports || 0), icon: Flag, change: stats.pendingReports > 0 ? 'Action needed' : 'All clear' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <Reveal key={stat.label} delay={i * 0.08}>
            <div className="bg-white rounded-2xl border border-navy-100/50 p-5">
              <stat.icon size={18} className="text-navy-500 mb-3" strokeWidth={1.8} />
              <p className="text-2xl font-serif font-bold text-navy-900">{stat.value}</p>
              <p className="text-xs text-navy-400 mt-1">{stat.label}</p>
              <p className="text-[11px] text-navy-300 mt-2">{stat.change}</p>
            </div>
          </Reveal>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Reveal delay={0.1}>
          <button
            onClick={() => onSwitch('reports')}
            className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-2xl p-5 hover:bg-red-100 transition-all w-full text-left"
          >
            <Flag size={20} className="text-red-500" />
            <div>
              <p className="text-sm font-semibold text-red-700">Review Reports</p>
              <p className="text-xs text-red-500">{stats.pendingReports || 0} pending</p>
            </div>
          </button>
        </Reveal>
        <Reveal delay={0.15}>
          <button
            onClick={() => onSwitch('companies')}
            className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-2xl p-5 hover:bg-amber-100 transition-all w-full text-left"
          >
            <Building2 size={20} className="text-amber-600" />
            <div>
              <p className="text-sm font-semibold text-amber-700">Company Approvals</p>
              <p className="text-xs text-amber-500">{stats.totalCompanies || 0} total</p>
            </div>
          </button>
        </Reveal>
        <Reveal delay={0.2}>
          <button
            onClick={() => onSwitch('audit')}
            className="flex items-center gap-3 bg-navy-50 border border-navy-100 rounded-2xl p-5 hover:bg-navy-100 transition-all w-full text-left"
          >
            <Activity size={20} className="text-navy-600" />
            <div>
              <p className="text-sm font-semibold text-navy-700">Audit Log</p>
              <p className="text-xs text-navy-400">View recent actions</p>
            </div>
          </button>
        </Reveal>
      </div>
    </div>
  )
}

/* ─── Reports Tab ─── */
function ReportsTab({ setReportCount }) {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(null)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ total: 0 })
  const [statusFilter, setStatusFilter] = useState('pending')

  const loadReports = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getReports({ status: statusFilter || undefined, page, limit: 10 })
      setReports(res.data || [])
      setPagination(res.pagination || { total: 0 })
      if (statusFilter === 'pending') {
        setReportCount(res.pagination?.total || 0)
      }
    } catch (err) {
      setError(err.message || 'Failed to load reports')
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, setReportCount])

  useEffect(() => { loadReports() }, [loadReports])

  const handleResolve = async (reportId, action) => {
    setActionLoading(reportId)
    try {
      await resolveReport(reportId, { action })
      setReports(prev => prev.filter(r => r.id !== reportId))
      setPagination(prev => ({ ...prev, total: Math.max(0, prev.total - 1) }))
      if (statusFilter === 'pending') setReportCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      alert(err.message || 'Failed to resolve report')
    } finally {
      setActionLoading(null)
    }
  }

  const reasonLabel = (reason) => {
    const map = { false_info: 'False Information', spam: 'Spam', harassment: 'Harassment', other: 'Other' }
    return map[reason] || reason
  }

  const reasonVariant = (reason) => {
    if (reason === 'harassment') return 'danger'
    if (reason === 'false_info') return 'warning'
    return 'default'
  }

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} onRetry={loadReports} />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 mb-2">
        <h2 className="text-lg font-semibold text-navy-900">
          Reported Reviews <span className="text-sm font-normal text-navy-400">({pagination.total} total)</span>
        </h2>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            className="h-9 px-3 rounded-lg border border-navy-200 text-sm text-navy-600 bg-white focus:outline-none focus:ring-2 focus:ring-navy-500/20"
          >
            <option value="pending">Pending</option>
            <option value="dismissed">Dismissed</option>
            <option value="resolved">Resolved</option>
            <option value="">All</option>
          </select>
        </div>
      </div>

      {reports.length === 0 && (
        <div className="text-center py-16">
          <CheckCircle2 size={32} className="text-emerald-400 mx-auto mb-3" />
          <p className="text-sm text-navy-500">No {statusFilter || ''} reports found.</p>
        </div>
      )}

      {reports.map((report, i) => (
        <Reveal key={report.id} delay={i * 0.05}>
          <div className="bg-white rounded-2xl border border-navy-100/50 p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={reasonVariant(report.reason)}>
                    {reasonLabel(report.reason)}
                  </Badge>
                  <span className="text-xs text-navy-400">
                    Report #{report.id?.slice(0, 8)}
                  </span>
                </div>
                <p className="text-xs text-navy-400">
                  Reported by {report.reporter?.email || 'Unknown'} · {new Date(report.created_at).toLocaleDateString()}
                </p>
              </div>
              <AlertTriangle size={18} className="text-amber-500 shrink-0" />
            </div>

            {/* Reported review content */}
            <div className="bg-red-50/50 rounded-xl p-4 border border-red-100/50 mb-3">
              <p className="text-xs font-medium text-red-600 mb-1">Reported Review</p>
              <p className="text-sm text-navy-700 italic">"{report.review?.content || 'Review content unavailable'}"</p>
            </div>

            {/* Reporter description */}
            {report.description && (
              <p className="text-xs text-navy-500 mb-4">
                <strong>Reporter notes:</strong> {report.description}
              </p>
            )}

            {/* Actions — only show for pending reports */}
            {report.status === 'pending' && (
              <div className="flex items-center gap-2 pt-3 border-t border-navy-50">
                <button
                  onClick={() => handleResolve(report.id, 'resolved')}
                  disabled={actionLoading === report.id}
                  className="h-9 px-4 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {actionLoading === report.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                  Remove Review
                </button>
                <button
                  onClick={() => handleResolve(report.id, 'dismissed')}
                  disabled={actionLoading === report.id}
                  className="h-9 px-4 border border-navy-200 text-navy-600 text-xs font-medium rounded-lg hover:bg-navy-50 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  <CheckCircle2 size={13} />
                  Dismiss Report
                </button>
              </div>
            )}

            {report.status !== 'pending' && (
              <div className="pt-3 border-t border-navy-50">
                <Badge variant={report.status === 'dismissed' ? 'default' : 'danger'}>
                  {report.status === 'dismissed' ? 'Dismissed' : 'Resolved'}
                </Badge>
              </div>
            )}
          </div>
        </Reveal>
      ))}

      <Pagination page={page} setPage={setPage} total={pagination.total} limit={10} />
    </div>
  )
}

/* ─── Companies Tab ─── */
function CompaniesTab({ setCompanyCount }) {
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(null)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ total: 0 })

  const loadCompanies = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getAdminCompanies({ page, limit: 10 })
      setCompanies(res.data || [])
      setPagination(res.pagination || { total: 0 })
      const unverified = (res.data || []).filter(c => !c.is_verified).length
      setCompanyCount(unverified)
    } catch (err) {
      setError(err.message || 'Failed to load companies')
    } finally {
      setLoading(false)
    }
  }, [page, setCompanyCount])

  useEffect(() => { loadCompanies() }, [loadCompanies])

  const handleVerify = async (companyId) => {
    setActionLoading(companyId)
    try {
      await verifyCompany(companyId)
      setCompanies(prev => prev.map(c =>
        c.id === companyId ? { ...c, is_verified: true } : c
      ))
      setCompanyCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      alert(err.message || 'Failed to verify company')
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} onRetry={loadCompanies} />

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-navy-900">
        Companies
        <span className="text-sm font-normal text-navy-400 ml-2">({pagination.total} total)</span>
      </h2>

      {companies.length === 0 && (
        <div className="text-center py-16">
          <Building2 size={32} className="text-navy-200 mx-auto mb-3" />
          <p className="text-sm text-navy-500">No companies found.</p>
        </div>
      )}

      {companies.map((company, i) => (
        <Reveal key={company.id} delay={i * 0.08}>
          <div className="bg-white rounded-2xl border border-navy-100/50 p-6 hover:border-navy-200 transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-4 flex-1">
                <div className="w-12 h-12 rounded-xl bg-navy-100 flex items-center justify-center">
                  <Building2 size={22} className="text-navy-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-navy-900">{company.name}</h3>
                    {company.is_verified && (
                      <Badge variant="success">Verified</Badge>
                    )}
                  </div>
                  <p className="text-xs text-navy-400 mt-0.5">
                    {company.industry || 'No industry'} · {company.location || 'No location'}
                  </p>
                  <p className="text-xs text-navy-300 mt-0.5">
                    Admin: {company.owner?.email || 'Unknown'} · {new Date(company.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {!company.is_verified && (
                  <button
                    onClick={() => handleVerify(company.id)}
                    disabled={actionLoading === company.id}
                    className="h-9 px-4 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {actionLoading === company.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                    Verify
                  </button>
                )}
              </div>
            </div>
          </div>
        </Reveal>
      ))}

      <Pagination page={page} setPage={setPage} total={pagination.total} limit={10} />
    </div>
  )
}

/* ─── Users Tab ─── */
function UsersTab() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [searchDebounced, setSearchDebounced] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ total: 0 })
  const [actionLoading, setActionLoading] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [suspendModal, setSuspendModal] = useState(null)
  const [suspendReason, setSuspendReason] = useState('')

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounced(search)
      setPage(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [search])

  const loadUsers = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getAdminUsers({
        search: searchDebounced || undefined,
        role: roleFilter || undefined,
        page,
        limit: 10,
      })
      setUsers(res.data || [])
      setPagination(res.pagination || { total: 0 })
    } catch (err) {
      setError(err.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [searchDebounced, roleFilter, page])

  useEffect(() => { loadUsers() }, [loadUsers])

  const handleSuspend = async (userId) => {
    if (!suspendReason.trim()) {
      alert('Please provide a reason for suspension')
      return
    }
    setActionLoading(userId)
    try {
      await suspendUser(userId, { reason: suspendReason.trim() })
      setUsers(prev => prev.map(u =>
        u.id === userId ? { ...u, is_active: false } : u
      ))
      setSuspendModal(null)
      setSuspendReason('')
    } catch (err) {
      alert(err.message || 'Failed to suspend user')
    } finally {
      setActionLoading(null)
    }
  }

  const handleUnsuspend = async (userId) => {
    setActionLoading(userId)
    try {
      await unsuspendUser(userId)
      setUsers(prev => prev.map(u =>
        u.id === userId ? { ...u, is_active: true } : u
      ))
    } catch (err) {
      alert(err.message || 'Failed to unsuspend user')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (userId) => {
    setActionLoading(userId)
    try {
      await deleteUser(userId)
      setUsers(prev => prev.filter(u => u.id !== userId))
      setPagination(prev => ({ ...prev, total: Math.max(0, prev.total - 1) }))
      setConfirmDelete(null)
    } catch (err) {
      alert(err.message || 'Failed to delete user')
    } finally {
      setActionLoading(null)
    }
  }

  const roleLabel = (role) => {
    const map = { employee: 'Employee', company_admin: 'Company Admin', system_admin: 'System Admin' }
    return map[role] || role
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-lg font-semibold text-navy-900">User Management</h2>
        <div className="flex items-center gap-2">
          <div className="relative w-56">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 rounded-xl border border-navy-200 bg-white pl-10 pr-4 text-sm placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 transition-all"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1) }}
            className="h-10 px-3 rounded-xl border border-navy-200 text-sm text-navy-600 bg-white focus:outline-none focus:ring-2 focus:ring-navy-500/20"
          >
            <option value="">All Roles</option>
            <option value="employee">Employee</option>
            <option value="company_admin">Company Admin</option>
            <option value="system_admin">System Admin</option>
          </select>
        </div>
      </div>

      {loading && <LoadingState />}
      {error && <ErrorState message={error} onRetry={loadUsers} />}

      {!loading && !error && (
        <>
          <div className="bg-white rounded-2xl border border-navy-100/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-navy-100/50">
                    <th className="text-left text-xs font-semibold text-navy-400 uppercase tracking-wider px-6 py-4">User</th>
                    <th className="text-left text-xs font-semibold text-navy-400 uppercase tracking-wider px-6 py-4">Role</th>
                    <th className="text-left text-xs font-semibold text-navy-400 uppercase tracking-wider px-6 py-4">Status</th>
                    <th className="text-left text-xs font-semibold text-navy-400 uppercase tracking-wider px-6 py-4">Verified</th>
                    <th className="text-left text-xs font-semibold text-navy-400 uppercase tracking-wider px-6 py-4">Joined</th>
                    <th className="text-right text-xs font-semibold text-navy-400 uppercase tracking-wider px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id} className="border-b border-navy-50 last:border-0 hover:bg-navy-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-navy-400 to-navy-600 flex items-center justify-center">
                            <span className="text-white text-xs font-semibold">
                              {user.email?.[0]?.toUpperCase() || 'U'}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-navy-900 truncate max-w-[200px]">{user.email}</p>
                            <p className="text-[10px] text-navy-300">{user.id?.slice(0, 8)}...</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={user.role === 'system_admin' ? 'danger' : user.role === 'company_admin' ? 'info' : 'default'}>
                          {roleLabel(user.role)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={user.is_active ? 'success' : 'danger'}>
                          {user.is_active ? 'Active' : 'Suspended'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        {user.email_verified ? (
                          <CheckCircle2 size={16} className="text-emerald-500" />
                        ) : (
                          <XCircle size={16} className="text-navy-300" />
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-navy-400">{new Date(user.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-right">
                        {user.role !== 'system_admin' && (
                          <div className="flex items-center justify-end gap-1">
                            {user.is_active ? (
                              <button
                                onClick={() => { setSuspendModal(user.id); setSuspendReason('') }}
                                disabled={actionLoading === user.id}
                                title="Suspend user"
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-navy-400 hover:bg-amber-50 hover:text-amber-600 transition-colors disabled:opacity-50"
                              >
                                <Ban size={14} />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUnsuspend(user.id)}
                                disabled={actionLoading === user.id}
                                title="Unsuspend user"
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-navy-400 hover:bg-emerald-50 hover:text-emerald-600 transition-colors disabled:opacity-50"
                              >
                                {actionLoading === user.id ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                              </button>
                            )}
                            <button
                              onClick={() => setConfirmDelete(user.id)}
                              disabled={actionLoading === user.id}
                              title="Delete user"
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-navy-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {users.length === 0 && (
              <div className="text-center py-12">
                <Users size={28} className="text-navy-200 mx-auto mb-2" />
                <p className="text-sm text-navy-400">No users found.</p>
              </div>
            )}
          </div>

          <Pagination page={page} setPage={setPage} total={pagination.total} limit={10} />
        </>
      )}

      {/* Suspend confirmation modal */}
      {suspendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl mx-4">
            <h3 className="text-lg font-semibold text-navy-900 mb-2">Suspend User</h3>
            <p className="text-sm text-navy-500 mb-4">Please provide a reason for suspending this user. They will receive an email notification.</p>
            <textarea
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              placeholder="Reason for suspension..."
              className="w-full h-24 rounded-xl border border-navy-200 px-4 py-3 text-sm placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 resize-none mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setSuspendModal(null); setSuspendReason('') }}
                className="h-10 px-5 text-sm text-navy-500 hover:text-navy-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSuspend(suspendModal)}
                disabled={actionLoading === suspendModal || !suspendReason.trim()}
                className="h-10 px-5 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {actionLoading === suspendModal ? <Loader2 size={14} className="animate-spin" /> : <Ban size={14} />}
                Suspend
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl mx-4">
            <h3 className="text-lg font-semibold text-red-700 mb-2">Delete User</h3>
            <p className="text-sm text-navy-500 mb-6">This action is irreversible. The user's account will be permanently deleted and they will receive an email notification.</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="h-10 px-5 text-sm text-navy-500 hover:text-navy-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                disabled={actionLoading === confirmDelete}
                className="h-10 px-5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {actionLoading === confirmDelete ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Audit Tab ─── */
function AuditTab() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ total: 0 })

  const loadLogs = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getAuditLogs({ page, limit: 20 })
      setLogs(res.data || [])
      setPagination(res.pagination || { total: 0 })
    } catch (err) {
      setError(err.message || 'Failed to load audit logs')
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => { loadLogs() }, [loadLogs])

  const formatAction = (action) => {
    const map = {
      report_dismissed: 'Dismissed report',
      report_resolved: 'Resolved report',
      user_suspended: 'Suspended user',
      user_unsuspended: 'Unsuspended user',
      user_deleted: 'Deleted user',
      company_verified: 'Verified company',
      employment_overridden: 'Overrode employment',
      bulk_suspend: 'Bulk suspended users',
    }
    return map[action] || action?.replace(/_/g, ' ') || 'Unknown action'
  }

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} onRetry={loadLogs} />

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-navy-900 mb-2">
        Audit Log <span className="text-sm font-normal text-navy-400">({pagination.total} entries)</span>
      </h2>

      {logs.length === 0 && (
        <div className="text-center py-16">
          <Activity size={32} className="text-navy-200 mx-auto mb-3" />
          <p className="text-sm text-navy-500">No audit log entries yet.</p>
        </div>
      )}

      {logs.length > 0 && (
        <div className="bg-white rounded-2xl border border-navy-100/50 overflow-hidden">
          {logs.map((entry, i) => (
            <div
              key={entry.id || i}
              className={`flex items-start gap-4 px-6 py-4 ${
                i < logs.length - 1 ? 'border-b border-navy-50' : ''
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-navy-50 flex items-center justify-center shrink-0 mt-0.5">
                <Shield size={14} className="text-navy-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-navy-800 font-medium">{formatAction(entry.action)}</p>
                <p className="text-xs text-navy-400 mt-0.5">
                  by {entry.admin?.email || 'System'}
                  {entry.entity_type && ` · ${entry.entity_type}`}
                  {entry.details && typeof entry.details === 'object' && entry.details.reason && (
                    <> · Reason: {entry.details.reason}</>
                  )}
                  {entry.details && typeof entry.details === 'object' && entry.details.companyName && (
                    <> · {entry.details.companyName}</>
                  )}
                  {entry.details && typeof entry.details === 'object' && entry.details.email && (
                    <> · {entry.details.email}</>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-navy-400 shrink-0">
                <Clock size={12} />
                {new Date(entry.created_at).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination page={page} setPage={setPage} total={pagination.total} limit={20} />
    </div>
  )
}

/* ─── Shared Components ─── */

function LoadingState() {
  return (
    <div className="text-center py-16">
      <Loader2 size={28} className="text-navy-400 mx-auto mb-3 animate-spin" />
      <p className="text-sm text-navy-400">Loading...</p>
    </div>
  )
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="text-center py-16">
      <AlertCircle size={32} className="text-red-400 mx-auto mb-3" />
      <p className="text-sm text-red-600 mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="h-9 px-5 bg-navy-900 text-white text-sm font-medium rounded-lg hover:bg-navy-800 transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  )
}

function Pagination({ page, setPage, total, limit }) {
  const totalPages = Math.ceil(total / limit)
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between pt-4">
      <p className="text-xs text-navy-400">
        Page {page} of {totalPages} ({total} total)
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page <= 1}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-navy-400 hover:bg-navy-50 hover:text-navy-600 transition-colors disabled:opacity-30"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-navy-400 hover:bg-navy-50 hover:text-navy-600 transition-colors disabled:opacity-30"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
