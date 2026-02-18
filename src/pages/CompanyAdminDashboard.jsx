import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Star,
  Users,
  MessageSquare,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  BarChart3,
  FileText,
  Settings,
  ChevronDown,
  Building2,
  Upload,
  Eye,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart,
} from 'recharts'
import PageHeader from '../components/ui/PageHeader.jsx'
import Badge from '../components/ui/Badge.jsx'
import Reveal from '../components/ui/Reveal.jsx'
import StarRating from '../components/ui/StarRating.jsx'

/* ─── Mock data ─── */
const monthlyReviews = [
  { month: 'Mar', count: 12 }, { month: 'Apr', count: 18 }, { month: 'May', count: 24 },
  { month: 'Jun', count: 20 }, { month: 'Jul', count: 32 }, { month: 'Aug', count: 28 },
  { month: 'Sep', count: 35 }, { month: 'Oct', count: 42 }, { month: 'Nov', count: 38 },
  { month: 'Dec', count: 45 }, { month: 'Jan', count: 52 }, { month: 'Feb', count: 48 },
]

const ratingDistribution = [
  { stars: '5★', count: 180 }, { stars: '4★', count: 98 }, { stars: '3★', count: 41 },
  { stars: '2★', count: 15 }, { stars: '1★', count: 8 },
]

const pendingRequests = [
  { id: 1, name: 'Alice Johnson', email: 'alice@email.com', position: 'UI Designer', dept: 'Design', date: '2026-02-17' },
  { id: 2, name: 'Bob Williams', email: 'bob@email.com', position: 'Data Analyst', dept: 'Analytics', date: '2026-02-16' },
  { id: 3, name: 'Carol Martinez', email: 'carol@email.com', position: 'Product Manager', dept: 'Product', date: '2026-02-15' },
]

const recentReviews = [
  { id: 1, author: 'Anonymous Verified Employee', anonymous: true, rating: 5, date: '2026-02-15', text: 'Incredible work environment. Best company I\'ve worked for.' },
  { id: 2, author: 'Emily Chen', anonymous: false, rating: 4, date: '2026-02-12', text: 'Great company with room for improvement in communication.' },
  { id: 3, author: 'Anonymous Verified Employee', anonymous: true, rating: 5, date: '2026-02-08', text: 'Amazing engineering culture and leadership support.' },
  { id: 4, author: 'Marcus Johnson', anonymous: false, rating: 4, date: '2026-02-03', text: 'Strong engineering culture. Pace can be intense during launches.' },
  { id: 5, author: 'Anonymous Verified Employee', anonymous: true, rating: 3, date: '2026-01-28', text: 'Good overall but could improve on work-life balance.' },
]

const feedbackSummary = [
  { category: 'Professionalism', avg: 4.6, count: 45 },
  { category: 'Communication', avg: 4.2, count: 42 },
  { category: 'Teamwork', avg: 4.5, count: 44 },
  { category: 'Reliability', avg: 4.7, count: 43 },
]

export default function CompanyAdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview')

  const tabs = [
    { id: 'overview', label: 'Analytics', icon: BarChart3 },
    { id: 'requests', label: 'Requests', icon: Users, badge: 3 },
    { id: 'reviews', label: 'Reviews', icon: FileText },
    { id: 'feedback', label: 'Team Feedback', icon: MessageSquare },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-ice-50">
      <PageHeader
        tag="Company Admin"
        title="Stripe Dashboard"
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
              {tab.badge && (
                <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {tab.badge}
                </span>
              )}
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

        {activeTab === 'overview' && <AnalyticsTab />}
        {activeTab === 'requests' && <RequestsTab />}
        {activeTab === 'reviews' && <ReviewsListTab />}
        {activeTab === 'feedback' && <TeamFeedbackTab />}
        {activeTab === 'settings' && <SettingsTab />}
      </div>
    </div>
  )
}

