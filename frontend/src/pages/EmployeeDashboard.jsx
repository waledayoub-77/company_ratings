import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
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
  ChevronDown,
  Calendar,
  Plus,
  Award,
  Search,
  AlertCircle,
  Trash2,
  Edit2,
  Flag,
} from 'lucide-react'
import PageHeader from '../components/ui/PageHeader.jsx'
import StarRating from '../components/ui/StarRating.jsx'
import Badge from '../components/ui/Badge.jsx'
import Reveal from '../components/ui/Reveal.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { getMyReviews, updateReview, deleteReview } from '../api/reviews.js'
import { getMyEmployments, requestEmployment, endEmployment, cancelEmployment } from '../api/employments.js'
import { getFeedbackReceived, reportFeedback } from '../api/feedback.js'
import { getCompanies } from '../api/companies.js'

const statusConfig = {
  approved: { icon: CheckCircle2, color: 'text-emerald-500', badge: 'success', label: 'Verified' },
  pending:  { icon: Loader2,      color: 'text-amber-500',   badge: 'warning', label: 'Pending'  },
  rejected: { icon: XCircle,      color: 'text-red-500',     badge: 'danger',  label: 'Rejected' },
}

const gradients = [
  'from-indigo-500 to-violet-600',
  'from-navy-500 to-navy-700',
  'from-cyan-500 to-blue-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
]

