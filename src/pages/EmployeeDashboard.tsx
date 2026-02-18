import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Star,
  Building2,
  PenSquare,
  MessageSquare,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronRight,
  Calendar,
  Briefcase,
  Plus,
  Award,
} from 'lucide-react'
import PageHeader from '../components/ui/PageHeader.tsx'
import StarRating from '../components/ui/StarRating.tsx'
import Badge from '../components/ui/Badge.tsx'
import Reveal from '../components/ui/Reveal.tsx'

/* ─── Mock data ─── */
const user = {
  name: 'John Doe',
  email: 'john@company.com',
  position: 'Software Engineer',
  joinDate: '2025-01-15',
}

const employments = [
  { id: 1, company: 'Stripe', position: 'Software Engineer', dept: 'Engineering', status: 'approved', start: '2024-03-01', end: null, gradient: 'from-indigo-500 to-violet-600' },
  { id: 2, company: 'Notion', position: 'Frontend Developer', dept: 'Product', status: 'approved', start: '2022-06-15', end: '2024-02-28', gradient: 'from-navy-500 to-navy-700' },
  { id: 3, company: 'Linear', position: 'Junior Developer', dept: 'Engineering', status: 'pending', start: '2021-01-10', end: '2022-05-30', gradient: 'from-cyan-500 to-blue-600' },
]

const myReviews = [
  { id: 1, company: 'Stripe', rating: 5, date: '2026-02-10', anonymous: true, text: 'Incredible work-life balance and genuinely supportive leadership...', editable: true },
  { id: 2, company: 'Notion', rating: 4, date: '2025-11-05', anonymous: false, text: 'Great company overall. The product culture is strong...', editable: false },
]

const feedbackReceived = [
  { from: 'Sarah Miller', category: 'Professionalism', score: 5, date: '2026-01-15', quarter: 'Q1 2026' },
  { from: 'James Wilson', category: 'Communication', score: 4, date: '2025-12-20', quarter: 'Q4 2025' },
  { from: 'Priya Patel', category: 'Teamwork', score: 5, date: '2025-12-18', quarter: 'Q4 2025' },
]

const statusConfig = {
  approved: { icon: CheckCircle2, color: 'text-emerald-500', badge: 'success' as const, label: 'Verified' },
  pending: { icon: Loader2, color: 'text-amber-500', badge: 'warning' as const, label: 'Pending' },
  rejected: { icon: XCircle, color: 'text-red-500', badge: 'danger' as const, label: 'Rejected' },
}

export default function EmployeeDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'employment' | 'reviews' | 'feedback'>('overview')

  const tabs = [
    { id: 'overview' as const, label: 'Overview' },
    { id: 'employment' as const, label: 'Employment' },
    { id: 'reviews' as const, label: 'My Reviews' },
    { id: 'feedback' as const, label: 'Feedback' },
  ]

  return (
    <div className="min-h-screen bg-ice-50">
      <PageHeader
        tag="Dashboard"
        title={`Welcome back, ${user.name.split(' ')[0]}`}
        subtitle="Manage your reviews, employment records, and peer feedback."
      />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 pb-20">
        {/* Tabs */}
        <div className="flex items-center gap-1 mb-8 border-b border-navy-100/50 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id ? 'text-navy-900' : 'text-navy-400 hover:text-navy-600'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="dashboardTab"
                  className="absolute bottom-0 left-2 right-2 h-[2px] bg-navy-500 rounded-full"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'employment' && <EmploymentTab />}
        {activeTab === 'reviews' && <ReviewsTab />}
        {activeTab === 'feedback' && <FeedbackTab />}
      </div>
    </div>
  )
}

