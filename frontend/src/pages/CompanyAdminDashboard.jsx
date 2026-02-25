import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
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
import { getPendingEmployments, approveEmployment, rejectEmployment } from '../api/employments'
import { getFeedbackReceived } from '../api/feedback'

export default function CompanyAdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [pendingCount, setPendingCount] = useState(0)
  const [companyName, setCompanyName] = useState('Dashboard')
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
  }, [companyId])

  const tabs = [
    { id: 'overview', label: 'Analytics', icon: BarChart3 },
    { id: 'requests', label: 'Requests', icon: Users, badge: pendingCount || null },
    { id: 'reviews', label: 'Reviews', icon: FileText },
    { id: 'feedback', label: 'Team Feedback', icon: MessageSquare },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-ice-50">
      <PageHeader
        tag="Company Admin"
        title={`${companyName} Dashboard`}
        subtitle="Manage your company profile, verify employees, and view analytics."
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
        setStats(statsRes?.data?.stats ?? statsRes?.data ?? null)
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

  const monthlyData  = analytics?.monthlyReviews ?? analytics?.monthly ?? []
  const ratingDist   = analytics?.ratingDistribution
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
function RequestsTab({ companyId, onCountChange }) {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState({})

  const load = async () => {
    setLoading(true)
    try {
      const res = await getPendingEmployments()
      const list = res?.data?.employments ?? res?.data ?? []
      const arr = Array.isArray(list) ? list : []
      setRequests(arr)
      onCountChange?.(arr.length)
    } catch {
      setRequests([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handle = async (id, action) => {
    setProcessing(p => ({ ...p, [id]: true }))
    try {
      if (action === 'approve') await approveEmployment(id)
      else await rejectEmployment(id)
      await load()
    } catch { /* silent */ } finally {
      setProcessing(p => ({ ...p, [id]: false }))
    }
  }

  if (loading) return <div className="py-20 text-center text-navy-400 text-sm">Loading requests…</div>

  if (!requests.length) return (
    <div className="bg-white rounded-2xl border border-navy-100/50 p-12 text-center">
      <CheckCircle2 size={32} className="text-emerald-400 mx-auto mb-3" />
      <p className="text-sm text-navy-500">All caught up! No pending requests.</p>
    </div>
  )

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-navy-900 mb-2">
        Pending Verification Requests
        <span className="ml-2 text-sm font-normal text-navy-400">({requests.length})</span>
      </h2>
      {requests.map((req, i) => {
        const name = req.employee?.user?.fullName ?? req.employee?.fullName ?? 'Unknown'
        const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
        return (
          <Reveal key={req.id} delay={i * 0.08}>
            <div className="bg-white rounded-2xl border border-navy-100/50 p-6 hover:border-navy-200 transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-navy-400 to-navy-600 flex items-center justify-center shrink-0">
                    <span className="text-white text-sm font-semibold">{initials}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-navy-900 text-sm">{name}</h3>
                    <p className="text-xs text-navy-400 mt-0.5">{req.position ?? '–'}</p>
                    <p className="text-xs text-navy-300 mt-0.5">
                      {req.startDate ? new Date(req.startDate).toLocaleDateString() : '–'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:ml-auto">
                  <Badge variant="warning"><Clock size={12} className="mr-1" />Pending</Badge>
                  <button
                    onClick={() => handle(req.id, 'approve')}
                    disabled={processing[req.id]}
                    className="h-9 px-4 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <CheckCircle2 size={14} /> Approve
                  </button>
                  <button
                    onClick={() => handle(req.id, 'reject')}
                    disabled={processing[req.id]}
                    className="h-9 px-4 border border-red-200 text-red-600 text-xs font-medium rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <XCircle size={14} /> Reject
                  </button>
                </div>
              </div>
            </div>
          </Reveal>
        )
      })}
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
      .then(res => setReviews(res?.data?.reviews ?? []))
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
        const authorName = review.isAnonymous
          ? 'Anonymous Verified Employee'
          : (review.employee?.user?.fullName ?? review.employee?.fullName ?? 'Employee')
        return (
          <Reveal key={review.id} delay={i * 0.05}>
            <div className="bg-white rounded-2xl border border-navy-100/50 p-5 hover:border-navy-200 transition-all">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <p className="text-sm font-semibold text-navy-900">{authorName}</p>
                  <p className="text-xs text-navy-400 mt-0.5">
                    {new Date(review.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <StarRating value={review.rating} readOnly size="sm" />
              </div>
              <p className="text-sm text-navy-600 leading-relaxed">{review.reviewText}</p>
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

/* ─── Settings Tab ─── */
function SettingsTab({ companyId, onNameChange }) {
  const [form, setForm] = useState({ name: '', location: '', description: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

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








