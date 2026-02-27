import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield,
  Users,
  Building2,
  FileText,
  Flag,
  AlertTriangle,
  CheckCircle2,
  Search,
  Ban,
  Trash2,
  BarChart3,
  Activity,
  Clock,
  Loader2,
  RefreshCw,
  BadgeCheck,
  Plus,
  Edit2,
  X,
  ChevronLeft,
  ChevronRight,
  Save,
} from 'lucide-react'
import PageHeader from '../components/ui/PageHeader.jsx'
import Badge from '../components/ui/Badge.jsx'
import Reveal from '../components/ui/Reveal.jsx'
import {
  getAdminAnalytics,
  getReports,
  resolveReport,
  getAdminCompanies,
  verifyCompany,
  createCompany,
  updateAdminCompany,
  deleteCompany,
  getAdminUsers,
  suspendUser,
  unsuspendUser,
  deleteUser,
  getAuditLogs,
} from '../api/admin.js'

/* ─── Helpers ─── */
function timeAgo(dateStr) {
  if (!dateStr) return '—'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  return new Date(dateStr).toLocaleDateString()
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <Loader2 size={22} className="animate-spin text-navy-400" />
    </div>
  )
}

function reasonVariant(reason) {
  if (reason === 'harassment') return 'danger'
  if (reason === 'false_info') return 'warning'
  return 'default'
}

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('overview')
  const [analytics, setAnalytics] = useState(null)

  useEffect(() => {
    getAdminAnalytics()
      .then(res => setAnalytics(res?.data ?? null))
      .catch(() => {})
  }, [])

  const tabs = [
    { id: 'overview',  label: 'Overview',  icon: BarChart3 },
    { id: 'reports',   label: 'Reports',   icon: Flag,     badge: (analytics?.pendingReports ?? 0) > 0 ? analytics.pendingReports : null },
    { id: 'companies', label: 'Companies', icon: Building2 },
    { id: 'users',     label: 'Users',     icon: Users     },
    { id: 'audit',     label: 'Audit Log', icon: Activity  },
  ]

  return (
    <div className="min-h-screen bg-ice-50">
      <PageHeader
        tag="System Admin"
        title="Platform Administration"
        subtitle="Moderate content, manage users and companies, and monitor platform health."
        backHref
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
              {tab.badge != null && (
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

        {activeTab === 'overview'  && <OverviewTab  analytics={analytics} />}
        {activeTab === 'reports'   && <ReportsTab   />}
        {activeTab === 'companies' && <CompaniesTab />}
        {activeTab === 'users'     && <UsersTab     />}
        {activeTab === 'audit'     && <AuditTab     />}
      </div>
    </div>
  )
}

/* ─── Overview Tab ─── */
function OverviewTab({ analytics }) {
  const stats = analytics
    ? [
        { label: 'Total Users',     value: analytics.totalUsers?.toLocaleString()     ?? '—', icon: Users,     change: `${analytics.activeUsers ?? 0} active` },
        { label: 'Companies',       value: analytics.totalCompanies?.toLocaleString() ?? '—', icon: Building2, change: '' },
        { label: 'Reviews',         value: analytics.totalReviews?.toLocaleString()   ?? '—', icon: FileText,  change: '' },
        { label: 'Pending Reports', value: analytics.pendingReports?.toLocaleString() ?? '—', icon: Flag,      change: analytics.pendingReports > 0 ? 'Needs attention' : 'All clear' },
      ]
    : null

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats
          ? stats.map((stat, i) => (
              <Reveal key={stat.label} delay={i * 0.08}>
                <div className="bg-white rounded-2xl border border-navy-100/50 p-5">
                  <stat.icon size={18} className="text-navy-500 mb-3" strokeWidth={1.8} />
                  <p className="text-2xl font-serif font-bold text-navy-900">{stat.value}</p>
                  <p className="text-xs text-navy-400 mt-1">{stat.label}</p>
                  {stat.change && <p className="text-[11px] text-navy-300 mt-2">{stat.change}</p>}
                </div>
              </Reveal>
            ))
          : Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-navy-100/50 p-5 animate-pulse h-28" />
            ))
        }
      </div>

      {/* Quick actions */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Reveal delay={0.1}>
          <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-2xl p-5">
            <Flag size={20} className="text-red-500 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-700">Open Reports</p>
              <p className="text-xs text-red-500">{analytics ? `${analytics.pendingReports} pending` : '...'}</p>
            </div>
          </div>
        </Reveal>
        <Reveal delay={0.15}>
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-2xl p-5">
            <Building2 size={20} className="text-amber-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-700">Total Companies</p>
              <p className="text-xs text-amber-500">{analytics ? `${analytics.totalCompanies} registered` : '...'}</p>
            </div>
          </div>
        </Reveal>
        <Reveal delay={0.2}>
          <div className="flex items-center gap-3 bg-navy-50 border border-navy-100 rounded-2xl p-5">
            <Activity size={20} className="text-navy-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-navy-700">Pending Employments</p>
              <p className="text-xs text-navy-400">{analytics ? `${analytics.pendingEmployments} awaiting` : '...'}</p>
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  )
}

