import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Star,
  Users,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Clock,
  BarChart3,
  FileText,
  Settings,
  Building2,
  Search,
  ChevronDown,
  Loader2,
  AlertCircle,
  Award,
  Trophy,
  Calendar,
  Briefcase,
  UserPlus,
  Download,
  Mail,
  Ban,
  Trash2,
  Plus,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts'
import PageHeader from '../components/ui/PageHeader.jsx'
import Badge from '../components/ui/Badge.jsx'
import Reveal from '../components/ui/Reveal.jsx'
import StarRating from '../components/ui/StarRating.jsx'
import Button from '../components/ui/Button.jsx'
import Input from '../components/ui/Input.jsx'
import CertificateModal from '../components/ui/CertificateModal.jsx'
import { useAuth } from '../context/AuthContext'
import { getCompanyStats, getCompanyAnalytics, getCompanyReviews, getCompanyById, updateCompany } from '../api/companies'
import { getPendingEmployments, approveEmployment, rejectEmployment, getAllEmploymentsForAdmin, inviteEmployee, getPendingInvites, cancelInvite, endEmploymentByAdmin } from '../api/employments'
import { getFeedbackReceived } from '../api/feedback'
import { createEotmEvent, closeEotmEvent, getCompanyEotmEvents, getEotmNominees, getCompanyEotmWinners, getEotmCertificate } from '../api/eotm'
import { createEotyEvent, closeEotyEvent, getEotyEvents, getEotyNominees, getEotyCertificate } from '../api/eoty'
import { createPosition, deletePosition, getCompanyPositions, getApplicationsForPosition, updateApplicationStatus } from '../api/jobs'

const VALID_CA_TABS = ['overview', 'requests', 'reviews', 'eotm', 'eoty', 'jobs', 'feedback', 'settings']

export default function CompanyAdminDashboard() {
  const [activeTab, setActiveTab] = useState(() => {
    const hash = window.location.hash.replace('#', '')
    return VALID_CA_TABS.includes(hash) ? hash : 'overview'
  })
  const [pendingCount, setPendingCount] = useState(0)
  const [reviewCount, setReviewCount] = useState(0)
  const [activeEotmCount, setActiveEotmCount] = useState(0)
  const [feedbackCount, setFeedbackCount] = useState(0)
  const [companyName, setCompanyName] = useState('')
  const { user } = useAuth()
  const companyId = user?.companyId

  useEffect(() => {
    if (!companyId) return
    getCompanyById(companyId)
      .then(res => {
        const name = res?.data?.company?.name ?? res?.data?.name
        if (name) setCompanyName(name)
      })
      .catch(() => {})
    getPendingEmployments()
      .then(res => {
        const list = res?.data?.employments ?? res?.data ?? []
        setPendingCount(Array.isArray(list) ? list.length : 0)
      })
      .catch(() => {})
    getCompanyReviews(companyId)
      .then(res => {
        const list = res?.data ?? []
        setReviewCount(Array.isArray(list) ? list.length : 0)
      })
      .catch(() => {})
    getCompanyEotmEvents(companyId)
      .then(res => {
        const events = res?.data ?? []
        const active = Array.isArray(events) ? events.filter(e => e.status === 'open' || e.status === 'active').length : 0
        setActiveEotmCount(active)
      })
      .catch(() => {})
    getFeedbackReceived()
      .then(res => {
        const list = res?.data?.feedback ?? res?.data ?? []
        setFeedbackCount(Array.isArray(list) ? list.length : 0)
      })
      .catch(() => {})
  }, [companyId])

  const tabs = [
    { id: 'overview', label: 'Analytics',    icon: BarChart3 },
    { id: 'requests', label: 'Team',         icon: Users,      badge: pendingCount || null },
    { id: 'reviews',  label: 'Reviews',      icon: FileText,   badge: reviewCount || null },
    { id: 'eotm',     label: 'EOTM',         icon: Award,      badge: activeEotmCount || null },
    { id: 'eoty',     label: 'EOTY',         icon: Trophy },
    { id: 'jobs',     label: 'Jobs',         icon: Briefcase },
    { id: 'feedback', label: 'Team Feedback',icon: MessageSquare, badge: feedbackCount || null },
    { id: 'settings', label: 'Settings',     icon: Settings },
  ]

  if (!companyId) return (
    <div className="min-h-screen bg-ice-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-lg font-semibold text-navy-700 mb-2">No company linked to your account.</p>
        <p className="text-sm text-navy-400">Please contact an administrator to link your account to a company.</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-ice-50">
      <PageHeader
        tag="Company Admin"
        title={companyName ? `${companyName} Dashboard` : 'Company Dashboard'}
        subtitle="Manage your company profile, verify employees, and view analytics."
        backHref
      />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 pb-20">
        {/* Tabs */}
        <div className="flex items-center gap-1 mb-8 border-b border-navy-100/50 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); window.history.replaceState(null, '', `#${tab.id}`) }}
              className={`relative flex items-center gap-2 px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id ? 'text-navy-900' : 'text-navy-400 hover:text-navy-600'
              }`}
            >
              <tab.icon size={15} />
              {tab.label}
              {tab.badge ? (
                <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {tab.badge}
                </span>
              ) : null}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="companyTab"
                  className="absolute bottom-0 left-2 right-2 h-[2px] bg-navy-500 rounded-full"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>

        {activeTab === 'overview'  && <AnalyticsTab companyId={companyId} />}
        {activeTab === 'requests'  && <RequestsTab companyId={companyId} onCountChange={setPendingCount} />}
        {activeTab === 'reviews'   && <ReviewsListTab companyId={companyId} />}
        {activeTab === 'eotm'      && <EotmTab companyId={companyId} />}
        {activeTab === 'eoty'      && <EotyAdminTab companyId={companyId} />}
        {activeTab === 'jobs'      && <JobsTab companyId={companyId} />}
        {activeTab === 'feedback'  && <TeamFeedbackTab />}
        {activeTab === 'settings'  && <SettingsTab companyId={companyId} onNameChange={setCompanyName} />}
      </div>
    </div>
  )
}