/* ─── Overview Tab ─── */
function OverviewTab() {
  return (
    <div className="space-y-6">
      {/* Quick stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Verified Employments', value: '2', icon: Building2, color: 'text-navy-500' },
          { label: 'Reviews Written', value: '2', icon: PenSquare, color: 'text-amber-500' },
          { label: 'Feedback Received', value: '3', icon: MessageSquare, color: 'text-emerald-500' },
          { label: 'Avg. Feedback Score', value: '4.7', icon: Award, color: 'text-violet-500' },
        ].map((stat, i) => (
          <Reveal key={stat.label} delay={i * 0.08}>
            <div className="bg-white rounded-2xl border border-navy-100/50 p-5 hover:border-navy-200 transition-all">
              <div className="flex items-center justify-between mb-3">
                <stat.icon size={18} className={stat.color} strokeWidth={1.8} />
                <span className="text-2xl font-serif font-bold text-navy-900">{stat.value}</span>
              </div>
              <p className="text-xs text-navy-400 font-medium">{stat.label}</p>
            </div>
          </Reveal>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Reveal delay={0.1}>
          <Link
            to="/dashboard/feedback"
            className="group flex items-center gap-4 bg-navy-900 rounded-2xl p-6 text-white hover:bg-navy-800 transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
              <MessageSquare size={22} strokeWidth={1.6} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Give Peer Feedback</h3>
              <p className="text-sm text-navy-300 mt-0.5">Rate a coworker's professionalism & teamwork</p>
            </div>
            <ChevronRight size={18} className="text-navy-400 group-hover:translate-x-1 transition-transform" />
          </Link>
        </Reveal>
        <Reveal delay={0.15}>
          <Link
            to="/companies"
            className="group flex items-center gap-4 bg-white rounded-2xl border border-navy-100/50 p-6 hover:border-navy-200 hover:shadow-md transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-navy-50 flex items-center justify-center">
              <PenSquare size={22} className="text-navy-500" strokeWidth={1.6} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-navy-900">Write a Review</h3>
              <p className="text-sm text-navy-400 mt-0.5">Share your experience at a verified company</p>
            </div>
            <ChevronRight size={18} className="text-navy-300 group-hover:translate-x-1 transition-transform" />
          </Link>
        </Reveal>
      </div>

      {/* Recent activity */}
      <Reveal delay={0.2}>
        <div className="bg-white rounded-2xl border border-navy-100/50 p-6">
          <h3 className="text-sm font-semibold text-navy-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {[
              { text: 'Your review at Stripe was published', time: '2 hours ago', icon: CheckCircle2, iconColor: 'text-emerald-500' },
              { text: 'New peer feedback received from Sarah Miller', time: '3 days ago', icon: MessageSquare, iconColor: 'text-navy-500' },
              { text: 'Employment at Stripe verified', time: '1 week ago', icon: Building2, iconColor: 'text-navy-500' },
              { text: 'Linear employment verification pending', time: '2 weeks ago', icon: Clock, iconColor: 'text-amber-500' },
            ].map((activity, i) => (
              <div key={i} className="flex items-start gap-3 py-1">
                <activity.icon size={16} className={`${activity.iconColor} mt-0.5 shrink-0`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-navy-700">{activity.text}</p>
                  <p className="text-xs text-navy-400 mt-0.5">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </div>
  )
}

/* ─── Employment Tab ─── */
function EmploymentTab() {
  const [showRequest, setShowRequest] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-navy-900">Employment History</h2>
        <button
          onClick={() => setShowRequest(!showRequest)}
          className="h-10 px-5 bg-navy-900 text-white text-sm font-medium rounded-xl inline-flex items-center gap-2 hover:bg-navy-800 transition-all"
        >
          <Plus size={15} />
          Request Verification
        </button>
      </div>

      {/* New verification request form */}
      {showRequest && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-navy-200 p-6"
        >
          <h3 className="text-sm font-semibold text-navy-900 mb-4">Request Employment Verification</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[13px] font-medium text-navy-700">Company</label>
              <input
                type="text"
                placeholder="Search company..."
                className="w-full h-10 rounded-xl border border-navy-200 bg-white px-4 text-sm placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[13px] font-medium text-navy-700">Position</label>
              <input
                type="text"
                placeholder="Your job title"
                className="w-full h-10 rounded-xl border border-navy-200 bg-white px-4 text-sm placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[13px] font-medium text-navy-700">Department</label>
              <input
                type="text"
                placeholder="e.g. Engineering"
                className="w-full h-10 rounded-xl border border-navy-200 bg-white px-4 text-sm placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 transition-all"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-[13px] font-medium text-navy-700">Start Date</label>
                <input
                  type="date"
                  className="w-full h-10 rounded-xl border border-navy-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[13px] font-medium text-navy-700">End Date</label>
                <input
                  type="date"
                  className="w-full h-10 rounded-xl border border-navy-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 transition-all"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-5">
            <button className="h-10 px-5 bg-navy-900 text-white text-sm font-medium rounded-xl hover:bg-navy-800 transition-all">
              Submit Request
            </button>
            <button onClick={() => setShowRequest(false)} className="h-10 px-5 text-sm text-navy-500 hover:text-navy-700 transition-colors">
              Cancel
            </button>
          </div>
        </motion.div>
      )}

      {/* Employment cards */}
      <div className="space-y-4">
        {employments.map((emp, i) => {
          const config = statusConfig[emp.status as keyof typeof statusConfig]
          return (
            <Reveal key={emp.id} delay={i * 0.08}>
              <div className="bg-white rounded-2xl border border-navy-100/50 p-6 hover:border-navy-200 transition-all">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${emp.gradient} flex items-center justify-center shrink-0`}>
                    <Building2 size={22} className="text-white" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-navy-900">{emp.company}</h3>
                        <p className="text-sm text-navy-500 mt-0.5">{emp.position} · {emp.dept}</p>
                      </div>
                      <Badge variant={config.badge}>{config.label}</Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-3 text-xs text-navy-400">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(emp.start).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        {' — '}
                        {emp.end ? new Date(emp.end).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Present'}
                      </span>
                      {!emp.end && (
                        <span className="flex items-center gap-1 text-emerald-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Current
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          )
        })}
      </div>
    </div>
  )
}

/* ─── Reviews Tab ─── */
function ReviewsTab() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-navy-900 mb-2">My Reviews</h2>
      {myReviews.map((review, i) => (
        <Reveal key={review.id} delay={i * 0.08}>
          <div className="bg-white rounded-2xl border border-navy-100/50 p-6 hover:border-navy-200 transition-all">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-navy-900">{review.company}</h3>
                  {review.anonymous && <Badge variant="info">Anonymous</Badge>}
                  {review.editable && <Badge variant="warning">Editable</Badge>}
                </div>
                <p className="text-xs text-navy-400 mt-1">
                  Submitted {new Date(review.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <StarRating rating={review.rating} size={14} />
            </div>
            <p className="mt-3 text-sm text-navy-600 leading-relaxed">{review.text}</p>
            {review.editable && (
              <div className="mt-4 pt-3 border-t border-navy-50 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs text-amber-600">
                  <Clock size={12} />
                  Edit window: 46 hours remaining
                </span>
                <button className="text-xs font-medium text-navy-700 hover:text-navy-900 transition-colors">
                  Edit Review
                </button>
              </div>
            )}
          </div>
        </Reveal>
      ))}
    </div>
  )
}

/* ─── Feedback Tab ─── */
function FeedbackTab() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-navy-900">Feedback Received</h2>
        <Link
          to="/dashboard/feedback"
          className="h-10 px-5 bg-navy-900 text-white text-sm font-medium rounded-xl inline-flex items-center gap-2 hover:bg-navy-800 transition-all"
        >
          <MessageSquare size={15} />
          Give Feedback
        </Link>
      </div>

      {/* Avg scores */}
      <Reveal>
        <div className="bg-white rounded-2xl border border-navy-100/50 p-6">
          <h3 className="text-sm font-semibold text-navy-900 mb-4">Your Average Scores</h3>
          <div className="grid sm:grid-cols-4 gap-4">
            {[
              { label: 'Professionalism', value: 4.8 },
              { label: 'Communication', value: 4.5 },
              { label: 'Teamwork', value: 4.7 },
              { label: 'Reliability', value: 4.9 },
            ].map(cat => (
              <div key={cat.label} className="text-center p-4 rounded-xl bg-navy-50/50">
                <p className="text-2xl font-serif font-bold text-navy-900">{cat.value}</p>
                <p className="text-xs text-navy-500 mt-1">{cat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      {/* Individual feedback */}
      <div className="space-y-3">
        {feedbackReceived.map((fb, i) => (
          <Reveal key={i} delay={i * 0.08}>
            <div className="bg-white rounded-2xl border border-navy-100/50 p-5 hover:border-navy-200 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-navy-500 to-navy-700 flex items-center justify-center">
                    <span className="text-white text-xs font-semibold">
                      {fb.from.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-navy-900">{fb.from}</p>
                    <p className="text-xs text-navy-400">{fb.quarter}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-navy-400">{fb.category}</span>
                  <div className="flex items-center gap-1">
                    <Star size={14} className="fill-amber-400 text-amber-400" />
                    <span className="text-sm font-bold text-navy-900">{fb.score}</span>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  )
}