/* ─── Reports Tab ─── */
function ReportsTab() {
  const [reports, setReports]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [working, setWorking]   = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    getReports({ status: 'pending', limit: 50 })
      .then(res => setReports(res?.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const handleAction = async (id, action) => {
    setWorking(id)
    try {
      await resolveReport(id, { action })
      setReports(prev => prev.filter(r => r.id !== id))
    } catch (e) {
      alert(e?.message || 'Action failed')
    } finally {
      setWorking(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-navy-900 mb-2">
          Reported Reviews <span className="text-sm font-normal text-navy-400">({reports.length} pending)</span>
        </h2>
        <button onClick={load} className="p-2 rounded-lg text-navy-400 hover:text-navy-700 hover:bg-navy-50 transition-colors">
          <RefreshCw size={14} />
        </button>
      </div>

      {loading ? <Spinner /> : reports.length === 0 ? (
        <div className="bg-white rounded-2xl border border-navy-100/50 py-16 text-center text-sm text-navy-400">
          <CheckCircle2 size={28} className="mx-auto mb-3 text-emerald-400" />
          No pending reports — all clear!
        </div>
      ) : reports.map((report, i) => (
        <Reveal key={report.id} delay={i * 0.05}>
          <div className="bg-white rounded-2xl border border-navy-100/50 p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={reasonVariant(report.reason)}>
                    {report.reason?.replace('_', ' ') ?? 'Unknown'}
                  </Badge>
                </div>
                <p className="text-xs text-navy-400">
                  Reported by {report.reporter?.email ?? 'Unknown'} · {timeAgo(report.created_at)}
                </p>
              </div>
              <AlertTriangle size={18} className="text-amber-500 shrink-0" />
            </div>

            <div className="bg-red-50/50 rounded-xl p-4 border border-red-100/50 mb-3">
              <p className="text-xs font-medium text-red-600 mb-1">Reported Review</p>
              <p className="text-sm text-navy-700 italic">
                "{report.review?.content ?? '(content not available)'}"
              </p>
            </div>

            {report.description && (
              <p className="text-xs text-navy-500 mb-4">
                <strong>Reporter notes:</strong> {report.description}
              </p>
            )}

            <div className="flex items-center gap-2 pt-3 border-t border-navy-50">
              <button
                onClick={() => handleAction(report.id, 'remove')}
                disabled={working === report.id}
                className="h-9 px-4 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <Trash2 size={13} />
                Remove Review
              </button>
              <button
                onClick={() => handleAction(report.id, 'dismiss')}
                disabled={working === report.id}
                className="h-9 px-4 border border-navy-200 text-navy-600 text-xs font-medium rounded-lg hover:bg-navy-50 transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <CheckCircle2 size={13} />
                Dismiss Report
              </button>
              {working === report.id && <Loader2 size={14} className="animate-spin text-navy-400" />}
            </div>
          </div>
        </Reveal>
      ))}
    </div>
  )
}

/* ─── Companies Tab ─── */
const COMPANY_PAGE_SIZE = 5
function CompaniesTab() {
  const [companies, setCompanies]         = useState([])
  const [loading, setLoading]             = useState(true)
  const [working, setWorking]             = useState(null)
  const [search, setSearch]               = useState('')
  const [page, setPage]                   = useState(1)
  const [totalPages, setTotalPages]       = useState(1)
  const [total, setTotal]                 = useState(0)

  // Add form
  const [showAdd, setShowAdd]             = useState(false)
  const [addForm, setAddForm]             = useState({ name: '', industry: '', location: '', description: '', website: '', email: '' })
  const [addError, setAddError]           = useState('')
  const [addSubmitting, setAddSubmitting] = useState(false)

  // Edit form
  const [editingId, setEditingId]           = useState(null)
  const [editForm, setEditForm]             = useState({})
  const [editError, setEditError]           = useState('')
  const [editSubmitting, setEditSubmitting] = useState(false)

  const load = useCallback((q = '', p = 1) => {
    setLoading(true)
    getAdminCompanies({ search: q || undefined, page: p, limit: COMPANY_PAGE_SIZE })
      .then(res => {
        setCompanies(res?.data ?? [])
        const pg = res?.pagination
        setTotalPages(pg ? Math.max(1, Math.ceil(pg.total / COMPANY_PAGE_SIZE)) : 1)
        setTotal(pg?.total ?? 0)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load(search, page) }, [load, page]) // eslint-disable-line

  useEffect(() => {
    const t = setTimeout(() => { setPage(1); load(search, 1) }, 350)
    return () => clearTimeout(t)
  }, [search]) // eslint-disable-line

  const handleVerify = async (id) => {
    setWorking(id)
    try {
      await verifyCompany(id)
      setCompanies(prev => prev.map(c => c.id === id ? { ...c, is_verified: true } : c))
    } catch (e) { alert(e?.message || 'Verification failed') }
    finally { setWorking(null) }
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return
    setWorking(id)
    try {
      await deleteCompany(id)
      // refresh current page (might now be empty → go back one)
      const newTotal = total - 1
      const newMaxPage = Math.max(1, Math.ceil(newTotal / COMPANY_PAGE_SIZE))
      const nextPage = page > newMaxPage ? newMaxPage : page
      setPage(nextPage)
      load(search, nextPage)
    } catch (e) { alert(e?.message || 'Delete failed') }
    finally { setWorking(null) }
  }

  const handleAdd = async () => {
    if (!addForm.name.trim()) { setAddError('Company name is required.'); return }
    setAddError('')
    setAddSubmitting(true)
    try {
      await createCompany(addForm)
      setShowAdd(false)
      setAddForm({ name: '', industry: '', location: '', description: '', website: '', email: '' })
      setPage(1)
      load(search, 1)
    } catch (e) { setAddError(e?.message || 'Failed to create company.') }
    finally { setAddSubmitting(false) }
  }

  const openEdit = (company) => {
    setEditingId(company.id)
    setEditForm({ name: company.name, industry: company.industry || '', location: company.location || '', description: company.description || '', website: company.website || '', email: company.email || '' })
    setEditError('')
  }

  const handleEditSave = async () => {
    if (!editForm.name?.trim()) { setEditError('Name is required.'); return }
    setEditError('')
    setEditSubmitting(true)
    try {
      const updated = await updateAdminCompany(editingId, editForm)
      setCompanies(prev => prev.map(c => c.id === editingId ? { ...c, ...updated?.data } : c))
      setEditingId(null)
    } catch (e) { setEditError(e?.message || 'Save failed.') }
    finally { setEditSubmitting(false) }
  }

  const fieldCls = 'w-full h-9 rounded-lg border border-navy-200 bg-white px-3 text-sm text-navy-900 placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 transition-all'

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-lg font-semibold text-navy-900">
          Companies <span className="text-sm font-normal text-navy-400">({total})</span>
        </h2>
        <div className="flex items-center gap-3">
          <div className="relative w-52">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-400" />
            <input type="text" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)}
              className="w-full h-9 rounded-xl border border-navy-200 bg-white pl-9 pr-4 text-sm placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 transition-all" />
          </div>
          <button onClick={() => { setShowAdd(v => !v); setAddError('') }}
            className="h-9 px-4 bg-navy-900 text-white text-xs font-medium rounded-xl hover:bg-navy-800 transition-colors flex items-center gap-1.5">
            {showAdd ? <X size={13} /> : <Plus size={13} />}
            {showAdd ? 'Cancel' : 'Add Company'}
          </button>
        </div>
      </div>

      {/* Add company form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div key="add-form" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="bg-navy-50/60 border border-navy-100 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-navy-900 mb-4">New Company</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                <div><label className="text-xs text-navy-500 mb-1 block">Name *</label><input className={fieldCls} value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} placeholder="Acme Corp" /></div>
                <div><label className="text-xs text-navy-500 mb-1 block">Industry</label><input className={fieldCls} value={addForm.industry} onChange={e => setAddForm(f => ({ ...f, industry: e.target.value }))} placeholder="Technology" /></div>
                <div><label className="text-xs text-navy-500 mb-1 block">Location</label><input className={fieldCls} value={addForm.location} onChange={e => setAddForm(f => ({ ...f, location: e.target.value }))} placeholder="Riyadh, SA" /></div>
                <div><label className="text-xs text-navy-500 mb-1 block">Email</label><input className={fieldCls} type="email" value={addForm.email} onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))} placeholder="info@company.com" /></div>
                <div><label className="text-xs text-navy-500 mb-1 block">Website</label><input className={fieldCls} value={addForm.website} onChange={e => setAddForm(f => ({ ...f, website: e.target.value }))} placeholder="https://company.com" /></div>
                <div className="sm:col-span-2"><label className="text-xs text-navy-500 mb-1 block">Description</label><textarea className="w-full rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 transition-all resize-none" rows={2} value={addForm.description} onChange={e => setAddForm(f => ({ ...f, description: e.target.value }))} placeholder="Short description…" /></div>
              </div>
              {addError && <p className="text-xs text-red-600 mt-2">{addError}</p>}
              <div className="flex gap-2 mt-4">
                <button onClick={handleAdd} disabled={addSubmitting} className="h-9 px-5 bg-emerald-600 text-white text-xs font-medium rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-1.5 disabled:opacity-50">
                  {addSubmitting ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} Create Company
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Company list */}
      {loading ? <Spinner /> : companies.length === 0 ? (
        <div className="bg-white rounded-2xl border border-navy-100/50 py-12 text-center text-sm text-navy-400">No companies found.</div>
      ) : (
        <div className="space-y-3">
          {companies.map((company, i) => (
            <Reveal key={company.id} delay={i * 0.04}>
              {editingId === company.id ? (
                /* Inline edit form */
                <div className="bg-white border-2 border-navy-200 rounded-2xl p-5">
                  <div className="grid sm:grid-cols-2 gap-3 mb-3">
                    <div><label className="text-xs text-navy-500 mb-1 block">Name *</label><input className={fieldCls} value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} /></div>
                    <div><label className="text-xs text-navy-500 mb-1 block">Industry</label><input className={fieldCls} value={editForm.industry} onChange={e => setEditForm(f => ({ ...f, industry: e.target.value }))} /></div>
                    <div><label className="text-xs text-navy-500 mb-1 block">Location</label><input className={fieldCls} value={editForm.location} onChange={e => setEditForm(f => ({ ...f, location: e.target.value }))} /></div>
                    <div><label className="text-xs text-navy-500 mb-1 block">Email</label><input className={fieldCls} type="email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} /></div>
                    <div><label className="text-xs text-navy-500 mb-1 block">Website</label><input className={fieldCls} value={editForm.website} onChange={e => setEditForm(f => ({ ...f, website: e.target.value }))} /></div>
                    <div className="sm:col-span-2"><label className="text-xs text-navy-500 mb-1 block">Description</label><textarea className="w-full rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 transition-all resize-none" rows={2} value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} /></div>
                  </div>
                  {editError && <p className="text-xs text-red-600 mb-2">{editError}</p>}
                  <div className="flex gap-2">
                    <button onClick={handleEditSave} disabled={editSubmitting} className="h-8 px-4 bg-navy-900 text-white text-xs font-medium rounded-lg hover:bg-navy-800 transition-colors flex items-center gap-1.5 disabled:opacity-50">
                      {editSubmitting ? <Loader2 size={11} className="animate-spin" /> : <Save size={12} />} Save
                    </button>
                    <button onClick={() => setEditingId(null)} className="h-8 px-4 text-xs text-navy-500 hover:text-navy-700 transition-colors">Cancel</button>
                  </div>
                </div>
              ) : (
                /* Normal row */
                <div className="bg-white rounded-2xl border border-navy-100/50 p-5 hover:border-navy-200 transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-navy-100 flex items-center justify-center shrink-0">
                        <Building2 size={20} className="text-navy-500" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-navy-900 truncate">{company.name}</h3>
                          {company.is_verified ? <Badge variant="success">Verified</Badge> : <Badge variant="warning">Unverified</Badge>}
                        </div>
                        <p className="text-xs text-navy-400 mt-0.5 truncate">{[company.industry, company.location].filter(Boolean).join(' · ') || '—'}</p>
                        {company.owner?.email && <p className="text-xs text-navy-300 mt-0.5 truncate">Admin: {company.owner.email}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-navy-300">{new Date(company.created_at).toLocaleDateString()}</span>
                      {!company.is_verified && (
                        <button onClick={() => handleVerify(company.id)} disabled={working === company.id}
                          className="h-8 px-3 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-1.5 disabled:opacity-50">
                          {working === company.id ? <Loader2 size={12} className="animate-spin" /> : <BadgeCheck size={13} />} Verify
                        </button>
                      )}
                      <button onClick={() => openEdit(company)} title="Edit"
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-navy-400 hover:bg-navy-50 hover:text-navy-700 transition-colors">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDelete(company.id, company.name)} disabled={working === company.id} title="Delete"
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-navy-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50">
                        {working === company.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={14} />}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </Reveal>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button onClick={() => setPage(p => p - 1)} disabled={page <= 1}
            className="w-9 h-9 rounded-xl text-navy-600 hover:bg-navy-50 disabled:opacity-30 transition-all flex items-center justify-center">
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-navy-500">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}
            className="w-9 h-9 rounded-xl text-navy-600 hover:bg-navy-50 disabled:opacity-30 transition-all flex items-center justify-center">
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}

/* ─── Users Tab ─── */
const USER_PAGE_SIZE = 10
function UsersTab() {
  const [users, setUsers]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [working, setWorking]     = useState(null)
  const [page, setPage]           = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal]         = useState(0)

  const load = useCallback((q = '', p = 1) => {
    setLoading(true)
    getAdminUsers({ search: q || undefined, page: p, limit: USER_PAGE_SIZE })
      .then(res => {
        setUsers(res?.data ?? [])
        const pg = res?.pagination
        setTotalPages(pg ? Math.max(1, Math.ceil(pg.total / USER_PAGE_SIZE)) : 1)
        setTotal(pg?.total ?? 0)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load(search, page) }, [load, page]) // eslint-disable-line

  useEffect(() => {
    const t = setTimeout(() => { setPage(1); load(search, 1) }, 350)
    return () => clearTimeout(t)
  }, [search]) // eslint-disable-line

  const handleSuspend = async (id, isActive) => {
    setWorking(id)
    try {
      if (isActive) { await suspendUser(id, { reason: 'Suspended by admin' }) } else { await unsuspendUser(id) }
      setUsers(prev => prev.map(u => u.id === id ? { ...u, is_active: !isActive } : u))
    } catch (e) { alert(e?.message || 'Action failed') }
    finally { setWorking(null) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Permanently delete this user? They will be removed from the platform and cannot log in.')) return
    setWorking(id)
    try {
      await deleteUser(id)
      const newTotal = total - 1
      const newMaxPage = Math.max(1, Math.ceil(newTotal / USER_PAGE_SIZE))
      const nextPage = page > newMaxPage ? newMaxPage : page
      setPage(nextPage)
      load(search, nextPage)
    } catch (e) { alert(e?.message || 'Delete failed') }
    finally { setWorking(null) }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-navy-900">
          User Management <span className="text-sm font-normal text-navy-400">({total})</span>
        </h2>
        <div className="relative w-64">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-400" />
          <input type="text" placeholder="Search by name or email…" value={search} onChange={e => setSearch(e.target.value)}
            className="w-full h-10 rounded-xl border border-navy-200 bg-white pl-10 pr-4 text-sm placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 transition-all" />
        </div>
      </div>

      {loading ? <Spinner /> : (
        <div className="bg-white rounded-2xl border border-navy-100/50 overflow-hidden">
          {users.length === 0 ? (
            <div className="py-12 text-center text-sm text-navy-400">No users found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-navy-100/50">
                    <th className="text-left text-xs font-semibold text-navy-400 uppercase tracking-wider px-6 py-4">User</th>
                    <th className="text-left text-xs font-semibold text-navy-400 uppercase tracking-wider px-6 py-4">Role</th>
                    <th className="text-left text-xs font-semibold text-navy-400 uppercase tracking-wider px-6 py-4">Status</th>
                    <th className="text-left text-xs font-semibold text-navy-400 uppercase tracking-wider px-6 py-4">Joined</th>
                    <th className="text-right text-xs font-semibold text-navy-400 uppercase tracking-wider px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="border-b border-navy-50 last:border-0 hover:bg-navy-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-navy-400 to-navy-600 flex items-center justify-center shrink-0">
                            <span className="text-white text-xs font-semibold">{u.email?.[0]?.toUpperCase() ?? '?'}</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-navy-900 truncate max-w-[180px]">{u.email}</p>
                            {!u.email_verified && <p className="text-[10px] text-amber-500">Email unverified</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={u.role === 'system_admin' ? 'danger' : u.role === 'company_admin' ? 'info' : 'default'}>
                          {u.role?.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={u.is_active ? 'success' : 'danger'}>{u.is_active ? 'Active' : 'Suspended'}</Badge>
                      </td>
                      <td className="px-6 py-4 text-xs text-navy-400">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {working === u.id
                            ? <Loader2 size={14} className="animate-spin text-navy-400" />
                            : (
                              <>
                                <button onClick={() => handleSuspend(u.id, u.is_active)} title={u.is_active ? 'Suspend' : 'Unsuspend'}
                                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                                    u.is_active ? 'text-navy-400 hover:bg-amber-50 hover:text-amber-600' : 'text-navy-400 hover:bg-emerald-50 hover:text-emerald-600'
                                  }`}>
                                  {u.is_active ? <Ban size={14} /> : <CheckCircle2 size={14} />}
                                </button>
                                <button onClick={() => handleDelete(u.id)}
                                  className="w-8 h-8 rounded-lg flex items-center justify-center text-navy-400 hover:bg-red-50 hover:text-red-600 transition-colors">
                                  <Trash2 size={14} />
                                </button>
                              </>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button onClick={() => setPage(p => p - 1)} disabled={page <= 1}
            className="w-9 h-9 rounded-xl text-navy-600 hover:bg-navy-50 disabled:opacity-30 transition-all flex items-center justify-center">
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-navy-500">Page {page} of {totalPages} · {total} users</span>
          <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}
            className="w-9 h-9 rounded-xl text-navy-600 hover:bg-navy-50 disabled:opacity-30 transition-all flex items-center justify-center">
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}

/* ─── Audit Tab ─── */
function AuditTab() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAuditLogs({ limit: 30 })
      .then(res => setEntries(res?.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-navy-900 mb-2">Audit Log</h2>

      {loading ? <Spinner /> : entries.length === 0 ? (
        <div className="bg-white rounded-2xl border border-navy-100/50 py-12 text-center text-sm text-navy-400">
          No audit entries yet.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-navy-100/50 overflow-hidden">
          {entries.map((entry, i) => (
            <div
              key={entry.id ?? i}
              className={`flex items-start gap-4 px-6 py-4 ${
                i < entries.length - 1 ? 'border-b border-navy-50' : ''
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-navy-50 flex items-center justify-center shrink-0 mt-0.5">
                <Shield size={14} className="text-navy-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-navy-800 font-medium capitalize">
                  {entry.action?.replace(/_/g, ' ') ?? '—'}
                </p>
                <p className="text-xs text-navy-400 mt-0.5">
                  by {entry.admin?.email ?? 'Admin'}
                  {entry.entity_type ? ` · ${entry.entity_type}` : ''}
                  {entry.details?.reason ? ` · ${entry.details.reason}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-navy-400 shrink-0">
                <Clock size={12} />
                {timeAgo(entry.created_at)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