/* ─── Analytics Tab ─── */
function AnalyticsTab({ companyId }) {
  const [stats, setStats] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!companyId) return
    Promise.all([
      getCompanyStats(companyId),
      getCompanyAnalytics(companyId),
    ])
      .then(([statsRes, analyticsRes]) => {
        const raw = statsRes?.data?.stats ?? statsRes?.data ?? null
        // Handle both camelCase and snake_case from RPC, and array responses
        const s = Array.isArray(raw) ? raw[0] : raw
        setStats(s ? {
          totalReviews:     s.totalReviews     ?? s.total_reviews      ?? s.review_count   ?? null,
          avgRating:        s.avgRating        ?? s.avg_rating         ?? s.average_rating  ?? null,
          totalEmployees:   s.totalEmployees   ?? s.total_employees    ?? s.employee_count  ?? null,
          avgFeedbackScore: s.avgFeedbackScore ?? s.avg_feedback_score ?? null,
        } : null)
        setAnalytics(analyticsRes?.data?.analytics ?? analyticsRes?.data ?? null)
      })
      .finally(() => setLoading(false))
  }, [companyId])

  const statCards = [
    { label: 'Total Reviews',     value: stats?.totalReviews ?? '–',                                          icon: FileText,     color: 'text-navy-500'   },
    { label: 'Average Rating',    value: stats?.avgRating    != null ? Number(stats.avgRating).toFixed(1)    : '–', icon: Star,    color: 'text-amber-500'  },
    { label: 'Verified Employees',value: stats?.totalEmployees ?? '–',                                        icon: Users,        color: 'text-emerald-500' },
    { label: 'Avg Feedback Score',value: stats?.avgFeedbackScore != null ? Number(stats.avgFeedbackScore).toFixed(1) : '–', icon: MessageSquare, color: 'text-violet-500' },
  ]

  const monthlyRaw  = analytics?.monthlyReviews ?? analytics?.monthly ?? analytics?.reviewsOverTime ?? analytics?.reviews_over_time ?? {}
  const monthlyData = Array.isArray(monthlyRaw)
    ? monthlyRaw
    : Object.entries(monthlyRaw).map(([month, count]) => ({ month, count }))
  const ratingDist   = analytics?.ratingDistribution ?? analytics?.rating_distribution
    ? Object.entries(analytics.ratingDistribution)
        .map(([k, v]) => ({ stars: `${k}★`, count: v }))
        .sort((a, b) => b.stars.localeCompare(a.stars))
    : []

  if (loading) return <div className="py-20 text-center text-navy-400 text-sm">Loading analytics…</div>

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <Reveal key={stat.label} delay={i * 0.08}>
            <div className="bg-white rounded-2xl border border-navy-100/50 p-5">
              <div className="flex items-center justify-between mb-3">
                <stat.icon size={18} className={stat.color} strokeWidth={1.8} />
              </div>
              <p className="text-2xl font-serif font-bold text-navy-900">{stat.value}</p>
              <p className="text-xs text-navy-400 mt-1">{stat.label}</p>
            </div>
          </Reveal>
        ))}
      </div>

      {/* Charts */}
      {(monthlyData.length > 0 || ratingDist.length > 0) && (
        <div className="grid lg:grid-cols-2 gap-6">
          {monthlyData.length > 0 && (
            <Reveal delay={0.1}>
              <div className="bg-white rounded-2xl border border-navy-100/50 p-6">
                <h3 className="text-sm font-semibold text-navy-900 mb-1">Reviews Over Time</h3>
                <p className="text-xs text-navy-400 mb-6">Monthly review count</p>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyData}>
                      <defs>
                        <linearGradient id="reviewGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#4988C4" stopOpacity={0.15} />
                          <stop offset="100%" stopColor="#4988C4" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e8f2fa" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#0F2854', border: 'none', borderRadius: '12px', fontSize: '12px', color: '#fff', padding: '8px 14px' }} />
                      <Area type="monotone" dataKey="count" stroke="#4988C4" strokeWidth={2} fill="url(#reviewGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </Reveal>
          )}
          {ratingDist.length > 0 && (
            <Reveal delay={0.15}>
              <div className="bg-white rounded-2xl border border-navy-100/50 p-6">
                <h3 className="text-sm font-semibold text-navy-900 mb-1">Rating Distribution</h3>
                <p className="text-xs text-navy-400 mb-6">Breakdown by star rating</p>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ratingDist} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e8f2fa" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                      <YAxis dataKey="stars" type="category" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} width={30} />
                      <Tooltip contentStyle={{ backgroundColor: '#0F2854', border: 'none', borderRadius: '12px', fontSize: '12px', color: '#fff', padding: '8px 14px' }} />
                      <Bar dataKey="count" fill="#4988C4" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </Reveal>
          )}
        </div>
      )}
    </div>
  )
}

/* ─── Requests Tab ─── */
const REQ_STATUS = {
  pending:  { badge: 'bg-amber-50 text-amber-700 border-amber-200',   icon: Clock,         label: 'Pending'  },
  approved: { badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2, label: 'Approved' },
  rejected: { badge: 'bg-red-50 text-red-700 border-red-200',          icon: XCircle,       label: 'Rejected' },
}

