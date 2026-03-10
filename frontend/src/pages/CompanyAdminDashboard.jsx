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
  Plus,
  Briefcase,
  Trash2,
  Eye,
  X,
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
import { useAuth } from '../context/AuthContext'
import { getCompanyStats, getCompanyAnalytics, getCompanyReviews, getCompanyById, updateCompany } from '../api/companies'
import { getPendingEmployments, approveEmployment, rejectEmployment, getAllEmploymentsForAdmin, endEmploymentByAdmin, getCurrentEmployees, approveEndRequest, rejectEndRequest } from '../api/employments'
import { createEotmEvent, closeEotmEvent, getCompanyEotmEvents, getEotmNominees, getCompanyEotmWinners } from '../api/eotm'
import { createEotyEvent, closeEotyEvent, getCompanyEotyEvents, getEotyNominees, getCompanyEotyWinners } from '../api/eoty'
import { useNotification } from '../context/NotificationContext'
import { getJobPositions, createJobPosition, closeJobPosition, deleteJobPosition, getApplications, updateApplicationStatus, sendHireInvite, fetchCvBlob } from '../api/jobs'
import { Country, City } from 'country-state-city'

const ALL_COUNTRIES_SETTINGS = Country.getAllCountries().map(c => ({ name: c.name, isoCode: c.isoCode }))

const VALID_CA_TABS = ['overview', 'requests', 'reviews', 'eotm', 'eoty', 'jobs', 'settings']