/* ─── Analytics Tab ─── */
function AnalyticsTab() {
  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Reviews', value: '342', change: '+12%', icon: FileText, color: 'text-navy-500' },
          { label: 'Average Rating', value: '4.7', change: '+0.2', icon: Star, color: 'text-amber-500' },
          { label: 'Verified Employees', value: '156', change: '+8', icon: Users, color: 'text-emerald-500' },
          { label: 'Avg Feedback Score', value: '4.5', change: '+0.1', icon: MessageSquare, color: 'text-violet-500' },
        ].map((stat, i) => (
          <Reveal key={stat.label} delay={i * 0.08}>
            <div className="bg-white rounded-2xl border border-navy-100/50 p-5">
              <div className="flex items-center justify-between mb-3">
                <stat.icon size={18} className={stat.color} strokeWidth={1.8} />
                <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  {stat.change}
                </span>
              </div>
              <p className="text-2xl font-serif font-bold text-navy-900">{stat.value}</p>
              <p className="text-xs text-navy-400 mt-1">{stat.label}</p>
            </div>
          </Reveal>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Reveal delay={0.1}>
          <div className="bg-white rounded-2xl border border-navy-100/50 p-6">
            <h3 className="text-sm font-semibold text-navy-900 mb-1">Reviews Over Time</h3>
            <p className="text-xs text-navy-400 mb-6">Monthly review count for the past 12 months</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyReviews}>
                  <defs>
                    <linearGradient id="reviewGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4988C4" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#4988C4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8f2fa" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F2854',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: '#fff',
                      padding: '8px 14px',
                    }}
                  />
                  <Area type="monotone" dataKey="count" stroke="#4988C4" strokeWidth={2} fill="url(#reviewGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="bg-white rounded-2xl border border-navy-100/50 p-6">
            <h3 className="text-sm font-semibold text-navy-900 mb-1">Rating Distribution</h3>
            <p className="text-xs text-navy-400 mb-6">Breakdown by star rating</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ratingDistribution} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8f2fa" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="stars" type="category" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} width={30} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F2854',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: '#fff',
                      padding: '8px 14px',
                    }}
                  />
                  <Bar dataKey="count" fill="#4988C4" radius={[0, 6, 6, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Reveal>
      </div>

      {/* Internal feedback summary */}
      <Reveal delay={0.2}>
        <div className="bg-white rounded-2xl border border-navy-100/50 p-6">
          <h3 className="text-sm font-semibold text-navy-900 mb-1">Internal Feedback Summary</h3>
          <p className="text-xs text-navy-400 mb-6">Average scores across all employee feedback</p>
          <div className="grid sm:grid-cols-4 gap-6">
            {feedbackSummary.map((cat, i) => (
              <div key={cat.category} className="text-center">
                <div className="relative inline-flex items-center justify-center w-20 h-20 mb-3">
                  <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="34" fill="none" stroke="#e8f2fa" strokeWidth="6" />
                    <motion.circle
                      cx="40" cy="40" r="34" fill="none" stroke="#4988C4" strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 34}`}
                      initial={{ strokeDashoffset: 2 * Math.PI * 34 }}
                      whileInView={{ strokeDashoffset: 2 * Math.PI * 34 * (1 - cat.avg / 5) }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: i * 0.15 }}
                    />
                  </svg>
                  <span className="absolute text-lg font-serif font-bold text-navy-900">{cat.avg}</span>
                </div>
                <p className="text-sm font-medium text-navy-900">{cat.category}</p>
                <p className="text-xs text-navy-400 mt-0.5">{cat.count} responses</p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </div>
  )
}

/* ─── Requests Tab ─── */
function RequestsTab() {
  const [requests, setRequests] = useState(pendingRequests)

  const handleAction = (id, action) => {
    setRequests(prev => prev.filter(r => r.id !== id))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold text-navy-900">
          Pending Verification Requests
          <span className="ml-2 text-sm font-normal text-navy-400">({requests.length})</span>
        </h2>
      </div>

      {requests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-navy-100/50 p-12 text-center">
          <CheckCircle2 size={32} className="text-emerald-400 mx-auto mb-3" />
          <p className="text-sm text-navy-500">All caught up! No pending requests.</p>
        </div>
      ) : (
        requests.map((req, i) => (
          <Reveal key={req.id} delay={i * 0.08}>
            <div className="bg-white rounded-2xl border border-navy-100/50 p-6 hover:border-navy-200 transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-navy-400 to-navy-600 flex items-center justify-center shrink-0">
                    <span className="text-white text-sm font-semibold">
                      {req.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-navy-900 text-sm">{req.name}</h3>
                    <p className="text-xs text-navy-400 mt-0.5">{req.position} · {req.dept}</p>
                    <p className="text-xs text-navy-300 mt-0.5">{req.email} · Requested {new Date(req.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:ml-auto">
                  <button
                    onClick={() => handleAction(req.id, 'approve')}
                    className="h-9 px-4 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-1.5"
                  >
                    <CheckCircle2 size={14} />
                    Approve
                  </button>
                  <button
                    onClick={() => handleAction(req.id, 'reject')}
                    className="h-9 px-4 border border-red-200 text-red-600 text-xs font-medium rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1.5"
                  >
                    <XCircle size={14} />
                    Reject
                  </button>
                </div>
              </div>
            </div>
          </Reveal>
        ))
      )}
    </div>
  )
}

/* ─── Reviews List Tab ─── */
function ReviewsListTab() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-navy-900 mb-2">
        Recent Reviews <span className="text-sm font-normal text-navy-400">(Last 10)</span>
      </h2>
      {recentReviews.map((review, i) => (
        <Reveal key={review.id} delay={i * 0.05}>
          <div className="bg-white rounded-2xl border border-navy-100/50 p-5 hover:border-navy-200 transition-all">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  review.anonymous ? 'bg-navy-50' : 'bg-gradient-to-br from-navy-500 to-navy-700'
                }`}>
                  {review.anonymous ? (
                    <Eye size={16} className="text-navy-400" />
                  ) : (
                    <span className="text-white text-xs font-semibold">
                      {review.author.split(' ').map(n => n[0]).join('')}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-navy-900">{review.author}</p>
                  <p className="text-xs text-navy-400">{new Date(review.date).toLocaleDateString()}</p>
                </div>
              </div>
              <StarRating rating={review.rating} size={14} />
            </div>
            <p className="mt-3 text-sm text-navy-600 leading-relaxed">{review.text}</p>
          </div>
        </Reveal>
      ))}
    </div>
  )
}