function RequestsTab({ companyId, onCountChange }) {
  const [allRequests, setAllRequests]       = useState([])
  const [pendingInvites, setPendingInvites] = useState([])
  const [loading, setLoading]               = useState(true)
  const [search, setSearch]                 = useState('')
  const [expandedId, setExpandedId]         = useState(null)
  const [processing, setProcessing]         = useState({})
  const [rejectNote, setRejectNote]         = useState({})
  const [actionResult, setActionResult]     = useState({})
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [inviteForm, setInviteForm]         = useState({ email: '', position: '', department: '', startDate: '' })
  const [inviting, setInviting]             = useState(false)
  const [inviteError, setInviteError]       = useState('')
  const [inviteSuccess, setInviteSuccess]   = useState('')
  const [cancellingId, setCancellingId]     = useState(null)
  const [endingId, setEndingId]             = useState(null)
  const [endingReason, setEndingReason]     = useState('')
  const [endingSubmitting, setEndingSubmitting] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [reqRes, invRes] = await Promise.all([
        getAllEmploymentsForAdmin(),
        getPendingInvites().catch(() => ({ data: [] })),
      ])
      const list = Array.isArray(reqRes?.data) ? reqRes.data : []
      setAllRequests(list)
      setPendingInvites(Array.isArray(invRes?.data) ? invRes.data : [])
      onCountChange?.(list.filter(r => r.verification_status === 'pending').length)
    } catch {
      setAllRequests([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleInvite = async () => {
    if (!inviteForm.email.trim())    { setInviteError('Email is required'); return }
    if (!inviteForm.position.trim()) { setInviteError('Position is required'); return }
    setInviting(true); setInviteError(''); setInviteSuccess('')
    try {
      await inviteEmployee(inviteForm)
      setInviteSuccess(`Invitation sent to ${inviteForm.email}`)
      setInviteForm({ email: '', position: '', department: '', startDate: '' })
      setShowInviteForm(false)
      await load()
    } catch (e) { setInviteError(e?.message || 'Failed to send invitation') }
    finally { setInviting(false) }
  }

  const handleCancelInvite = async (id) => {
    setCancellingId(id)
    try { await cancelInvite(id); await load() }
    catch {} finally { setCancellingId(null) }
  }

  const handleEndByAdmin = async (id) => {
    setEndingSubmitting(true)
    try {
      await endEmploymentByAdmin(id, { reason: endingReason })
      setEndingId(null); setEndingReason('')
      await load()
    } catch {} finally { setEndingSubmitting(false) }
  }

  const handle = async (id, action) => {
    setProcessing(p => ({ ...p, [id]: true }))
    try {
      if (action === 'approve') {
        await approveEmployment(id)
      } else {
        await rejectEmployment(id, { rejectionNote: rejectNote[id] ?? '' })
      }
      setActionResult(r => ({ ...r, [id]: action }))
      // update in-place so it's instant
      setAllRequests(prev => prev.map(r =>
        r.id === id
          ? { ...r, verification_status: action === 'approve' ? 'approved' : 'rejected', rejection_note: rejectNote[id] ?? '' }
          : r
      ))
      onCountChange?.(allRequests.filter(r =>
        r.id !== id && r.verification_status === 'pending'
      ).length)
      setExpandedId(null)
    } catch { /* silent */ } finally {
      setProcessing(p => ({ ...p, [id]: false }))
    }
  }

  const filtered = allRequests.filter(r => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    const name = (r.employees?.full_name ?? '').toLowerCase()
    const pos  = (r.position ?? '').toLowerCase()
    const dept = (r.department ?? '').toLowerCase()
    return name.includes(q) || pos.includes(q) || dept.includes(q)
  })

  const pending  = filtered.filter(r => r.verification_status === 'pending')
  const resolved = filtered.filter(r => r.verification_status !== 'pending')
  const groups   = [
    { label: 'Pending', items: pending },
    { label: 'Resolved', items: resolved },
  ]

  if (loading) return <div className="py-20 text-center text-navy-400 text-sm"><Loader2 size={20} className="animate-spin mx-auto" /></div>

  return (
    <div className="space-y-5">
      {/* Invite employee section */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-navy-900">Team Management</h2>
        <button
          onClick={() => { setShowInviteForm(!showInviteForm); setInviteError(''); setInviteSuccess('') }}
          className="h-10 px-5 bg-navy-900 text-white text-sm font-medium rounded-xl inline-flex items-center gap-2 hover:bg-navy-800 transition-all"
        >
          <UserPlus size={15} />
          Invite Employee
        </button>
      </div>

      {inviteSuccess && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl px-4 py-3">
          <CheckCircle2 size={15} />{inviteSuccess}
        </div>
      )}

      {showInviteForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-navy-200 p-6">
          <h3 className="text-sm font-semibold text-navy-900 mb-4">Invite Employee by Email</h3>
          {inviteError && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2 mb-4">{inviteError}</p>}
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs font-medium text-navy-600 block mb-1">Email *</label>
              <input type="email" placeholder="employee@company.com" value={inviteForm.email}
                onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))}
                className="w-full h-10 rounded-xl border border-navy-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-navy-600 block mb-1">Position *</label>
              <input type="text" placeholder="e.g. Software Engineer" value={inviteForm.position}
                onChange={e => setInviteForm(f => ({ ...f, position: e.target.value }))}
                className="w-full h-10 rounded-xl border border-navy-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-navy-600 block mb-1">Department</label>
              <input type="text" placeholder="e.g. Engineering" value={inviteForm.department}
                onChange={e => setInviteForm(f => ({ ...f, department: e.target.value }))}
                className="w-full h-10 rounded-xl border border-navy-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-navy-600 block mb-1">Start Date</label>
              <input type="date" value={inviteForm.startDate}
                onChange={e => setInviteForm(f => ({ ...f, startDate: e.target.value }))}
                className="w-full h-10 rounded-xl border border-navy-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 transition-all"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleInvite} disabled={inviting}
              className="h-9 px-5 bg-navy-900 text-white text-xs font-semibold rounded-xl hover:bg-navy-800 transition-colors flex items-center gap-1.5 disabled:opacity-50">
              {inviting ? <Loader2 size={13} className="animate-spin" /> : <Mail size={13} />}
              {inviting ? 'Sending…' : 'Send Invitation'}
            </button>
            <button onClick={() => setShowInviteForm(false)} className="h-9 px-4 text-xs font-medium text-navy-500 border border-navy-200 rounded-xl hover:bg-navy-50 transition-colors">Cancel</button>
          </div>
        </motion.div>
      )}

      {/* Pending invites */}
      {pendingInvites.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-navy-400">Pending Invitations ({pendingInvites.length})</h3>
          {pendingInvites.map((inv, i) => (
            <div key={inv.id ?? i} className="bg-white rounded-2xl border border-amber-100 p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Mail size={15} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-navy-900">{inv.email ?? inv.employees?.user?.email ?? 'Invited'}</p>
                  <p className="text-xs text-navy-400">{inv.position ?? '—'}{inv.department ? ` · ${inv.department}` : ''}</p>
                </div>
              </div>
              <button onClick={() => handleCancelInvite(inv.id)} disabled={cancellingId === inv.id}
                className="h-8 px-3 text-xs font-medium text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1.5 disabled:opacity-50">
                {cancellingId === inv.id ? <Loader2 size={12} className="animate-spin" /> : <Ban size={12} />}
                Cancel
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Header + search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <h2 className="text-lg font-semibold text-navy-900">
          Employment Records
          <span className="ml-2 text-sm font-normal text-navy-400">({allRequests.length})</span>
        </h2>
        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, position, department…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-10 rounded-xl border border-navy-200 bg-white pl-8 pr-4 text-sm placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 transition-all"
          />
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="bg-white rounded-2xl border border-navy-100/50 p-12 text-center">
          <Search size={28} className="text-navy-200 mx-auto mb-3" />
          <p className="text-sm text-navy-400">{search ? `No requests match "${search}"` : 'No employment requests yet.'}</p>
        </div>
      )}

      {groups.map(({ label, items }) => items.length === 0 ? null : (
        <div key={label} className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-navy-400">{label} ({items.length})</h3>
          {items.map((req, i) => {
            const name     = req.employees?.full_name ?? 'Unknown'
            const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
            const status   = req.verification_status ?? 'pending'
            const cfg      = REQ_STATUS[status] ?? REQ_STATUS.pending
            const Icon     = cfg.icon
            const isOpen   = expandedId === req.id
            const isProcessing = !!processing[req.id]

            return (
              <Reveal key={req.id} delay={i * 0.05}>
                <div className={`bg-white rounded-2xl border transition-all ${
                  isOpen ? 'border-navy-300 shadow-md shadow-navy-900/5' : 'border-navy-100/50 hover:border-navy-200'
                }`}>
                  {/* Row — always visible */}
                  <button
                    type="button"
                    onClick={() => setExpandedId(isOpen ? null : req.id)}
                    className="w-full text-left px-6 py-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-navy-400 to-navy-700 flex items-center justify-center shrink-0">
                        <span className="text-white text-sm font-semibold">{initials}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-navy-900 truncate">{name}</p>
                        <p className="text-xs text-navy-400 mt-0.5">
                          {req.position ?? '–'}{req.department ? ` · ${req.department}` : ''}
                        </p>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${cfg.badge}`}>
                        <Icon size={11} />{cfg.label}
                      </span>
                      <ChevronDown
                        size={16}
                        className={`text-navy-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`}
                      />
                    </div>
                  </button>

                  {/* Expanded panel */}
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-5 border-t border-navy-100 pt-4 space-y-4">
                          {/* Details grid */}
                          <div className="grid sm:grid-cols-3 gap-3 text-sm">
                            <div>
                              <p className="text-xs text-navy-400 mb-0.5">Start Date</p>
                              <p className="font-medium text-navy-800">
                                {req.start_date ? new Date(req.start_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '–'}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-navy-400 mb-0.5">End Date</p>
                              <p className="font-medium text-navy-800">
                                {req.end_date ? new Date(req.end_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Present'}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-navy-400 mb-0.5">Submitted</p>
                              <p className="font-medium text-navy-800">
                                {req.created_at ? new Date(req.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '–'}
                              </p>
                            </div>
                          </div>

                          {/* Rejection note (already rejected) */}
                          {status === 'rejected' && req.rejection_note && (
                            <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                              <AlertCircle size={14} className="text-red-400 mt-0.5 shrink-0" />
                              <p className="text-xs text-red-700"><span className="font-semibold">Rejection reason:</span> {req.rejection_note}</p>
                            </div>
                          )}

                          {/* Action area — only for pending */}
                          {status === 'pending' && (
                            <div className="space-y-3">
                              <div>
                                <label className="text-xs font-medium text-navy-600 block mb-1">Rejection note <span className="text-navy-400">(optional, shown to employee)</span></label>
                                <input
                                  type="text"
                                  placeholder="e.g. Could not verify employment details…"
                                  value={rejectNote[req.id] ?? ''}
                                  onChange={e => setRejectNote(n => ({ ...n, [req.id]: e.target.value }))}
                                  className="w-full h-9 rounded-xl border border-navy-200 bg-white px-3 text-sm placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 transition-all"
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handle(req.id, 'approve')}
                                  disabled={isProcessing}
                                  className="h-9 px-5 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                                >
                                  {isProcessing ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                                  Approve
                                </button>
                                <button
                                  onClick={() => handle(req.id, 'reject')}
                                  disabled={isProcessing}
                                  className="h-9 px-5 border border-red-200 text-red-600 text-xs font-semibold rounded-xl hover:bg-red-50 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                                >
                                  {isProcessing ? <Loader2 size={13} className="animate-spin" /> : <XCircle size={13} />}
                                  Reject
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Already resolved label */}
                          {status === 'approved' && (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 text-emerald-700 text-xs font-medium">
                                <CheckCircle2 size={14} />
                                This request has been approved.
                              </div>
                              {endingId === req.id ? (
                                <div className="space-y-2">
                                  <input type="text" placeholder="Reason for ending employment (optional)"
                                    value={endingReason} onChange={e => setEndingReason(e.target.value)}
                                    className="w-full h-9 rounded-xl border border-navy-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 transition-all"
                                  />
                                  <div className="flex gap-2">
                                    <button onClick={() => handleEndByAdmin(req.id)} disabled={endingSubmitting}
                                      className="h-8 px-4 bg-red-600 text-white text-xs font-semibold rounded-xl hover:bg-red-700 transition-colors flex items-center gap-1.5 disabled:opacity-50">
                                      {endingSubmitting ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
                                      Confirm End
                                    </button>
                                    <button onClick={() => { setEndingId(null); setEndingReason('') }}
                                      className="h-8 px-3 text-xs font-medium text-navy-500 border border-navy-200 rounded-xl hover:bg-navy-50 transition-colors">Cancel</button>
                                  </div>
                                </div>
                              ) : (
                                <button onClick={() => setEndingId(req.id)}
                                  className="h-8 px-4 text-xs font-medium text-red-500 border border-red-200 rounded-xl hover:bg-red-50 transition-colors flex items-center gap-1.5">
                                  <Ban size={12} /> End Employment
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Reveal>
            )
          })}
        </div>
      ))}
    </div>
  )
}

/* ─── Reviews List Tab ─── */
function ReviewsListTab({ companyId }) {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!companyId) return
    getCompanyReviews(companyId)
      .then(res => setReviews(res?.data ?? []))
      .catch(() => setReviews([]))
      .finally(() => setLoading(false))
  }, [companyId])

  if (loading) return <div className="py-20 text-center text-navy-400 text-sm">Loading reviews…</div>

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-navy-900 mb-2">
        Reviews <span className="text-sm font-normal text-navy-400">({reviews.length})</span>
      </h2>
      {!reviews.length && (
        <div className="bg-white rounded-2xl border border-navy-100/50 p-12 text-center">
          <p className="text-sm text-navy-500">No reviews yet.</p>
        </div>
      )}
      {reviews.map((review, i) => {
        const authorName = (review.is_anonymous ?? review.isAnonymous)
          ? 'Anonymous Verified Employee'
          : (review.reviewer_name ?? review.employee?.user?.fullName ?? review.employee?.fullName ?? 'Employee')
        const reviewContent = review.content ?? review.review_text ?? review.reviewText ?? ''
        const reviewDate    = review.created_at ?? review.createdAt
        return (
          <Reveal key={review.id} delay={i * 0.05}>
            <div className="bg-white rounded-2xl border border-navy-100/50 p-5 hover:border-navy-200 transition-all">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <p className="text-sm font-semibold text-navy-900">{authorName}</p>
                  <p className="text-xs text-navy-400 mt-0.5">
                    {reviewDate ? new Date(reviewDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : ''}
                  </p>
                </div>
                <StarRating rating={review.overall_rating} size={14} />
              </div>
              <p className="text-sm text-navy-600 leading-relaxed">{reviewContent}</p>
            </div>
          </Reveal>
        )
      })}
    </div>
  )
}

/* ─── Team Feedback Tab ─── */
function TeamFeedbackTab() {
  const [feedback, setFeedback] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getFeedbackReceived()
      .then(res => setFeedback(res?.data?.feedback ?? res?.data ?? []))
      .catch(() => setFeedback([]))
      .finally(() => setLoading(false))
  }, [])

  /* Aggregate category scores across all feedback entries */
  const aggregate = feedback.reduce((acc, fb) => {
    const cats = ['professionalism', 'communication', 'teamwork', 'reliability']
    cats.forEach(cat => {
      if (fb.scores?.[cat] != null) {
        if (!acc[cat]) acc[cat] = { sum: 0, count: 0 }
        acc[cat].sum += fb.scores[cat]
        acc[cat].count += 1
      }
    })
    return acc
  }, {})

  const summary = Object.entries(aggregate).map(([cat, { sum, count }]) => ({
    category: cat.charAt(0).toUpperCase() + cat.slice(1),
    avg: sum / count,
    count,
  }))

  if (loading) return <div className="py-20 text-center text-navy-400 text-sm">Loading feedback…</div>

  if (!feedback.length) return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-navy-900">Team Feedback Overview</h2>
      <div className="bg-white rounded-2xl border border-navy-100/50 p-12 text-center">
        <p className="text-sm text-navy-500">No feedback data yet.</p>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-navy-900">Team Feedback Overview</h2>

      <Reveal>
        <div className="bg-white rounded-2xl border border-navy-100/50 p-6">
          <h3 className="text-sm font-semibold text-navy-900 mb-6">Company-Wide Feedback Averages</h3>
          <div className="grid sm:grid-cols-4 gap-6">
            {summary.map((item, i) => (
              <div key={item.category} className="text-center">
                <div className="relative inline-flex items-center justify-center w-20 h-20 mb-3">
                  <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="34" fill="none" stroke="#e8f2fa" strokeWidth="6" />
                    <motion.circle
                      cx="40" cy="40" r="34" fill="none" stroke="#4988C4" strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 34}`}
                      initial={{ strokeDashoffset: 2 * Math.PI * 34 }}
                      whileInView={{ strokeDashoffset: 2 * Math.PI * 34 * (1 - item.avg / 5) }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: i * 0.15 }}
                    />
                  </svg>
                  <span className="absolute text-lg font-serif font-bold text-navy-900">
                    {item.avg.toFixed(1)}
                  </span>
                </div>
                <p className="text-sm font-medium text-navy-900">{item.category}</p>
                <p className="text-xs text-navy-400 mt-0.5">{item.count} responses</p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.1}>
        <div className="bg-navy-900 rounded-2xl p-6 text-white">
          <div className="flex items-start gap-4">
            <MessageSquare size={20} className="text-navy-400 mt-0.5" />
            <div>
              <h3 className="font-semibold mb-1">About Internal Feedback</h3>
              <p className="text-sm text-navy-300 leading-relaxed">
                You can view internal feedback exchanged between employees at your company.
                This helps identify team strengths and areas for improvement.
                You <strong className="text-white">cannot</strong> see the identity of anonymous reviewers.
              </p>
            </div>
          </div>
        </div>
      </Reveal>
    </div>
  )
}

/* ─── EOTM Tab ─── */
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

function EotmTab({ companyId }) {
  const [events, setEvents]     = useState([])
  const [winners, setWinners]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [creating, setCreating] = useState(false)
  const [closing, setClosing]   = useState(null)
  const [createError, setCreateError] = useState('')
  const [closeError, setCloseError]   = useState('')
  const [newMonth, setNewMonth] = useState(new Date().getMonth() + 1)
  const [newYear, setNewYear]   = useState(new Date().getFullYear())
  const [nominees, setNominees] = useState({}) // { eventId: [...] }
  const [expanded, setExpanded] = useState(null)
  const [certData, setCertData] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [evRes, winRes] = await Promise.all([
        getCompanyEotmEvents(companyId),
        getCompanyEotmWinners(companyId),
      ])
      setEvents(evRes?.data?.events ?? evRes?.data ?? [])
      setWinners(winRes?.data?.winners ?? winRes?.data ?? [])
    } catch {}
    finally { setLoading(false) }
  }, [companyId])

  useEffect(() => { if (companyId) load() }, [companyId, load])

  const handleCreate = async () => {
    setCreating(true)
    setCreateError('')
    try {
      await createEotmEvent({ companyId, month: newMonth, year: newYear })
      await load()
    } catch (e) { setCreateError(e?.message || 'Failed to create event') }
    finally { setCreating(false) }
  }

  const handleClose = async (eventId) => {
    setClosing(eventId)
    setCloseError('')
    try {
      await closeEotmEvent(eventId)
      await load()
    } catch (e) { setCloseError(e?.message || 'Failed to close event') }
    finally { setClosing(null) }
  }

  const toggleNominees = async (eventId) => {
    if (expanded === eventId) { setExpanded(null); return }
    setExpanded(eventId)
    if (!nominees[eventId]) {
      try {
        const res = await getEotmNominees(eventId)
        setNominees(prev => ({ ...prev, [eventId]: res?.data?.nominees ?? res?.data ?? [] }))
      } catch { setNominees(prev => ({ ...prev, [eventId]: [] })) }
    }
  }

  if (loading) return <div className="py-20 text-center text-navy-400 text-sm"><Loader2 size={20} className="animate-spin mx-auto" /></div>

  return (
    <div className="space-y-6">
      {certData && <CertificateModal {...certData} onClose={() => setCertData(null)} />}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-navy-900">Employee of the Month</h2>
      </div>

      {/* Create new event */}
      <Reveal>
        <div className="bg-white rounded-2xl border border-navy-100/50 p-6">
          <h3 className="text-sm font-semibold text-navy-900 mb-4 flex items-center gap-2">
            <Award size={16} className="text-amber-500" />
            Create New EOTM Event
          </h3>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="text-xs font-medium text-navy-600 block mb-1">Month</label>
              <select
                value={newMonth}
                onChange={e => setNewMonth(Number(e.target.value))}
                className="h-10 rounded-xl border border-navy-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500"
              >
                {MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-navy-600 block mb-1">Year</label>
              <input
                type="number"
                value={newYear}
                onChange={e => setNewYear(Number(e.target.value))}
                min={2024}
                max={2030}
                className="h-10 w-24 rounded-xl border border-navy-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500"
              />
            </div>
            <button
              onClick={handleCreate}
              disabled={creating}
              className="h-10 px-5 bg-navy-900 text-white text-xs font-semibold rounded-xl hover:bg-navy-800 transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {creating ? <Loader2 size={13} className="animate-spin" /> : <Award size={13} />}
              {creating ? 'Creating…' : 'Create Event'}
            </button>
          </div>
          {createError && (
            <p className="mt-3 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{createError}</p>
          )}
        </div>
      </Reveal>

      {/* Active events */}
      {closeError && (
        <p className="text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{closeError}</p>
      )}
      {events.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-navy-400">Events</h3>
          {events.map((ev, i) => (
            <Reveal key={ev.id} delay={i * 0.05}>
              <div className="bg-white rounded-2xl border border-navy-100/50 p-5 hover:border-navy-200 transition-all">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${ev.status === 'open' ? 'bg-emerald-100' : 'bg-navy-100'}`}>
                      <Calendar size={16} className={ev.status === 'open' ? 'text-emerald-600' : 'text-navy-500'} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-navy-900">
                        {MONTHS[(ev.month ?? 1) - 1]} {ev.year}
                      </p>
                      <p className="text-xs text-navy-400">{ev.total_votes ?? 0} votes cast</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={ev.status === 'open' ? 'success' : 'default'}>{ev.status}</Badge>
                    <button
                      onClick={() => toggleNominees(ev.id)}
                      className="h-8 px-3 text-xs font-medium text-navy-500 border border-navy-200 rounded-lg hover:bg-navy-50 transition-colors"
                    >
                      {expanded === ev.id ? 'Hide' : 'View'} Nominees
                    </button>
                    {ev.status === 'open' && (
                      <button
                        onClick={() => handleClose(ev.id)}
                        disabled={closing === ev.id}
                        className="h-8 px-3 bg-amber-600 text-white text-xs font-medium rounded-lg hover:bg-amber-700 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {closing === ev.id ? <Loader2 size={12} className="animate-spin" /> : <Trophy size={12} />}
                        Close &amp; Declare Winner
                      </button>
                    )}
                  </div>
                </div>

                {/* Nominees list */}
                <AnimatePresence>
                  {expanded === ev.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 pt-4 border-t border-navy-100 space-y-2">
                        {(nominees[ev.id] ?? []).length === 0 ? (
                          <p className="text-xs text-navy-400 text-center py-3">No votes yet</p>
                        ) : (nominees[ev.id] ?? []).map((nom, j) => (
                          <div key={j} className="flex items-center justify-between bg-navy-50/50 rounded-xl px-4 py-2.5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-navy-400 to-navy-600 flex items-center justify-center">
                                <span className="text-white text-xs font-semibold">{(nom.full_name || '?')[0].toUpperCase()}</span>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-navy-900">{nom.full_name ?? 'Unknown'}</p>
                                <p className="text-xs text-navy-400">{nom.position ?? ''}</p>
                              </div>
                            </div>
                            <span className="text-sm font-bold text-navy-700">{nom.vote_count ?? 0} votes</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Winner display */}
                {ev.status === 'closed' && ev.winner_name && (
                  <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
                    <Trophy size={16} className="text-amber-600" />
                    <p className="text-sm text-amber-800 font-medium">
                      Winner: <strong>{ev.winner_name}</strong>
                    </p>
                  </div>
                )}
              </div>
            </Reveal>
          ))}
        </div>
      )}

      {/* Past winners */}
      {winners.length > 0 && (
        <Reveal delay={0.1}>
          <div className="bg-white rounded-2xl border border-navy-100/50 p-6">
            <h3 className="text-sm font-semibold text-navy-900 mb-4 flex items-center gap-2">
              <Trophy size={16} className="text-amber-500" />
              Hall of Fame
            </h3>
            <div className="grid sm:grid-cols-3 gap-3">
              {winners.map((w, i) => w.employee_name ? (
                <div key={i} className="bg-amber-50/50 rounded-xl p-4 text-center border border-amber-100/50">
                  <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-2">
                    <span className="text-white font-bold text-sm">{w.employee_name[0].toUpperCase()}</span>
                  </div>
                  <p className="text-sm font-semibold text-navy-900">{w.employee_name}</p>
                  <p className="text-xs text-navy-400 mt-0.5">
                    {MONTHS[(w.month ?? 1) - 1]} {w.year}
                  </p>
                  {w.event_id && (
                    <button
                      onClick={async () => { try { const r = await getEotmCertificate(w.event_id); setCertData(r?.data) } catch {} }}
                      className="mt-2 text-[10px] font-medium text-amber-700 border border-amber-200 rounded-lg px-2 py-1 hover:bg-amber-100 transition-colors flex items-center gap-1 mx-auto"
                    >
                      <Download size={10} /> Certificate
                    </button>
                  )}
                </div>
              ) : (
                <div key={i} className="bg-gray-50 rounded-xl p-4 text-center border border-gray-200 opacity-60">
                  <div className="w-12 h-12 mx-auto rounded-full bg-gray-300 flex items-center justify-center mb-2">
                    <span className="text-white font-bold text-sm">—</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-500">No Winner</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {MONTHS[(w.month ?? 1) - 1]} {w.year}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      )}
    </div>
  )
}

/* ─── Settings Tab ─── */
function SettingsTab({ companyId, onNameChange }) {
  const [form, setForm] = useState({ name: '', location: '', description: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [employeeCount, setEmployeeCount] = useState(null)

  useEffect(() => {
    if (!companyId) return
    getCompanyById(companyId)
      .then(res => {
        const c = res?.data?.company ?? res?.data ?? {}
        setForm({
          name:        c.name        ?? '',
          location:    c.location    ?? '',
          description: c.description ?? '',
        })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
    getCompanyStats(companyId)
      .then(res => {
        const raw = res?.data?.stats ?? res?.data ?? null
        const s = Array.isArray(raw) ? raw[0] : raw
        setEmployeeCount(s?.totalEmployees ?? s?.total_employees ?? s?.employee_count ?? null)
      })
      .catch(() => {})
  }, [companyId])

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      await updateCompany(companyId, form)
      onNameChange?.(form.name)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch { /* silent */ } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="py-20 text-center text-navy-400 text-sm">Loading settings…</div>

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-navy-900">Company Profile Settings</h2>

      {employeeCount !== null && (
        <Reveal>
          <div className="bg-white rounded-2xl border border-navy-100/50 p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-navy-50 flex items-center justify-center">
              <Users size={20} className="text-navy-500" />
            </div>
            <div>
              <p className="text-2xl font-serif font-bold text-navy-900">{employeeCount}</p>
              <p className="text-xs text-navy-400">Verified Employees</p>
            </div>
          </div>
        </Reveal>
      )}

      <Reveal>
        <div className="bg-white rounded-2xl border border-navy-100/50 p-6">
          <div className="space-y-5 max-w-lg">
            <Input
              label="Company Name"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
            />
            <Input
              label="Location"
              value={form.location}
              onChange={e => setForm({ ...form, location: e.target.value })}
            />
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1.5">Description</label>
              <textarea
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                rows={4}
                className="w-full rounded-xl border border-navy-200 bg-white px-4 py-3 text-sm placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 transition-all resize-none"
              />
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={handleSave} size="sm" disabled={saving}>
                {saving ? 'Saving…' : 'Save Changes'}
              </Button>
              {saved && <span className="text-xs text-emerald-600 font-medium">✓ Saved</span>}
            </div>
          </div>
        </div>
      </Reveal>
    </div>
  )
}

/* ─── Jobs Tab ─── */
function JobsTab({ companyId }) {
  const [positions, setPositions]   = useState([])
  const [loading, setLoading]       = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating]     = useState(false)
  const [expanded, setExpanded]     = useState(null)
  const [applications, setApplications] = useState({})
  const [form, setForm] = useState({ title: '', description: '', requirements: '', salaryMin: '', salaryMax: '' })
  const [createError, setCreateError] = useState('')
  const [updatingApp, setUpdatingApp] = useState({})

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getCompanyPositions(companyId)
      setPositions(res?.data ?? [])
    } catch {} finally { setLoading(false) }
  }, [companyId])

  useEffect(() => { if (companyId) load() }, [companyId, load])

  const handleCreate = async () => {
    if (!form.title.trim()) { setCreateError('Title is required'); return }
    setCreating(true); setCreateError('')
    try {
      await createPosition({ ...form, companyId, salaryMin: form.salaryMin || null, salaryMax: form.salaryMax || null })
      setForm({ title: '', description: '', requirements: '', salaryMin: '', salaryMax: '' })
      setShowCreate(false)
      await load()
    } catch (e) { setCreateError(e?.message || 'Failed to create position') }
    finally { setCreating(false) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this position and all its applications?')) return
    try { await deletePosition(id, companyId); await load() } catch {}
  }

  const toggleApplications = async (posId) => {
    if (expanded === posId) { setExpanded(null); return }
    setExpanded(posId)
    if (!applications[posId]) {
      try {
        const res = await getApplicationsForPosition(posId, companyId)
        setApplications(prev => ({ ...prev, [posId]: res?.data ?? [] }))
      } catch { setApplications(prev => ({ ...prev, [posId]: [] })) }
    }
  }

  const handleUpdateApp = async (appId, status, posId) => {
    setUpdatingApp(p => ({ ...p, [appId]: true }))
    try {
      await updateApplicationStatus(appId, { status })
      setApplications(prev => ({ ...prev, [posId]: (prev[posId] ?? []).map(a => a.id === appId ? { ...a, status } : a) }))
    } catch {} finally { setUpdatingApp(p => ({ ...p, [appId]: false })) }
  }

  const statusColors = {
    submitted:   'bg-blue-50 text-blue-700 border-blue-200',
    reviewing:   'bg-amber-50 text-amber-700 border-amber-200',
    shortlisted: 'bg-violet-50 text-violet-700 border-violet-200',
    rejected:    'bg-red-50 text-red-700 border-red-200',
    accepted:    'bg-emerald-50 text-emerald-700 border-emerald-200',
    withdrawn:   'bg-gray-50 text-gray-500 border-gray-200',
  }

  if (loading) return <div className="py-20 text-center text-navy-400 text-sm"><Loader2 size={20} className="animate-spin mx-auto" /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-navy-900">Job Positions</h2>
        <button onClick={() => setShowCreate(!showCreate)}
          className="h-10 px-5 bg-navy-900 text-white text-sm font-medium rounded-xl inline-flex items-center gap-2 hover:bg-navy-800 transition-all">
          <Plus size={15} /> New Position
        </button>
      </div>

      {showCreate && (
        <Reveal>
          <div className="bg-white rounded-2xl border border-navy-200 p-6">
            <h3 className="text-sm font-semibold text-navy-900 mb-4">Create Position</h3>
            {createError && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2 mb-4">{createError}</p>}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-navy-600 block mb-1">Title *</label>
                <input type="text" placeholder="e.g. Senior Software Engineer" value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full h-10 rounded-xl border border-navy-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 transition-all" />
              </div>
              <div>
                <label className="text-xs font-medium text-navy-600 block mb-1">Description</label>
                <textarea placeholder="Role overview…" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3}
                  className="w-full rounded-xl border border-navy-200 bg-white px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 transition-all" />
              </div>
              <div>
                <label className="text-xs font-medium text-navy-600 block mb-1">Requirements</label>
                <textarea placeholder="Skills and qualifications…" value={form.requirements} onChange={e => setForm(f => ({ ...f, requirements: e.target.value }))} rows={2}
                  className="w-full rounded-xl border border-navy-200 bg-white px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 transition-all" />
              </div>
              <div className="flex gap-3">
                <div>
                  <label className="text-xs font-medium text-navy-600 block mb-1">Min Salary</label>
                  <input type="number" placeholder="50000" value={form.salaryMin} onChange={e => setForm(f => ({ ...f, salaryMin: e.target.value }))}
                    className="w-32 h-10 rounded-xl border border-navy-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 transition-all" />
                </div>
                <div>
                  <label className="text-xs font-medium text-navy-600 block mb-1">Max Salary</label>
                  <input type="number" placeholder="80000" value={form.salaryMax} onChange={e => setForm(f => ({ ...f, salaryMax: e.target.value }))}
                    className="w-32 h-10 rounded-xl border border-navy-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 transition-all" />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={handleCreate} disabled={creating}
                  className="h-9 px-5 bg-navy-900 text-white text-xs font-semibold rounded-xl hover:bg-navy-800 transition-colors flex items-center gap-1.5 disabled:opacity-50">
                  {creating ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                  {creating ? 'Creating…' : 'Create Position'}
                </button>
                <button onClick={() => setShowCreate(false)} className="h-9 px-4 text-xs font-medium text-navy-500 border border-navy-200 rounded-xl hover:bg-navy-50 transition-colors">Cancel</button>
              </div>
            </div>
          </div>
        </Reveal>
      )}

      {!positions.length && !showCreate && (
        <div className="bg-white rounded-2xl border border-navy-100/50 p-12 text-center">
          <Briefcase size={28} className="text-navy-200 mx-auto mb-3" />
          <p className="text-sm text-navy-400">No open positions. Create one to start receiving applications.</p>
        </div>
      )}

      {positions.map((pos, i) => (
        <Reveal key={pos.id} delay={i * 0.05}>
          <div className="bg-white rounded-2xl border border-navy-100/50 hover:border-navy-200 transition-all">
            <div className="px-6 py-4 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 mb-1">
                  <p className="text-sm font-semibold text-navy-900">{pos.title}</p>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                    pos.status === 'open'   ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    pos.status === 'filled' ? 'bg-violet-50 text-violet-700 border-violet-200' :
                    'bg-gray-50 text-gray-500 border-gray-200'
                  }`}>{pos.status}</span>
                </div>
                {pos.description && <p className="text-xs text-navy-400 line-clamp-2">{pos.description}</p>}
                {(pos.salary_min || pos.salary_max) && (
                  <p className="text-xs text-navy-500 mt-1">
                    💰 {pos.salary_min ? `$${Number(pos.salary_min).toLocaleString()}` : ''}
                    {pos.salary_min && pos.salary_max ? ' – ' : ''}
                    {pos.salary_max ? `$${Number(pos.salary_max).toLocaleString()}` : ''}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => toggleApplications(pos.id)}
                  className="h-8 px-3 text-xs font-medium text-navy-500 border border-navy-200 rounded-lg hover:bg-navy-50 transition-colors">
                  {expanded === pos.id ? 'Hide' : 'View'} Applications
                </button>
                <button onClick={() => handleDelete(pos.id)} className="h-8 w-8 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <AnimatePresence>
              {expanded === pos.id && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="px-6 pb-5 border-t border-navy-100 pt-4 space-y-2">
                    {!(applications[pos.id] ?? []).length ? (
                      <p className="text-xs text-navy-400 text-center py-3">No applications yet.</p>
                    ) : (applications[pos.id] ?? []).map(app => (
                      <div key={app.id} className="flex items-center justify-between bg-navy-50/50 rounded-xl px-4 py-2.5 gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-navy-900 truncate">{app.employees?.full_name ?? app.employee_name ?? 'Applicant'}</p>
                          {app.cover_letter && <p className="text-xs text-navy-400 truncate mt-0.5">{app.cover_letter}</p>}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {app.resume_url && (
                            <a href={app.resume_url} target="_blank" rel="noopener noreferrer"
                              className="h-7 px-2.5 text-xs font-medium text-navy-500 border border-navy-200 rounded-lg hover:bg-navy-50 transition-colors flex items-center gap-1">
                              <Download size={11} /> CV
                            </a>
                          )}
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusColors[app.status] ?? 'bg-gray-50 text-gray-500 border-gray-200'}`}>{app.status}</span>
                          <select value={app.status} onChange={e => handleUpdateApp(app.id, e.target.value, pos.id)} disabled={!!updatingApp[app.id]}
                            className="h-7 text-xs rounded-lg border border-navy-200 bg-white px-1.5 focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500">
                            {['submitted','reviewing','shortlisted','rejected','accepted'].map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Reveal>
      ))}
    </div>
  )
}

/* ─── EOTY Admin Tab ─── */
function EotyAdminTab({ companyId }) {
  const [events, setEvents]   = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [nominees, setNominees] = useState({})
  const [expanded, setExpanded] = useState(null)
  const [closing, setClosing]   = useState(null)
  const [certData, setCertData] = useState(null)
  const year = new Date().getFullYear()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getEotyEvents()
      setEvents(res?.data ?? [])
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const handleCreate = async () => {
    setCreating(true); setCreateError('')
    try { await createEotyEvent(year); await load() }
    catch (e) { setCreateError(e?.message || 'Failed to create event') }
    finally { setCreating(false) }
  }

  const handleClose = async (id) => {
    setClosing(id)
    try { await closeEotyEvent(id); await load() }
    catch {} finally { setClosing(null) }
  }

  const toggleNominees = async (id) => {
    if (expanded === id) { setExpanded(null); return }
    setExpanded(id)
    if (!nominees[id]) {
      try {
        const res = await getEotyNominees(id)
        setNominees(p => ({ ...p, [id]: res?.data ?? [] }))
      } catch { setNominees(p => ({ ...p, [id]: [] })) }
    }
  }

  if (loading) return <div className="py-20 text-center text-navy-400 text-sm"><Loader2 size={20} className="animate-spin mx-auto" /></div>

  const hasCurrentYear = events.some(e => e.year === year)

  return (
    <div className="space-y-6">
      {certData && <CertificateModal {...certData} onClose={() => setCertData(null)} />}
      <h2 className="text-lg font-semibold text-navy-900">Employee of the Year</h2>

      {!hasCurrentYear && (
        <Reveal>
          <div className="bg-white rounded-2xl border border-navy-100/50 p-6">
            <h3 className="text-sm font-semibold text-navy-900 mb-2 flex items-center gap-2">
              <Trophy size={16} className="text-amber-500" /> Start EOTY {year}
            </h3>
            {createError && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2 mb-3">{createError}</p>}
            <p className="text-sm text-navy-500 mb-4">Create the annual Employee of the Year event to open nominations and voting.</p>
            <button onClick={handleCreate} disabled={creating}
              className="h-10 px-5 bg-navy-900 text-white text-xs font-semibold rounded-xl hover:bg-navy-800 transition-colors flex items-center gap-1.5 disabled:opacity-50">
              {creating ? <Loader2 size={13} className="animate-spin" /> : <Trophy size={13} />}
              {creating ? 'Creating…' : `Create ${year} EOTY Event`}
            </button>
          </div>
        </Reveal>
      )}

      {events.map((ev, i) => (
        <Reveal key={ev.id} delay={i * 0.05}>
          <div className="bg-white rounded-2xl border border-navy-100/50 hover:border-navy-200 transition-all">
            <div className="px-6 py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${ev.is_active ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                  <Trophy size={16} className={ev.is_active ? 'text-emerald-600' : 'text-amber-600'} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-navy-900">EOTY {ev.year}</p>
                  <Badge variant={ev.is_active ? 'success' : 'default'}>{ev.is_active ? 'Active' : 'Closed'}</Badge>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => toggleNominees(ev.id)}
                  className="h-8 px-3 text-xs font-medium text-navy-500 border border-navy-200 rounded-lg hover:bg-navy-50 transition-colors">
                  {expanded === ev.id ? 'Hide' : 'View'} Nominees
                </button>
                {!ev.is_active && (
                  <button onClick={async () => { try { const r = await getEotyCertificate(ev.id); setCertData(r?.data) } catch {} }}
                    className="h-8 px-3 text-xs font-medium text-amber-600 border border-amber-200 rounded-lg hover:bg-amber-50 transition-colors flex items-center gap-1.5">
                    <Download size={12} /> Certificate
                  </button>
                )}
                {ev.is_active && (
                  <button onClick={() => handleClose(ev.id)} disabled={closing === ev.id}
                    className="h-8 px-3 bg-amber-600 text-white text-xs font-medium rounded-lg hover:bg-amber-700 transition-colors flex items-center gap-1.5 disabled:opacity-50">
                    {closing === ev.id ? <Loader2 size={12} className="animate-spin" /> : <Trophy size={12} />}
                    Close &amp; Declare Winner
                  </button>
                )}
              </div>
            </div>
            <AnimatePresence>
              {expanded === ev.id && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="px-6 pb-5 border-t border-navy-100 pt-4 space-y-2">
                    {!(nominees[ev.id] ?? []).length ? (
                      <p className="text-xs text-navy-400 text-center py-3">No nominees yet.</p>
                    ) : (nominees[ev.id] ?? []).map((nom, j) => (
                      <div key={j} className="flex items-center justify-between bg-navy-50/50 rounded-xl px-4 py-2.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                            <span className="text-white text-xs font-semibold">{(nom.employees?.full_name || nom.full_name || '?')[0].toUpperCase()}</span>
                          </div>
                          <p className="text-sm font-medium text-navy-900">{nom.employees?.full_name ?? nom.full_name ?? 'Unknown'}</p>
                        </div>
                        {nom.vote_count != null && <span className="text-sm font-bold text-navy-700">{nom.vote_count} votes</span>}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Reveal>
      ))}
    </div>
  )
}