export default function CompanyAdminDashboard() {
  const [activeTab, setActiveTab] = useState(() => {
    const hash = window.location.hash.replace('#', '')
    return VALID_CA_TABS.includes(hash) ? hash : 'overview'
  })
  const [pendingCount, setPendingCount] = useState(0)
  const [reviewCount, setReviewCount] = useState(0)
  const [activeEotmCount, setActiveEotmCount] = useState(0)
  const [activeEotyCount, setActiveEotyCount] = useState(0)
  const [jobCount, setJobCount] = useState(0)
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
    getCompanyEotyEvents(companyId)
      .then(res => {
        const events = res?.data ?? []
        const active = Array.isArray(events) ? events.filter(e => e.status === 'open' || e.status === 'active').length : 0
        setActiveEotyCount(active)
      })
      .catch(() => {})
    getJobPositions(companyId)
      .then(res => {
        const list = res?.data ?? []
        setJobCount(Array.isArray(list) ? list.filter(j => j.status === 'open' || j.is_active).length : 0)
      })
      .catch(() => {})
  }, [companyId])

  const tabs = [
    { id: 'overview',  label: 'Analytics', icon: BarChart3 },
    { id: 'requests',  label: 'Employees', icon: Users, badge: pendingCount || null },
    { id: 'reviews',   label: 'Reviews',   icon: FileText, badge: reviewCount || null },
    { id: 'eotm',      label: 'EOTM',      icon: Award, badge: activeEotmCount || null },
    { id: 'eoty',      label: 'EOTY',      icon: Trophy, badge: activeEotyCount || null },
    { id: 'jobs',      label: 'Jobs',       icon: Briefcase, badge: jobCount || null },
    { id: 'settings',  label: 'Settings',  icon: Settings },
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
        {activeTab === 'eoty'      && <EotyTab companyId={companyId} />}
        {activeTab === 'jobs'      && <JobsTab companyId={companyId} />}
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
  const rawDist = analytics?.ratingDistribution ?? analytics?.rating_distribution
  const ratingDist = rawDist
    ? Object.entries(rawDist)
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

/* ─── Employees Tab ─── */
function RequestsTab({ companyId, onCountChange }) {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [ending, setEnding] = useState({})
  const [endConfirm, setEndConfirm] = useState({})
  const [endReason, setEndReason] = useState({})
  const [approvingEnd, setApprovingEnd] = useState({})
  const [rejectingEnd, setRejectingEnd] = useState({})
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const res = await getCurrentEmployees()
      const list = Array.isArray(res?.data) ? res.data : []
      setEmployees(list)
      // badge: count of pending end requests
      onCountChange?.(list.filter(e => !!e.end_requested_at).length)
    } catch {
      setEmployees([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleEnd = async (emp) => {
    setEnding(s => ({ ...s, [emp.id]: true }))
    setError('')
    try {
      await endEmploymentByAdmin(emp.id, { reason: endReason[emp.id]?.trim() || undefined })
      setEndConfirm(c => ({ ...c, [emp.id]: false }))
      setEndReason(r => ({ ...r, [emp.id]: '' }))
      await load()
    } catch (e) {
      setError(e?.message || 'Failed to end employment')
    } finally {
      setEnding(s => ({ ...s, [emp.id]: false }))
    }
  }

  const handleApproveEnd = async (emp) => {
    setApprovingEnd(s => ({ ...s, [emp.id]: true }))
    setError('')
    try {
      await approveEndRequest(emp.id)
      await load()
    } catch (e) {
      setError(e?.message || 'Failed to approve end request')
    } finally {
      setApprovingEnd(s => ({ ...s, [emp.id]: false }))
    }
  }

  const handleRejectEnd = async (emp) => {
    setRejectingEnd(s => ({ ...s, [emp.id]: true }))
    setError('')
    try {
      await rejectEndRequest(emp.id)
      await load()
    } catch (e) {
      setError(e?.message || 'Failed to reject end request')
    } finally {
      setRejectingEnd(s => ({ ...s, [emp.id]: false }))
    }
  }

  if (loading) return <div className="py-20 text-center text-navy-400 text-sm"><Loader2 size={20} className="animate-spin mx-auto" /></div>

  const withEndRequest = employees.filter(e => !!e.end_requested_at)
  const regular = employees.filter(e => !e.end_requested_at)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-navy-900">
          Employees
          <span className="ml-2 text-sm font-normal text-navy-400">({employees.length})</span>
        </h2>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-600 text-xs font-semibold">✕</button>
        </div>
      )}

      {employees.length === 0 && (
        <div className="bg-white rounded-2xl border border-navy-100/50 p-12 text-center">
          <Users size={32} className="text-navy-200 mx-auto mb-3" />
          <p className="text-sm text-navy-400">No employees yet. Hire employees via the Jobs tab.</p>
        </div>
      )}

      {/* Pending end requests */}
      {withEndRequest.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-amber-600">Pending End Requests ({withEndRequest.length})</h3>
          {withEndRequest.map((emp, i) => {
            const name = emp.employees?.full_name ?? 'Unknown'
            const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
            return (
              <Reveal key={emp.id} delay={i * 0.05}>
                <div className="bg-white rounded-2xl border border-amber-200 p-5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0">
                      <span className="text-white text-sm font-semibold">{initials}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-navy-900">{name}</p>
                      <p className="text-xs text-navy-400 mt-0.5">{emp.position ?? '–'}</p>
                      {emp.end_request_reason && (
                        <p className="text-xs text-amber-700 mt-1">Reason: {emp.end_request_reason}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2.5 py-1 rounded-full border border-amber-200 bg-amber-50 text-amber-700 text-xs font-semibold flex items-center gap-1">
                        <Clock size={11} /> End Requested
                      </span>
                      <button
                        onClick={() => handleApproveEnd(emp)}
                        disabled={!!approvingEnd[emp.id]}
                        className="h-8 px-4 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {approvingEnd[emp.id] ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectEnd(emp)}
                        disabled={!!rejectingEnd[emp.id]}
                        className="h-8 px-4 border border-red-200 text-red-600 text-xs font-semibold rounded-xl hover:bg-red-50 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {rejectingEnd[emp.id] ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              </Reveal>
            )
          })}
        </div>
      )}

      {/* Active employees */}
      {regular.length > 0 && (
        <div className="space-y-3">
          {withEndRequest.length > 0 && <h3 className="text-xs font-semibold uppercase tracking-widest text-navy-400">Active Employees ({regular.length})</h3>}
          {regular.map((emp, i) => {
            const name = emp.employees?.full_name ?? 'Unknown'
            const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
            const isEnding = !!ending[emp.id]
            return (
              <Reveal key={emp.id} delay={i * 0.05}>
                <div className="bg-white rounded-2xl border border-navy-100/50 p-5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-navy-400 to-navy-700 flex items-center justify-center shrink-0">
                      <span className="text-white text-sm font-semibold">{initials}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-navy-900">{name}</p>
                      <p className="text-xs text-navy-400 mt-0.5">
                        {emp.position ?? '–'}{emp.department ? ` · ${emp.department}` : ''}
                        {emp.start_date && <span className="ml-2">Since {new Date(emp.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2.5 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-semibold flex items-center gap-1">
                        <CheckCircle2 size={11} /> Employed
                      </span>
                      {!endConfirm[emp.id] ? (
                        <button
                          onClick={() => setEndConfirm(c => ({ ...c, [emp.id]: true }))}
                          className="h-8 px-4 border border-red-200 text-red-600 text-xs font-semibold rounded-xl hover:bg-red-50 transition-colors flex items-center gap-1.5"
                        >
                          <XCircle size={12} /> End
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Reason (optional)"
                            value={endReason[emp.id] || ''}
                            onChange={e => setEndReason(r => ({ ...r, [emp.id]: e.target.value }))}
                            className="h-8 px-3 text-xs border border-red-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-300 w-36"
                          />
                          <button
                            onClick={() => handleEnd(emp)}
                            disabled={isEnding}
                            className="h-8 px-3 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1 disabled:opacity-50"
                          >
                            {isEnding ? <Loader2 size={12} className="animate-spin" /> : null}
                            Confirm
                          </button>
                          <button
                            onClick={() => { setEndConfirm(c => ({ ...c, [emp.id]: false })); setEndReason(r => ({ ...r, [emp.id]: '' })) }}
                            className="h-8 px-2 border border-navy-200 text-navy-500 text-xs rounded-lg hover:bg-navy-50 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Reveal>
            )
          })}
        </div>
      )}
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

/* ─── EOTM Tab ─── */
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

function EotmTab({ companyId }) {
  const { addNotification } = useNotification()
  const [events, setEvents]     = useState([])
  const [winners, setWinners]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [creating, setCreating] = useState(false)
  const [closing, setClosing]   = useState(null)
  const [newMonth, setNewMonth] = useState(new Date().getMonth() + 1)
  const [newYear, setNewYear]   = useState(new Date().getFullYear())
  const [nominees, setNominees] = useState({}) // { eventId: [...] }
  const [expanded, setExpanded] = useState(null)

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
    try {
      await createEotmEvent({ companyId, month: newMonth, year: newYear })
      addNotification(`EOTM event created for ${MONTHS[newMonth - 1]} ${newYear}`, 'success')
      await load()
    } catch (e) {
      addNotification(e?.message || 'Failed to create event', 'error')
    }
    finally { setCreating(false) }
  }

  const handleClose = async (eventId) => {
    setClosing(eventId)
    try {
      const res = await closeEotmEvent(eventId)
      const winnerName = res?.data?.winner?.name || res?.winner?.name || 'Unknown'
      const message = res?.data?.winner?.name 
        ? `Event closed! Winner: ${winnerName} (${res?.data?.winner?.voteCount} votes)`
        : 'Event closed with no votes'
      addNotification(message, 'success')
      await load()
    } catch (e) {
      addNotification(e?.message || 'Failed to close event', 'error')
    }
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
          {/* Original error display removed - now using NotificationContext */}
        </div>
      </Reveal>

      {/* Active events */}
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
                  <p className="text-xs text-navy-400">{w.voteCount} votes</p>
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

/* ─── EOTY Tab ─── */
function EotyTab({ companyId }) {
  const { addNotification } = useNotification()
  const [events, setEvents] = useState([])
  const [winners, setWinners] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [closing, setClosing] = useState({})
  const [nominees, setNominees] = useState({})
  const [loadingNominees, setLoadingNominees] = useState({})

  const load = async () => {
    setLoading(true)
    try {
      const [evRes, wRes] = await Promise.all([
        getCompanyEotyEvents(companyId),
        getCompanyEotyWinners(companyId),
      ])
      setEvents(evRes?.data ?? [])
      setWinners(wRes?.data ?? [])
    } catch { setEvents([]); setWinners([]) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [companyId])

  const handleCreate = async () => {
    setCreating(true)
    try {
      await createEotyEvent({ companyId, year: new Date().getFullYear() })
      addNotification(`EOTY event created for ${new Date().getFullYear()}`, 'success')
      await load()
    }
    catch (e) { addNotification(e?.message || 'Failed to create EOTY event', 'error') }
    finally { setCreating(false) }
  }

  const handleClose = async (eventId) => {
    setClosing(p => ({ ...p, [eventId]: true }))
    try {
      const res = await closeEotyEvent(eventId)
      const winnerName = res?.data?.winner?.name || res?.winner?.name || 'Unknown'
      const message = res?.data?.winner?.name
        ? `Event closed! Winner: ${winnerName} (${res?.data?.winner?.voteCount} votes)`
        : 'Event closed with no votes'
      addNotification(message, 'success')
      await load()
    }
    catch (e) { addNotification(e?.message || 'Failed to close event', 'error') }
    finally { setClosing(p => ({ ...p, [eventId]: false })) }
  }

  const toggleNominees = async (eventId) => {
    if (nominees[eventId]) { setNominees(n => ({ ...n, [eventId]: null })); return }
    setLoadingNominees(l => ({ ...l, [eventId]: true }))
    try {
      const res = await getEotyNominees(eventId)
      setNominees(n => ({ ...n, [eventId]: res?.data ?? [] }))
    } catch { setNominees(n => ({ ...n, [eventId]: [] })) }
    finally { setLoadingNominees(l => ({ ...l, [eventId]: false })) }
  }

  if (loading) return <div className="py-20 text-center text-navy-400 text-sm">Loading EOTY…</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-navy-900">Employee of the Year</h2>
        <button onClick={handleCreate} disabled={creating}
          className="h-9 px-4 bg-navy-900 text-white text-xs font-semibold rounded-xl hover:bg-navy-800 transition-colors flex items-center gap-1.5 disabled:opacity-50">
          {creating ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
          Start {new Date().getFullYear()} EOTY
        </button>
      </div>

      {events.length === 0 && (
        <div className="bg-white rounded-2xl border border-navy-100/50 p-12 text-center">
          <Trophy size={32} className="text-navy-200 mx-auto mb-3" />
          <p className="text-sm text-navy-400">No EOTY events yet. Create one to start collecting votes!</p>
        </div>
      )}

      {events.map((ev, i) => (
        <Reveal key={ev.id} delay={i * 0.05}>
          <div className="bg-white rounded-2xl border border-navy-100/50 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Trophy size={18} className="text-amber-500" />
                <div>
                  <p className="text-sm font-semibold text-navy-900">Year {ev.year}</p>
                  <p className="text-xs text-navy-400 capitalize">{ev.status}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => toggleNominees(ev.id)}
                  className="h-8 px-3 border border-navy-200 text-navy-600 text-xs font-medium rounded-lg hover:bg-navy-50 transition-colors">
                  {loadingNominees[ev.id] ? <Loader2 size={12} className="animate-spin" /> : nominees[ev.id] ? 'Hide Nominees' : 'View Nominees'}
                </button>
                {(ev.status === 'open' || ev.status === 'active') && (
                  <button onClick={() => handleClose(ev.id)} disabled={!!closing[ev.id]}
                    className="h-8 px-3 bg-amber-500 text-white text-xs font-semibold rounded-lg hover:bg-amber-600 transition-colors flex items-center gap-1.5 disabled:opacity-50">
                    {closing[ev.id] ? <Loader2 size={12} className="animate-spin" /> : 'Close & Announce'}
                  </button>
                )}
              </div>
            </div>

            <AnimatePresence>
              {nominees[ev.id] && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div className="border-t border-navy-100 pt-3 mt-3 space-y-2">
                    {nominees[ev.id].length === 0 && <p className="text-xs text-navy-400">No votes cast yet.</p>}
                    {nominees[ev.id].map((nom, j) => (
                      <div key={j} className="flex items-center justify-between bg-ice-50 rounded-xl px-4 py-2">
                        <span className="text-sm font-medium text-navy-900">{nom.full_name ?? nom.employee_name ?? 'Employee'}</span>
                        <span className="text-xs text-navy-500">{nom.vote_count != null ? `${nom.vote_count} votes` : ''}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {ev.status === 'closed' && ev.winner_name && (
              <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
                <Trophy size={16} className="text-amber-600" />
                <p className="text-sm text-amber-800 font-medium">Winner: <strong>{ev.winner_name}</strong></p>
              </div>
            )}
          </div>
        </Reveal>
      ))}

      {winners.length > 0 && (
        <Reveal delay={0.1}>
          <div className="bg-white rounded-2xl border border-navy-100/50 p-6">
            <h3 className="text-sm font-semibold text-navy-900 mb-4 flex items-center gap-2">
              <Trophy size={16} className="text-amber-500" /> EOTY Hall of Fame
            </h3>
            <div className="grid sm:grid-cols-3 gap-3">
              {winners.map((w, i) => (
                <div key={i} className="bg-amber-50/50 rounded-xl p-4 text-center border border-amber-100/50">
                  <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-2">
                    <span className="text-white font-bold text-sm">{(w.employee_name ?? '?')[0].toUpperCase()}</span>
                  </div>
                  <p className="text-sm font-semibold text-navy-900">{w.employee_name ?? 'N/A'}</p>
                  <p className="text-xs text-navy-400 mt-0.5">{w.year}</p>
                  <p className="text-xs text-navy-400">{w.voteCount} votes</p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      )}
    </div>
  )
}

/* ─── Jobs Tab ─── */
function JobsTab({ companyId }) {
  const [positions, setPositions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({ title: '', description: '', requirements: '' })
  const [creating, setCreating] = useState(false)
  const [expandedId, setExpandedId] = useState(null)
  const [applications, setApplications] = useState({})
  const [loadingApps, setLoadingApps] = useState({})
  const [updatingApp, setUpdatingApp] = useState({})
  const [sendingHireInvite, setSendingHireInvite] = useState({})
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [jobError, setJobError] = useState('')
  const [cvViewer, setCvViewer] = useState({ open: false, blobUrl: null, isPdf: false, name: '', loading: false, error: null })

  const loadPositions = async () => {
    setLoading(true)
    try {
      const res = await getJobPositions(companyId)
      setPositions(res?.data ?? [])
    } catch { setPositions([]) }
    finally { setLoading(false) }
  }

  useEffect(() => { loadPositions() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!createForm.title.trim()) return
    setCreating(true)
    try {
      await createJobPosition({ ...createForm, companyId })
      setCreateForm({ title: '', description: '', requirements: '' })
      setShowCreate(false)
      await loadPositions()
    } catch (e) { setJobError(e?.message || 'Failed to create job position') }
    finally { setCreating(false) }
  }

  const handleClose = async (id) => {
    try { await closeJobPosition(id); await loadPositions() }
    catch (e) { setJobError(e?.message || 'Failed to close position') }
  }

  const handleDelete = async (id) => {
    if (deleteConfirm !== id) { setDeleteConfirm(id); return }
    setDeleteConfirm(null)
    try { await deleteJobPosition(id); await loadPositions() }
    catch (e) { setJobError(e?.message || 'Failed to delete position') }
  }

  const toggleApps = async (positionId) => {
    if (applications[positionId]) { setApplications(a => ({ ...a, [positionId]: null })); return }
    setLoadingApps(l => ({ ...l, [positionId]: true }))
    try {
      const res = await getApplications(positionId)
      setApplications(a => ({ ...a, [positionId]: res?.data ?? [] }))
    } catch { setApplications(a => ({ ...a, [positionId]: [] })) }
    finally { setLoadingApps(l => ({ ...l, [positionId]: false })) }
  }

  const handleStatusChange = async (appId, positionId, status) => {
    setUpdatingApp(u => ({ ...u, [appId]: true }))
    try {
      await updateApplicationStatus(appId, { status })
      // Reload applications for this position
      const res = await getApplications(positionId)
      setApplications(a => ({ ...a, [positionId]: res?.data ?? [] }))
    } catch (e) { setJobError(e?.message || 'Failed to update application status') }
    finally { setUpdatingApp(u => ({ ...u, [appId]: false })) }
  }

  const handleSendHireInvite = async (appId, positionId) => {
    setSendingHireInvite(s => ({ ...s, [appId]: true }))
    try {
      await sendHireInvite(appId)
      const res = await getApplications(positionId)
      setApplications(a => ({ ...a, [positionId]: res?.data ?? [] }))
    } catch (e) { setJobError(e?.message || 'Failed to send employment offer') }
    finally { setSendingHireInvite(s => ({ ...s, [appId]: false })) }
  }

  const handleViewCv = async (resumeUrl, applicantName) => {
    if (!resumeUrl) return
    const filename = resumeUrl.split('/').pop()
    setCvViewer({ open: true, blobUrl: null, isPdf: false, name: applicantName, loading: true, error: null })
    try {
      const blob = await fetchCvBlob(filename)
      const blobUrl = URL.createObjectURL(blob)
      const isPdf = blob.type === 'application/pdf' || filename.toLowerCase().endsWith('.pdf')
      setCvViewer({ open: true, blobUrl, isPdf, name: applicantName, loading: false, error: null })
    } catch (e) {
      setCvViewer(v => ({ ...v, loading: false, error: 'Could not load CV.' }))
    }
  }

  const closeCvViewer = () => {
    if (cvViewer.blobUrl) URL.revokeObjectURL(cvViewer.blobUrl)
    setCvViewer({ open: false, blobUrl: null, isPdf: false, name: '', loading: false, error: null })
  }

  if (loading) return <div className="py-20 text-center text-navy-400 text-sm">Loading jobs…</div>

  const STATUS_COLORS = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    interview: 'bg-blue-50 text-blue-700 border-blue-200',
    approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rejected: 'bg-red-50 text-red-700 border-red-200',
  }

  return (
    <div className="space-y-6">
      {jobError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 flex items-center justify-between">
          <span>{jobError}</span>
          <button onClick={() => setJobError('')} className="text-red-400 hover:text-red-600 text-xs font-semibold">✕</button>
        </div>
      )}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-navy-900">Job Positions</h2>
        <button onClick={() => setShowCreate(!showCreate)}
          className="h-9 px-4 bg-navy-900 text-white text-xs font-semibold rounded-xl hover:bg-navy-800 transition-colors flex items-center gap-1.5">
          <Plus size={13} /> New Position
        </button>
      </div>

      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <form onSubmit={handleCreate} className="bg-white rounded-2xl border border-navy-100/50 p-5 space-y-3 mb-4">
              <input type="text" required placeholder="Job title *" value={createForm.title}
                onChange={e => setCreateForm(f => ({ ...f, title: e.target.value }))}
                className="w-full h-10 rounded-xl border border-navy-200 bg-white px-3 text-sm placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 transition-all" />
              <textarea required placeholder="Description *" value={createForm.description}
                onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))}
                className="w-full h-24 rounded-xl border border-navy-200 bg-white px-3 py-2 text-sm placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 transition-all resize-none" />
              <textarea required placeholder="Requirements *" value={createForm.requirements}
                onChange={e => setCreateForm(f => ({ ...f, requirements: e.target.value }))}
                className="w-full h-20 rounded-xl border border-navy-200 bg-white px-3 py-2 text-sm placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 transition-all resize-none" />
              <div className="flex gap-2">
                <button type="submit" disabled={creating}
                  className="h-9 px-5 bg-navy-900 text-white text-xs font-semibold rounded-xl hover:bg-navy-800 transition-colors flex items-center gap-1.5 disabled:opacity-50">
                  {creating ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} Create
                </button>
                <button type="button" onClick={() => setShowCreate(false)}
                  className="h-9 px-4 text-navy-500 text-xs hover:text-navy-700">Cancel</button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {positions.length === 0 && (
        <div className="bg-white rounded-2xl border border-navy-100/50 p-12 text-center">
          <Briefcase size={32} className="text-navy-200 mx-auto mb-3" />
          <p className="text-sm text-navy-400">No job positions yet. Create one to start receiving applications!</p>
        </div>
      )}

      {positions.map((pos, i) => (
        <Reveal key={pos.id} delay={i * 0.05}>
          <div className="bg-white rounded-2xl border border-navy-100/50 p-5">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="text-sm font-semibold text-navy-900">{pos.title}</h3>
                <p className="text-xs text-navy-400 capitalize mt-0.5">{pos.status} · Created {new Date(pos.created_at).toLocaleDateString()}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => toggleApps(pos.id)}
                  className="h-8 px-3 border border-navy-200 text-navy-600 text-xs font-medium rounded-lg hover:bg-navy-50 transition-colors">
                  {loadingApps[pos.id] ? <Loader2 size={12} className="animate-spin" /> : applications[pos.id] ? 'Hide Apps' : 'Applications'}
                </button>
                {pos.status === 'open' && (
                  <button onClick={() => handleClose(pos.id)}
                    className="h-8 px-3 border border-amber-200 text-amber-600 text-xs font-medium rounded-lg hover:bg-amber-50 transition-colors">
                    Close
                  </button>
                )}
                {deleteConfirm === pos.id ? (
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-red-600">Sure?</span>
                    <button onClick={() => handleDelete(pos.id)}
                      className="h-8 px-2 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition-colors">
                      Delete
                    </button>
                    <button onClick={() => setDeleteConfirm(null)}
                      className="h-8 px-2 border border-navy-200 text-navy-500 text-xs font-medium rounded-lg hover:bg-navy-50 transition-colors">
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button onClick={() => handleDelete(pos.id)}
                    className="h-8 px-3 border border-red-200 text-red-600 text-xs font-medium rounded-lg hover:bg-red-50 transition-colors">
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            </div>
            {pos.description && <p className="text-xs text-navy-500 mb-2">{pos.description}</p>}

            <AnimatePresence>
              {applications[pos.id] && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div className="border-t border-navy-100 pt-3 mt-3 space-y-2">
                    {applications[pos.id].length === 0 && <p className="text-xs text-navy-400">No applications yet.</p>}
                    {applications[pos.id].map(app => {
                      const applicantName = app.applicant_name ?? app.employees?.full_name ?? 'Applicant'
                      const applicantEmail = app.employees?.users?.email
                      const hireInviteSent = !!app.hire_invite_sent_at
                      const hireInviteAccepted = !!app.hire_invite_accepted_at
                      return (
                        <div key={app.id} className="bg-ice-50 rounded-xl px-4 py-3">
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-navy-900">{applicantName}</p>
                              {applicantEmail && (
                                <p className="text-xs text-navy-500 mt-0.5">{applicantEmail}</p>
                              )}
                              <p className="text-xs text-navy-400 mt-0.5">
                                Applied {new Date(app.created_at).toLocaleDateString()}
                                {hireInviteSent && !hireInviteAccepted && <span className="ml-2 text-amber-600">· Hire offer sent</span>}
                                {hireInviteAccepted && <span className="ml-2 text-emerald-600">· Employed ✓</span>}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`px-2.5 py-1 rounded-full border text-xs font-semibold ${STATUS_COLORS[app.status] ?? STATUS_COLORS.pending}`}>
                                {app.status}
                              </span>
                              {app.resume_url && (
                                <button
                                  onClick={() => handleViewCv(app.resume_url, applicantName)}
                                  className="h-7 px-3 bg-navy-100 text-navy-700 text-xs font-medium rounded-lg hover:bg-navy-200 flex items-center gap-1"
                                >
                                  <Eye size={12} /> CV
                                </button>
                              )}
                              {app.status === 'pending' && (
                                <>
                                  <button onClick={() => handleStatusChange(app.id, pos.id, 'interview')} disabled={!!updatingApp[app.id]}
                                    className="h-7 px-3 bg-blue-100 text-blue-700 text-xs font-medium rounded-lg hover:bg-blue-200 disabled:opacity-50">
                                    Accept CV
                                  </button>
                                  <button onClick={() => handleStatusChange(app.id, pos.id, 'rejected')} disabled={!!updatingApp[app.id]}
                                    className="h-7 px-3 bg-red-100 text-red-700 text-xs font-medium rounded-lg hover:bg-red-200 disabled:opacity-50">
                                    Reject
                                  </button>
                                </>
                              )}
                              {app.status === 'interview' && (
                                <>
                                  {!hireInviteSent ? (
                                    <button onClick={() => handleSendHireInvite(app.id, pos.id)} disabled={!!sendingHireInvite[app.id]}
                                      className="h-7 px-3 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-lg hover:bg-emerald-200 disabled:opacity-50 flex items-center gap-1">
                                      {sendingHireInvite[app.id] ? <Loader2 size={11} className="animate-spin" /> : null} Hire
                                    </button>
                                  ) : !hireInviteAccepted ? (
                                    <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold rounded-full">Hire offer pending</span>
                                  ) : null}
                                  <button onClick={() => handleStatusChange(app.id, pos.id, 'rejected')} disabled={!!updatingApp[app.id]}
                                    className="h-7 px-3 bg-red-100 text-red-700 text-xs font-medium rounded-lg hover:bg-red-200 disabled:opacity-50">
                                    Reject
                                  </button>
                                </>
                              )}
                              {app.status === 'approved' && (
                                hireInviteAccepted
                                  ? <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-full">Employed ✓</span>
                                  : <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold rounded-full">Awaiting acceptance</span>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Reveal>
      ))}

      {/* ─── CV Viewer Modal ─── */}
      <AnimatePresence>
        {cvViewer.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) closeCvViewer() }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col"
              style={{ maxHeight: '90vh' }}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-navy-100">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-navy-500" />
                  <span className="text-sm font-semibold text-navy-900">{cvViewer.name}'s CV</span>
                </div>
                <button onClick={closeCvViewer} className="text-navy-400 hover:text-navy-600 p-1">
                  <X size={18} />
                </button>
              </div>
              <div className="flex-1 overflow-auto p-2" style={{ minHeight: '400px' }}>
                {cvViewer.loading && (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 size={24} className="animate-spin text-navy-400" />
                  </div>
                )}
                {cvViewer.error && (
                  <div className="flex items-center justify-center h-64 text-red-500 text-sm">{cvViewer.error}</div>
                )}
                {!cvViewer.loading && !cvViewer.error && cvViewer.blobUrl && (
                  cvViewer.isPdf ? (
                    <iframe
                      src={cvViewer.blobUrl}
                      title="Applicant CV"
                      className="w-full rounded-xl border border-navy-100"
                      style={{ height: 'calc(90vh - 100px)' }}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-64 gap-4">
                      <FileText size={48} className="text-navy-300" />
                      <p className="text-sm text-navy-500">Word document — click below to download and view.</p>
                      <a
                        href={cvViewer.blobUrl}
                        download={`cv-${cvViewer.name}.docx`}
                        className="h-9 px-5 bg-navy-900 text-white text-xs font-semibold rounded-xl hover:bg-navy-800 flex items-center gap-2"
                      >
                        Download CV
                      </a>
                    </div>
                  )
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─── Settings Tab ─── */
function SettingsTab({ companyId, onNameChange }) {
  const [form, setForm] = useState({ name: '', country: '', city: '', description: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const selectedCountryCode = ALL_COUNTRIES_SETTINGS.find(c => c.name === form.country)?.isoCode
  const availableCities = selectedCountryCode
    ? [...new Set(City.getCitiesOfCountry(selectedCountryCode).map(c => c.name))].sort()
    : []

  useEffect(() => {
    if (!companyId) return
    getCompanyById(companyId)
      .then(res => {
        const c = res?.data?.company ?? res?.data ?? {}
        // Try to parse existing "City, Country" location string
        const parts = (c.location ?? '').split(', ')
        const parsedCountry = parts.length >= 2 ? parts[parts.length - 1] : (parts[0] || '')
        const parsedCity    = parts.length >= 2 ? parts.slice(0, -1).join(', ') : ''
        setForm({
          name:        c.name        ?? '',
          country:     parsedCountry,
          city:        parsedCity,
          description: c.description ?? '',
        })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [companyId])

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      const location = form.city ? `${form.city}, ${form.country}` : form.country
      await updateCompany(companyId, { name: form.name, description: form.description, location })
      onNameChange?.(form.name)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) { alert(e?.message || 'Failed to save settings') } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="py-20 text-center text-navy-400 text-sm">Loading settings…</div>

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-navy-900">Company Profile Settings</h2>

      <Reveal>
        <div className="bg-white rounded-2xl border border-navy-100/50 p-6">
          <div className="space-y-5 max-w-lg">
            <Input
              label="Company Name"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
            />
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-navy-700">Country</label>
              <div className="relative">
                <select
                  value={form.country}
                  onChange={e => setForm({ ...form, country: e.target.value, city: '' })}
                  className="w-full h-11 rounded-xl border border-navy-200 bg-white pl-3 pr-8 text-sm text-navy-700 appearance-none focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 transition-all cursor-pointer"
                >
                  <option value="">Select country…</option>
                  {ALL_COUNTRIES_SETTINGS.map(c => <option key={c.isoCode} value={c.name}>{c.name}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400 pointer-events-none" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className={`block text-sm font-medium ${!form.country ? 'text-navy-300' : 'text-navy-700'}`}>City</label>
              <div className="relative">
                <select
                  value={form.city}
                  onChange={e => setForm({ ...form, city: e.target.value })}
                  disabled={!form.country}
                  className={`w-full h-11 rounded-xl border bg-white pl-3 pr-8 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 transition-all ${!form.country ? 'border-navy-100 text-navy-300 cursor-not-allowed opacity-60' : 'border-navy-200 text-navy-700 cursor-pointer'}`}
                >
                  <option value="">{form.country ? 'Select city…' : 'Select country first'}</option>
                  {availableCities.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400 pointer-events-none" />
              </div>
            </div>
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