/* ─── Team Feedback Tab ─── */
function TeamFeedbackTab() {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-navy-900">Team Feedback Overview</h2>

      <Reveal>
        <div className="bg-white rounded-2xl border border-navy-100/50 p-6">
          <h3 className="text-sm font-semibold text-navy-900 mb-6">Company-Wide Feedback Averages</h3>
          <div className="grid sm:grid-cols-4 gap-6">
            {feedbackSummary.map(cat => (
              <div key={cat.category} className="p-4 rounded-xl bg-navy-50/50 text-center">
                <p className="text-3xl font-serif font-bold text-navy-900">{cat.avg}</p>
                <p className="text-xs text-navy-500 mt-1 font-medium">{cat.category}</p>
                <p className="text-[10px] text-navy-400 mt-0.5">{cat.count} responses</p>
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
                As a company admin, you can view all internal feedback exchanged between employees at your company.
                This helps you understand team dynamics and identify areas for improvement.
                You <strong className="text-white">cannot</strong> see the identity of anonymous company reviewers.
              </p>
            </div>
          </div>
        </div>
      </Reveal>
    </div>
  )
}

/* ─── Settings Tab ─── */
function SettingsTab() {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-navy-900">Company Profile Settings</h2>

      <Reveal>
        <div className="bg-white rounded-2xl border border-navy-100/50 p-6">
          <div className="space-y-5">
            {/* Logo upload */}
            <div>
              <label className="block text-[13px] font-medium text-navy-700 mb-2">Company Logo</label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                  <Building2 size={28} className="text-white" />
                </div>
                <div>
                  <button className="h-9 px-4 bg-navy-50 text-navy-700 text-xs font-medium rounded-lg hover:bg-navy-100 transition-colors inline-flex items-center gap-1.5">
                    <Upload size={13} />
                    Upload New Logo
                  </button>
                  <p className="text-[11px] text-navy-400 mt-1">Max 2MB. JPG or PNG only.</p>
                </div>
              </div>
            </div>

            {/* Company name */}
            <div className="space-y-1.5">
              <label className="block text-[13px] font-medium text-navy-700">Company Name</label>
              <input
                type="text"
                defaultValue="Stripe"
                className="w-full h-11 rounded-xl border border-navy-200 bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 transition-all"
              />
            </div>

            {/* Industry */}
            <div className="space-y-1.5">
              <label className="block text-[13px] font-medium text-navy-700">Industry</label>
              <div className="relative">
                <select className="w-full h-11 rounded-xl border border-navy-200 bg-white pl-4 pr-8 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 transition-all cursor-pointer">
                  <option>Fintech</option>
                  <option>Technology</option>
                  <option>Healthcare</option>
                  <option>Finance</option>
                  <option>Education</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400 pointer-events-none" />
              </div>
            </div>

            {/* Location */}
            <div className="space-y-1.5">
              <label className="block text-[13px] font-medium text-navy-700">Location</label>
              <input
                type="text"
                defaultValue="San Francisco, CA"
                className="w-full h-11 rounded-xl border border-navy-200 bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 transition-all"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="block text-[13px] font-medium text-navy-700">Description</label>
              <textarea
                defaultValue="Financial infrastructure for the internet. Building economic tools for businesses worldwide."
                className="w-full h-32 rounded-xl border border-navy-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 transition-all resize-none leading-relaxed"
              />
            </div>

            <button className="h-11 px-6 bg-navy-900 text-white text-sm font-medium rounded-xl hover:bg-navy-800 transition-all shadow-sm">
              Save Changes
            </button>
          </div>
        </div>
      </Reveal>
    </div>
  )
}