export default function EmployeeDashboard() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [employments, setEmployments] = useState([])
  const [reviews, setReviews] = useState([])
  const [feedback, setFeedback] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getMyEmployments(), getMyReviews(), getFeedbackReceived()])
      .then(([empRes, revRes, fbRes]) => {
        setEmployments(empRes?.data ?? [])
        setReviews(revRes?.reviews ?? revRes?.data ?? [])
        setFeedback(fbRes?.data ?? [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const refetchEmployments = useCallback(async () => {
    const res = await getMyEmployments()
    setEmployments(res?.data ?? [])
  }, [])

  const refetchReviews = useCallback(async () => {
    const res = await getMyReviews()
    setReviews(res?.reviews ?? res?.data ?? [])
  }, [])

  const firstName = user?.full_name?.split(' ')[0] ?? user?.fullName?.split(' ')[0] ?? 'there'

  const tabs = [
    { id: 'overview',   label: 'Overview'   },
    { id: 'employment', label: 'Employment' },
    { id: 'reviews',    label: 'My Reviews' },
    { id: 'feedback',   label: 'Feedback'   },
  ]

  return (
    <div className="min-h-screen bg-ice-50">
      <PageHeader
        tag="Dashboard"
        title={`Welcome back, ${firstName}`}
        subtitle="Manage your reviews, employment records, and peer feedback."
        backHref
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

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-navy-300" />
          </div>
        ) : (
          <>
            {activeTab === 'overview'   && <OverviewTab   user={user} employments={employments} reviews={reviews} feedback={feedback} />}
            {activeTab === 'employment' && <EmploymentTab employments={employments} refetch={refetchEmployments} />}
            {activeTab === 'reviews'    && <ReviewsTab    reviews={reviews} employments={employments} refetch={refetchReviews} />}
            {activeTab === 'feedback'   && <FeedbackTab   feedback={feedback} />}
          </>
        )}
      </div>
    </div>
  )
}

/* ─── Overview Tab ─── */
function OverviewTab({ user, employments, reviews, feedback }) {
  const approvedEmployments = employments.filter(e => (e.verification_status ?? e.status) === 'approved')
  const verifiedCount = approvedEmployments.length

  // IDs of companies the employee is actually approved at
  const approvedCompanyIds = new Set(
    approvedEmployments.map(e => e.company_id ?? e.companyId)
  )

  // Quick lookup: companyId → company name (only approved employments)
  const companyNameMap = Object.fromEntries(
    approvedEmployments.map(e => [
      e.company_id ?? e.companyId,
      e.companies?.name ?? e.company_name ?? e.companyName ?? 'a company'
    ])
  )

  // Lookup for ALL employments (used by activity feed)
  const allCompanyNameMap = Object.fromEntries(
    employments.map(e => [
      e.company_id ?? e.companyId,
      e.companies?.name ?? e.company_name ?? e.companyName ?? 'a company'
    ])
  )

  // Filter reviews to only those written for approved companies
  const approvedReviews = reviews.filter(r =>
    approvedCompanyIds.has(r.company_id ?? r.companyId)
  )

  // Filter feedback to only those received in the context of approved companies
  const approvedFeedback = feedback.filter(fb =>
    approvedCompanyIds.size === 0
      ? false
      : approvedCompanyIds.has(fb.company_id ?? fb.companyId) || fb.company_id == null
  )

  const avgScore = approvedFeedback.length === 0 ? '—' : (() => {
    const sum = approvedFeedback.reduce((acc, fb) => {
      const avg = ((fb.professionalism || 0) + (fb.communication || 0) + (fb.teamwork || 0) + (fb.reliability || 0)) / 4
      return acc + avg
    }, 0)
    return (sum / approvedFeedback.length).toFixed(1)
  })()

  const stats = [
    { label: 'Verified Employments', value: String(verifiedCount),          icon: Building2,     color: 'text-navy-500'    },
    { label: 'Reviews Written',       value: String(approvedReviews.length), icon: PenSquare,     color: 'text-amber-500'   },
    { label: 'Feedback Received',     value: String(approvedFeedback.length),icon: MessageSquare, color: 'text-emerald-500' },
    { label: 'Avg. Feedback Score',   value: avgScore,                       icon: Award,         color: 'text-violet-500'  },
  ]

  return (
    <div className="space-y-6">
      {/* Quick stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
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
            to="/feedback"
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
          {(() => {
            const fmtDate = d => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''

            // Build a unified list of activity events
            const activities = []

            employments.forEach(emp => {
              const name = emp.companies?.name ?? emp.company_name ?? emp.companyName ?? 'a company'
              const status = emp.verification_status ?? emp.status
              const isCurrent = emp.is_current !== false

              if (status === 'approved') {
                // Always add a "Verified" event
                activities.push({
                  key: `emp-approved-${emp.id ?? emp.company_id}`,
                  Icon: Building2,
                  color: 'text-emerald-500',
                  label: `Verified at ${name}`,
                  date: emp.verified_at ?? emp.updated_at ?? emp.created_at,
                })
                // If employment was later ended, also add an "Ended" event
                if (!isCurrent) {
                  const endD = emp.end_date ?? emp.endDate
                  activities.push({
                    key: `emp-ended-${emp.id ?? emp.company_id}`,
                    Icon: XCircle,
                    color: 'text-orange-400',
                    label: `Ended employment at ${name}`,
                    date: endD ?? emp.updated_at ?? emp.created_at,
                    sublabel: endD ? `End date: ${fmtDate(endD)}` : null,
                  })
                }
              } else if (status === 'pending') {
                activities.push({
                  key: `emp-pending-${emp.id ?? emp.company_id}`,
                  Icon: Loader2,
                  color: 'text-amber-500',
                  label: `Verification request sent to ${name}`,
                  date: emp.created_at ?? emp.createdAt,
                })
              } else if (status === 'rejected') {
                activities.push({
                  key: `emp-rejected-${emp.id ?? emp.company_id}`,
                  Icon: XCircle,
                  color: 'text-red-400',
                  label: `Verification rejected at ${name}`,
                  date: emp.updated_at ?? emp.created_at,
                })
              }
            })

            reviews.forEach((r, i) => {
              const name = r.companies?.name ?? r.company_name ?? r.companyName ?? allCompanyNameMap[r.company_id ?? r.companyId] ?? 'a company'
              activities.push({
                key: `review-${r.id ?? i}`,
                Icon: PenSquare,
                color: 'text-amber-500',
                label: `You reviewed ${name}`,
                date: r.created_at ?? r.createdAt,
              })
            })

            feedback.forEach((fb, i) => {
              const fbCompany = allCompanyNameMap[fb.company_id ?? fb.companyId]
              activities.push({
                key: `fb-${fb.id ?? i}`,
                Icon: MessageSquare,
                color: 'text-navy-500',
                label: `New peer feedback received${fbCompany ? ` at ${fbCompany}` : ''}`,
                date: fb.created_at ?? fb.createdAt,
              })
            })

            // Sort newest first
            activities.sort((a, b) => new Date(b.date) - new Date(a.date))
            const recent = activities.slice(0, 7)

            if (recent.length === 0) {
              return <p className="text-sm text-navy-400">No activity yet. Once a company approves you or you write a review, your activity will appear here.</p>
            }

            return (
              <div className="space-y-4">
                {recent.map(({ key, Icon, color, label, date, sublabel }) => (
                  <div key={key} className="flex items-start gap-3 py-1">
                    <Icon size={16} className={`${color} mt-0.5 shrink-0`} />
                    <div>
                      <p className="text-sm text-navy-700">{label}</p>
                      <p className="text-xs text-navy-400 mt-0.5">
                        {sublabel ? sublabel : fmtDate(date)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )
          })()}
        </div>
      </Reveal>
    </div>
  )
}

/* ─── Employment Tab ─── */
function EmploymentTab({ employments, refetch }) {
  const [showRequest, setShowRequest] = useState(false)
  const [endingId, setEndingId] = useState(null)
  const [endingDate, setEndingDate] = useState('')
  const [endError, setEndError] = useState('')
  const [endSubmitting, setEndSubmitting] = useState(false)
  const [discardingId, setDiscardingId] = useState(null)
  const [discardSubmitting, setDiscardSubmitting] = useState(false)
  const [discardError, setDiscardError] = useState('')
  const [companySearch, setCompanySearch] = useState('')
  const [companyResults, setCompanyResults] = useState([])
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const [selectedCompany, setSelectedCompany] = useState(null)
  const [position, setPosition] = useState('')
  const [department, setDepartment] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')
  const [loadingCompanies, setLoadingCompanies] = useState(false)
  const searchTimeout = useRef(null)
  const comboRef = useRef(null)
  const inputRef = useRef(null)
  const listRef = useRef(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handleOutside(e) {
      if (comboRef.current && !comboRef.current.contains(e.target)) {
        setDropdownOpen(false)
        setFocusedIndex(-1)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  const fetchCompanies = useCallback(async (query = '') => {
    setLoadingCompanies(true)
    try {
      const res = await getCompanies({ ...(query.trim() ? { search: query } : {}), limit: 8 })
      setCompanyResults(res?.data ?? [])
    } catch { setCompanyResults([]) }
    finally { setLoadingCompanies(false) }
  }, [])

  const openDropdown = useCallback((query = companySearch) => {
    setDropdownOpen(true)
    setFocusedIndex(-1)
    fetchCompanies(query)
  }, [companySearch, fetchCompanies])

  const handleCompanySearch = (val) => {
    setCompanySearch(val)
    setSelectedCompany(null)
    setFocusedIndex(-1)
    clearTimeout(searchTimeout.current)
    setDropdownOpen(true)
    searchTimeout.current = setTimeout(() => fetchCompanies(val), 250)
  }

  const selectCompany = (company) => {
    setSelectedCompany(company)
    setCompanySearch(company.name)
    setDropdownOpen(false)
    setFocusedIndex(-1)
    setCompanyResults([])
  }

  const handleKeyDown = (e) => {
    if (!dropdownOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') { e.preventDefault(); openDropdown(); return }
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setFocusedIndex(i => Math.min(i + 1, companyResults.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setFocusedIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (focusedIndex >= 0 && companyResults[focusedIndex]) selectCompany(companyResults[focusedIndex])
    } else if (e.key === 'Escape') {
      setDropdownOpen(false)
      setFocusedIndex(-1)
    }
  }

  // Scroll focused item into view
  useEffect(() => {
    if (focusedIndex >= 0 && listRef.current) {
      const item = listRef.current.children[focusedIndex]
      item?.scrollIntoView({ block: 'nearest' })
    }
  }, [focusedIndex])

  const handleEndEmployment = async (id) => {
    setEndError('')
    setEndSubmitting(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      await endEmployment(id, { endDate: endingDate || today })
      setEndingId(null)
      setEndingDate('')
      await refetch()
    } catch (err) {
      setEndError(err?.message ?? 'Failed to end employment.')
    } finally {
      setEndSubmitting(false)
    }
  }

  const handleCancelEmployment = async (id) => {
    setDiscardError('')
    setDiscardSubmitting(true)
    try {
      await cancelEmployment(id)
      setDiscardingId(null)
      await refetch()
    } catch (err) {
      setDiscardError(err?.message ?? 'Failed to cancel request.')
    } finally {
      setDiscardSubmitting(false)
    }
  }

  const handleSubmitRequest = async () => {    if (!selectedCompany) { setFormError('Please select a company from the list.'); return }
    if (!position.trim()) { setFormError('Position is required.'); return }
    if (!startDate)        { setFormError('Start date is required.'); return }
    setFormError('')
    setSubmitting(true)
    try {
      await requestEmployment({
        companyId: selectedCompany.id,
        position: position.trim(),
        ...(department.trim() ? { department: department.trim() } : {}),
        startDate,
        ...(endDate ? { endDate } : {}),
      })
      setFormSuccess('Request submitted! The company admin will review it shortly.')
      setShowRequest(false)
      setSelectedCompany(null)
      setCompanySearch('')
      setCompanyResults([])
      setDropdownOpen(false)
      setPosition('')
      setDepartment('')
      setStartDate('')
      setEndDate('')
      await refetch()
    } catch (err) {
      setFormError(err?.message ?? 'Failed to submit request. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const hasApproved = employments.some(e => (e.verification_status ?? e.status) === 'approved' && e.is_current !== false)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-navy-900">Employment History</h2>
        {!hasApproved && (
          <button
            onClick={() => { setShowRequest(!showRequest); setFormError(''); setFormSuccess('') }}
            className="h-10 px-5 bg-navy-900 text-white text-sm font-medium rounded-xl inline-flex items-center gap-2 hover:bg-navy-800 transition-all"
          >
            <Plus size={15} />
            Request Verification
          </button>
        )}
      </div>

      {formSuccess && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl px-4 py-3">
          <CheckCircle2 size={15} />
          {formSuccess}
        </div>
      )}

      {/* New verification request form */}
      {showRequest && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-navy-200 p-6"
        >
          <h3 className="text-sm font-semibold text-navy-900 mb-4">Request Employment Verification</h3>
          {formError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl px-3 py-2 mb-4">
              <AlertCircle size={13} />
              {formError}
            </div>
          )}
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Company combobox */}
            <div className="space-y-1.5 relative" ref={comboRef}>
              <label className="block text-[13px] font-medium text-navy-700">Company *</label>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400 pointer-events-none" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Type to search or press ↓ to browse..."
                  value={companySearch}
                  onChange={(e) => handleCompanySearch(e.target.value)}
                  onFocus={() => { if (!dropdownOpen) openDropdown() }}
                  onKeyDown={handleKeyDown}
                  autoComplete="off"
                  className="w-full h-10 rounded-xl border border-navy-200 bg-white pl-8 pr-9 text-sm placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 transition-all"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => {
                    if (dropdownOpen) { setDropdownOpen(false); setFocusedIndex(-1) }
                    else { openDropdown(); inputRef.current?.focus() }
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-600 transition-colors"
                >
                  <ChevronDown size={15} className={`transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>
              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="absolute z-20 w-full bg-white border border-navy-100 rounded-xl shadow-xl overflow-hidden"
                    style={{ maxHeight: 220 }}
                  >
                    {loadingCompanies ? (
                      <div className="px-4 py-3 text-sm text-navy-400 text-center flex items-center justify-center gap-2">
                        <Loader2 size={13} className="animate-spin" />
                        Loading companies…
                      </div>
                    ) : companyResults.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-navy-400 text-center flex items-center justify-center gap-2">
                        <Search size={13} />
                        No companies found{companySearch.trim() ? ` for "${companySearch.trim()}"` : ''}
                      </div>
                    ) : (
                      <div ref={listRef} className="overflow-y-auto" style={{ maxHeight: 220 }}>
                        {companyResults.map((c, idx) => (
                          <button
                            key={c.id}
                            type="button"
                            onMouseDown={(e) => { e.preventDefault(); selectCompany(c) }}
                            onMouseEnter={() => setFocusedIndex(idx)}
                            className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2 ${
                              idx === focusedIndex ? 'bg-navy-50 text-navy-900' : 'text-navy-700 hover:bg-navy-50'
                            }`}
                          >
                            <Building2 size={13} className="text-navy-400 shrink-0" />
                            <span className="font-medium">{c.name}</span>
                            {c.industry && <span className="text-xs text-navy-400 ml-auto shrink-0">{c.industry}</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="space-y-1.5">
              <label className="block text-[13px] font-medium text-navy-700">Position *</label>
              <input
                type="text"
                placeholder="Your job title"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="w-full h-10 rounded-xl border border-navy-200 bg-white px-4 text-sm placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[13px] font-medium text-navy-700">Department</label>
              <input
                type="text"
                placeholder="e.g. Engineering"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full h-10 rounded-xl border border-navy-200 bg-white px-4 text-sm placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 transition-all"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-[13px] font-medium text-navy-700">Start Date *</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full h-10 rounded-xl border border-navy-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[13px] font-medium text-navy-700">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full h-10 rounded-xl border border-navy-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 transition-all"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-5">
            <button
              onClick={handleSubmitRequest}
              disabled={submitting}
              className="h-10 px-5 bg-navy-900 text-white text-sm font-medium rounded-xl hover:bg-navy-800 transition-all disabled:opacity-50 inline-flex items-center gap-2"
            >
              {submitting && <Loader2 size={14} className="animate-spin" />}
              Submit Request
            </button>
            <button
              onClick={() => { setShowRequest(false); setFormError('') }}
              className="h-10 px-5 text-sm text-navy-500 hover:text-navy-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      )}

      {/* Employment cards */}
      {employments.length === 0 ? (
        <div className="text-center py-12 text-navy-400">
          <Building2 size={32} className="mx-auto mb-3 text-navy-200" />
          <p className="text-sm">No employment records yet. Request your first verification above.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {employments.map((emp, i) => {
            const config    = statusConfig[emp.verification_status ?? emp.status] ?? statusConfig.pending
            const gradient  = gradients[i % gradients.length]
            const name      = emp.companies?.name ?? emp.company_name ?? emp.companyName ?? 'Company'
            const dept      = emp.department ?? emp.dept ?? ''
            const startRaw  = emp.start_date ?? emp.startDate
            const endRaw    = emp.end_date   ?? emp.endDate
            return (
              <Reveal key={emp.id} delay={i * 0.08}>
                <div className="bg-white rounded-2xl border border-navy-100/50 p-6 hover:border-navy-200 transition-all">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0`}>
                      <Building2 size={22} className="text-white" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-navy-900">{name}</h3>
                          <p className="text-sm text-navy-500 mt-0.5">{emp.position}{dept ? ` · ${dept}` : ''}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={config.badge}>{config.label}</Badge>
                          {(emp.verification_status ?? emp.status) === 'approved' && emp.is_current === false && (
                            <Badge variant="danger">Ended</Badge>
                          )}
                          {(emp.verification_status ?? emp.status) === 'approved' && emp.is_current && (
                            <button
                              onClick={() => {
                                setEndingId(endingId === emp.id ? null : emp.id)
                                setEndError('')
                                setEndingDate('')
                              }}
                              className="text-xs text-red-400 hover:text-red-600 font-medium transition-colors"
                            >
                              End
                            </button>
                          )}
                          {(emp.verification_status ?? emp.status) === 'pending' && (
                            <button
                              onClick={() => {
                                setDiscardingId(discardingId === emp.id ? null : emp.id)
                                setDiscardError('')
                              }}
                              className="text-xs text-red-400 hover:text-red-600 font-medium transition-colors"
                            >
                              Discard
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-3 text-xs text-navy-400">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {startRaw ? new Date(startRaw).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—'}
                          {' — '}
                          {endRaw ? new Date(endRaw).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Present'}
                        </span>
                        {emp.is_current && (
                          <span className="flex items-center gap-1 text-emerald-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Current
                          </span>
                        )}
                        {!emp.is_current && (emp.verification_status ?? emp.status) === 'approved' && (
                          <span className="flex items-center gap-1 text-red-500">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                            Ended
                          </span>
                        )}
                      </div>
                      {emp.rejection_note && (
                        <p className="mt-2 text-xs text-red-500">Reason: {emp.rejection_note}</p>
                      )}
                      {/* Inline end-employment confirmation */}
                      <AnimatePresence>
                        {endingId === emp.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-4 pt-4 border-t border-navy-100 space-y-3">
                              <p className="text-xs font-semibold text-navy-700">End employment at {name}?</p>
                              <p className="text-xs text-navy-400">This will mark you as no longer current at this company. You will no longer be able to give or receive feedback here.</p>
                              {endError && (
                                <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                                  <AlertCircle size={12} />{endError}
                                </div>
                              )}
                              <div className="flex items-center gap-3">
                                <div className="space-y-1">
                                  <label className="block text-[11px] font-medium text-navy-600">End date (leave blank for today)</label>
                                  <input
                                    type="date"
                                    value={endingDate}
                                    max={new Date().toISOString().split('T')[0]}
                                    onChange={e => setEndingDate(e.target.value)}
                                    className="h-9 rounded-xl border border-navy-200 bg-white px-3 text-xs focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 transition-all"
                                  />
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleEndEmployment(emp.id)}
                                  disabled={endSubmitting}
                                  className="h-8 px-4 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition-all disabled:opacity-50 inline-flex items-center gap-1.5"
                                >
                                  {endSubmitting ? <Loader2 size={11} className="animate-spin" /> : null}
                                  Confirm End
                                </button>
                                <button
                                  onClick={() => { setEndingId(null); setEndError('') }}
                                  className="h-8 px-4 text-xs text-navy-500 hover:text-navy-700 transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      {/* Inline discard confirmation */}
                      <AnimatePresence>
                        {discardingId === emp.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-4 pt-4 border-t border-navy-100 space-y-3">
                              <p className="text-xs font-semibold text-navy-700">Cancel request at {name}?</p>
                              <p className="text-xs text-navy-400">This will permanently remove your pending verification request. You can submit a new one at any time.</p>
                              {discardError && (
                                <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                                  <AlertCircle size={12} />{discardError}
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleCancelEmployment(emp.id)}
                                  disabled={discardSubmitting}
                                  className="h-8 px-4 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition-all disabled:opacity-50 inline-flex items-center gap-1.5"
                                >
                                  {discardSubmitting ? <Loader2 size={11} className="animate-spin" /> : null}
                                  Confirm Discard
                                </button>
                                <button
                                  onClick={() => { setDiscardingId(null); setDiscardError('') }}
                                  className="h-8 px-4 text-xs text-navy-500 hover:text-navy-700 transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </Reveal>
            )
          })}
          {hasApproved && (
            <p className="flex items-center gap-1.5 text-sm text-navy-400 mt-2">
              <AlertCircle size={13} className="shrink-0" />
              You are currently verified at a company. You can only belong to one company at a time.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

/* ─── Reviews Tab ─── */
function ReviewsTab({ reviews, employments = [], refetch }) {
  const [editingId, setEditingId] = useState(null)
  const [editRating, setEditRating] = useState(0)
  const [editText, setEditText] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [error, setError] = useState('')

  const handleEditStart = (review) => {
    setEditingId(review.id)
    setEditRating(review.overall_rating ?? review.rating ?? 0)
    setEditText(review.content ?? review.review_text ?? review.reviewText ?? '')
    setError('')
  }

  const handleEditSave = async (id) => {
    setSaving(true)
    setError('')
    try {
      await updateReview(id, { overallRating: editRating, content: editText })
      setEditingId(null)
      await refetch()
    } catch (err) {
      setError(err?.message ?? 'Failed to update review.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    setDeleting(id)
    try {
      await deleteReview(id)
      setConfirmDeleteId(null)
      await refetch()
    } catch (err) {
      setError(err?.message ?? 'Failed to delete review.')
    } finally {
      setDeleting(null)
    }
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-16">
        <PenSquare size={32} className="mx-auto mb-3 text-navy-200" />
        <p className="text-sm text-navy-400 mb-4">You haven't written any reviews yet.</p>
        <Link
          to="/companies"
          className="h-10 px-5 bg-navy-900 text-white text-sm font-medium rounded-xl inline-flex items-center gap-2 hover:bg-navy-800 transition-all"
        >
          Browse Companies
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-navy-900 mb-2">My Reviews</h2>
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl px-3 py-2">
          <AlertCircle size={13} />
          {error}
        </div>
      )}
      {reviews.map((review, i) => {
        const companyName  = review.companies?.name ?? review.company_name ?? review.companyName ?? 'Company'
        const reviewText   = review.content ?? review.review_text ?? review.reviewText ?? ''
        const isAnon       = review.is_anonymous ?? review.isAnonymous ?? false
        const createdAt    = review.created_at   ?? review.createdAt
        const canEditUntil = review.can_edit_until ?? review.canEditUntil
        // Also block editing if the employee has ended their employment at this company
        const isStillEmployed = employments.some(
          e => e.company_id === review.company_id &&
               (e.verification_status ?? e.status) === 'approved' &&
               e.is_current !== false
        )
        const canEdit      = canEditUntil && new Date(canEditUntil) > new Date() && isStillEmployed
        const hoursLeft    = canEditUntil ? Math.max(0, Math.round((new Date(canEditUntil) - new Date()) / 3600000)) : 0
        const isEditing    = editingId === review.id

        return (
          <Reveal key={review.id} delay={i * 0.08}>
            <div className="bg-white rounded-2xl border border-navy-100/50 p-6 hover:border-navy-200 transition-all">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-navy-900">{companyName}</h3>
                    <StarRating rating={editRating} size={18} interactive onChange={setEditRating} />
                  </div>
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="w-full h-36 rounded-xl border border-navy-200 px-4 py-3 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 resize-none"
                  />
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleEditSave(review.id)}
                      disabled={saving || editText.length < 50}
                      className="h-9 px-4 bg-navy-900 text-white text-xs font-medium rounded-xl hover:bg-navy-800 transition-all disabled:opacity-50 inline-flex items-center gap-1.5"
                    >
                      {saving && <Loader2 size={12} className="animate-spin" />}
                      Save Changes
                    </button>
                    <button onClick={() => setEditingId(null)} className="h-9 px-4 text-xs text-navy-500 hover:text-navy-700 transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-navy-900">{companyName}</h3>
                        {isAnon && <Badge variant="info">Anonymous</Badge>}
                        {canEdit && <Badge variant="warning">Editable</Badge>}
                      </div>
                      {createdAt && (
                        <p className="text-xs text-navy-400 mt-1">
                          Submitted {new Date(createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                    <StarRating rating={review.rating} size={14} />
                  </div>
                  <p className="mt-3 text-sm text-navy-600 leading-relaxed">{reviewText}</p>
                  <div className="mt-4 pt-3 border-t border-navy-50 flex items-center justify-between">
                    {canEdit ? (
                      <span className="flex items-center gap-1.5 text-xs text-amber-600">
                        <Clock size={12} />
                        Edit window: {hoursLeft} hour{hoursLeft !== 1 ? 's' : ''} remaining
                      </span>
                    ) : (
                      <span className="text-xs text-navy-300">Edit window closed</span>
                    )}
                    <div className="flex items-center gap-3">
                      {canEdit && (
                        <button
                          onClick={() => handleEditStart(review)}
                          className="flex items-center gap-1 text-xs font-medium text-navy-700 hover:text-navy-900 transition-colors"
                        >
                          <Edit2 size={12} />
                          Edit
                        </button>
                      )}
                      <button
                        onClick={() => setConfirmDeleteId(confirmDeleteId === review.id ? null : review.id)}
                        disabled={deleting === review.id}
                        className="flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
                      >
                        {deleting === review.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                        Delete
                      </button>
                    </div>
                  </div>
                  {/* Inline delete confirmation */}
                  {confirmDeleteId === review.id && (
                    <div className="mt-3 bg-red-50 border border-red-200 rounded-xl p-3 flex items-center justify-between">
                      <p className="text-xs text-red-700">Are you sure you want to delete this review?</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDelete(review.id)}
                          disabled={deleting === review.id}
                          className="h-7 px-3 bg-red-600 text-white text-[11px] font-medium rounded-md hover:bg-red-700 disabled:opacity-50"
                        >
                          {deleting === review.id ? 'Deleting…' : 'Yes, Delete'}
                        </button>
                        <button onClick={() => setConfirmDeleteId(null)} className="h-7 px-3 text-[11px] text-navy-500 hover:text-navy-700">Cancel</button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </Reveal>
        )
      })}
    </div>
  )
}

/* ─── Feedback Tab ─── */
function FeedbackTab({ feedback }) {
  const [reportingId, setReportingId] = useState(null)
  const [reportReason, setReportReason] = useState('')
  const [reportDescription, setReportDescription] = useState('')
  const [reportSubmitting, setReportSubmitting] = useState(false)
  const [reportSuccess, setReportSuccess] = useState(null)
  const [reportError, setReportError] = useState('')

  const openReport = (id) => {
    setReportingId(id)
    setReportReason('')
    setReportDescription('')
    setReportSuccess(null)
    setReportError('')
  }

  const handleReport = async (fbId) => {
    if (!reportReason) { setReportError('Please select a reason.'); return }
    if (reportDescription.trim().length < 10) { setReportError('Please provide at least 10 characters.'); return }
    setReportSubmitting(true)
    setReportError('')
    try {
      await reportFeedback(fbId, { reason: reportReason, description: reportDescription.trim() })
      setReportSuccess(fbId)
      setReportingId(null)
    } catch (err) {
      setReportError(err?.message ?? 'Failed to submit report.')
    } finally {
      setReportSubmitting(false)
    }
  }

  if (feedback.length === 0) {
    return (
      <div className="text-center py-16">
        <MessageSquare size={32} className="mx-auto mb-3 text-navy-200" />
        <p className="text-sm text-navy-400">No feedback received yet.</p>
      </div>
    )
  }

  const avg = (key) => {
    const vals = feedback.map(fb => fb[key]).filter(Boolean)
    if (!vals.length) return '—'
    return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)
  }

  const categoryAverages = [
    { label: 'Professionalism', value: avg('professionalism') },
    { label: 'Communication',   value: avg('communication')   },
    { label: 'Teamwork',        value: avg('teamwork')        },
    { label: 'Reliability',     value: avg('reliability')     },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-navy-900">Feedback Received</h2>
        <Link
          to="/feedback"
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
            {categoryAverages.map(cat => (
              <div key={cat.label} className="text-center p-4 rounded-xl bg-navy-50/50">
                <p className="text-2xl font-serif font-bold text-navy-900">{cat.value}</p>
                <p className="text-xs text-navy-500 mt-1">{cat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      {/* Individual feedback entries */}
      <div className="space-y-3">
        {feedback.map((fb, i) => {
          const giver    = fb.reviewer?.full_name ?? fb.giver_name ?? fb.from_employee?.full_name ?? 'A colleague'
          const initials = giver.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
          const quarter  = fb.quarter_year ?? fb.quarterYear ?? ''
          const overall  = Math.round(((fb.professionalism || 0) + (fb.communication || 0) + (fb.teamwork || 0) + (fb.reliability || 0)) / 4 * 10) / 10
          const isReporting = reportingId === fb.id
          const wasReported = reportSuccess === fb.id

          return (
            <Reveal key={fb.id ?? i} delay={i * 0.08}>
              <div className="bg-white rounded-2xl border border-navy-100/50 p-5 hover:border-navy-200 transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-navy-500 to-navy-700 flex items-center justify-center shrink-0">
                      <span className="text-white text-xs font-semibold">{initials}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-navy-900">{giver}</p>
                      {quarter && <p className="text-xs text-navy-400">{quarter}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <Star size={14} className="fill-amber-400 text-amber-400" />
                      <span className="text-sm font-bold text-navy-900">{overall}</span>
                    </div>
                    {wasReported ? (
                      <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                        <CheckCircle2 size={12} /> Reported
                      </span>
                    ) : (
                      <button
                        onClick={() => isReporting ? setReportingId(null) : openReport(fb.id)}
                        className={`flex items-center gap-1 text-xs font-medium transition-colors ${
                          isReporting ? 'text-red-600' : 'text-navy-400 hover:text-red-500'
                        }`}
                        title="Report this feedback"
                      >
                        <Flag size={12} />
                        {isReporting ? 'Cancel' : 'Report'}
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-4 gap-2">
                  {[
                    { key: 'professionalism', label: 'Pro.'  },
                    { key: 'communication',   label: 'Com.'  },
                    { key: 'teamwork',        label: 'Team'  },
                    { key: 'reliability',     label: 'Rel.'  },
                  ].map(cat => (
                    <div key={cat.key} className="text-center bg-navy-50/50 rounded-lg py-2">
                      <p className="text-sm font-bold text-navy-900">{fb[cat.key] ?? '—'}</p>
                      <p className="text-[10px] text-navy-400">{cat.label}</p>
                    </div>
                  ))}
                </div>

                {fb.written_feedback && (
                  <p className="mt-3 text-xs text-navy-500 leading-relaxed italic">"{fb.written_feedback}"</p>
                )}

                {/* Inline report form */}
                <AnimatePresence>
                  {isReporting && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 pt-4 border-t border-navy-100 space-y-3">
                        <p className="text-xs font-semibold text-navy-700">Report this feedback</p>
                        {reportError && (
                          <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                            <AlertCircle size={12} />{reportError}
                          </div>
                        )}
                        <div className="grid sm:grid-cols-2 gap-3">
                          <select
                            value={reportReason}
                            onChange={e => setReportReason(e.target.value)}
                            className="h-9 rounded-xl border border-navy-200 bg-white px-3 text-xs text-navy-700 focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 transition-all"
                          >
                            <option value="">Select reason…</option>
                            <option value="harassment">Harassment</option>
                            <option value="false_info">False information</option>
                            <option value="spam">Spam</option>
                            <option value="other">Other</option>
                          </select>
                          <input
                            type="text"
                            placeholder="Describe the issue (10+ chars)"
                            value={reportDescription}
                            onChange={e => setReportDescription(e.target.value)}
                            className="h-9 rounded-xl border border-navy-200 bg-white px-3 text-xs placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 transition-all"
                          />
                        </div>
                        <button
                          onClick={() => handleReport(fb.id)}
                          disabled={reportSubmitting}
                          className="h-8 px-4 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition-all disabled:opacity-50 inline-flex items-center gap-1.5"
                        >
                          {reportSubmitting ? <Loader2 size={11} className="animate-spin" /> : <Flag size={11} />}
                          Submit Report
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Reveal>
          )
        })}
      </div>
    </div>
  )
}
