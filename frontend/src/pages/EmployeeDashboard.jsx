import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
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
  ShieldCheck,
  Trophy,
  Briefcase,
  Download,
} from 'lucide-react'
import PageHeader from '../components/ui/PageHeader.jsx'
import StarRating from '../components/ui/StarRating.jsx'
import Badge from '../components/ui/Badge.jsx'
import Reveal from '../components/ui/Reveal.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { getMyReviews, updateReview, deleteReview } from '../api/reviews.js'
import { getMyEmployments, requestEmployment, endEmployment, cancelEmployment, requestEndEmployment } from '../api/employments.js'
import { getFeedbackReceived, reportFeedback } from '../api/feedback.js'
import { getCompanies } from '../api/companies.js'
import { getCompanyEotmEvents, getEotmNominees, castEotmVote, getCompanyEotmWinners } from '../api/eotm.js'
import { getCompanyEotyEvents, getEotyNominees, castEotyVote, getCompanyEotyWinners } from '../api/eoty.js'
import { useNotification } from '../context/NotificationContext.jsx'
import CertificateModal from '../components/CertificateModal'
import { getMyApplications, getAllJobPositions, applyToJob, acceptHireInvite, rejectHireInvite } from '../api/jobs.js'

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
  const [searchParams] = useSearchParams()
  const validTabs = ['overview', 'employment', 'reviews', 'feedback', 'eotm', 'eoty', 'jobs']
  const initialTab = validTabs.includes(searchParams.get('tab')) ? searchParams.get('tab') : 'overview'
  const [activeTab, setActiveTab] = useState(initialTab)
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
    { id: 'eotm',       label: 'EOTM'       },
    { id: 'eoty',       label: 'EOTY'       },
    { id: 'jobs',       label: 'Job Board'  },
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
            {activeTab === 'feedback'   && <FeedbackTab   feedback={feedback} employments={employments} />}
            {activeTab === 'eotm'       && <EotmVoteTab   employments={employments} user={user} />}
            {activeTab === 'eoty'       && <EotyVoteTab   employments={employments} user={user} />}
            {activeTab === 'jobs'       && <JobBoardTab   employments={employments} refetchEmployments={refetchEmployments} />}
          </>
        )}
      </div>
    </div>
  )
}

/* ─── Overview Tab ─── */
function OverviewTab({ user, employments, reviews, feedback }) {
  const approvedEmployments = employments.filter(e => (e.verification_status ?? e.status) === 'approved' && e.is_current !== false)
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
        {verifiedCount > 0 && (
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
        )}
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
  const [requestEndId, setRequestEndId] = useState(null)
  const [requestEndReason, setRequestEndReason] = useState({})
  const [requestEndSubmitting, setRequestEndSubmitting] = useState({})
  const [requestEndError, setRequestEndError] = useState({})
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
  const [needsIdVerif, setNeedsIdVerif] = useState(false)
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

  const handleRequestEndEmployment = async (empId) => {
    const reason = requestEndReason[empId]?.trim()
    setRequestEndError(e => ({ ...e, [empId]: '' }))
    setRequestEndSubmitting(s => ({ ...s, [empId]: true }))
    try {
      await requestEndEmployment(empId, { reason: reason || undefined })
      setRequestEndId(null)
      setRequestEndReason(r => ({ ...r, [empId]: '' }))
      await refetch()
    } catch (err) {
      setRequestEndError(e => ({ ...e, [empId]: err?.message ?? 'Failed to submit request.' }))
    } finally {
      setRequestEndSubmitting(s => ({ ...s, [empId]: false }))
    }
  }

  const handleSubmitRequest = async () => {    if (!selectedCompany) { setFormError('Please select a company from the list.'); return }
    if (!position.trim()) { setFormError('Position is required.'); return }
    if (!startDate)        { setFormError('Start date is required.'); return }
    setFormError('')
    setNeedsIdVerif(false)
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
      if (err?.message?.toLowerCase().includes('identity verification required')) {
        setNeedsIdVerif(true)
        setFormError('')
      } else {
        setFormError(err?.message ?? 'Failed to submit request. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const hasApproved = employments.some(e => (e.verification_status ?? e.status) === 'approved' && e.is_current !== false)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-navy-900">Employment History</h2>
      </div>

      {/* Info banner: invite-only */}
      <div className="bg-navy-50 rounded-xl p-4 flex items-start gap-3">
        <Building2 size={16} className="text-navy-500 mt-0.5 shrink-0" />
        <p className="text-xs text-navy-600 leading-relaxed">
          Employment verification is now <strong>invite-only</strong>. Your company admin will send you an invitation link to verify your employment.
        </p>
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
          {needsIdVerif && (
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4">
              <ShieldCheck size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800">Identity verification required</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  You must complete ID verification and be approved by a system admin before requesting employment.
                </p>
                <Link
                  to="/profile#verification"
                  className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-amber-700 underline hover:text-amber-900"
                >
                  <ShieldCheck size={12} /> Go to Profile → Verification
                </Link>
              </div>
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
                            emp.end_requested_at ? (
                              <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-medium rounded-lg">End requested</span>
                            ) : (
                              <button
                                onClick={() => {
                                  setRequestEndId(requestEndId === emp.id ? null : emp.id)
                                  setRequestEndError(e => ({ ...e, [emp.id]: '' }))
                                }}
                                className="text-xs text-red-400 hover:text-red-600 font-medium transition-colors"
                              >
                                Request End
                              </button>
                            )
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
                      {/* Inline request-end confirmation */}
                      <AnimatePresence>
                        {requestEndId === emp.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-4 pt-4 border-t border-navy-100 space-y-3">
                              <p className="text-xs font-semibold text-navy-700">Request to end employment at {name}?</p>
                              <p className="text-xs text-navy-400">The company admin will review your request and approve or reject it.</p>
                              {requestEndError[emp.id] && (
                                <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                                  <AlertCircle size={12} />{requestEndError[emp.id]}
                                </div>
                              )}
                              <input
                                type="text"
                                placeholder="Reason (optional)"
                                value={requestEndReason[emp.id] ?? ''}
                                onChange={e => setRequestEndReason(r => ({ ...r, [emp.id]: e.target.value }))}
                                className="w-full h-9 rounded-xl border border-navy-200 bg-white px-3 text-xs focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 transition-all"
                              />
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleRequestEndEmployment(emp.id)}
                                  disabled={!!requestEndSubmitting[emp.id]}
                                  className="h-8 px-4 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition-all disabled:opacity-50 inline-flex items-center gap-1.5"
                                >
                                  {requestEndSubmitting[emp.id] ? <Loader2 size={11} className="animate-spin" /> : null}
                                  Submit Request
                                </button>
                                <button
                                  onClick={() => { setRequestEndId(null); setRequestEndError(e => ({ ...e, [emp.id]: '' })) }}
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
                    <StarRating rating={review.overall_rating} size={14} />
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
                    </div>
                  </div>
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
function FeedbackTab({ feedback, employments }) {
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
        {(employments || []).some(e => (e.verification_status ?? e.status) === 'approved' && e.is_current !== false) && (
          <Link
            to="/feedback"
            className="h-10 px-5 bg-navy-900 text-white text-sm font-medium rounded-xl inline-flex items-center gap-2 hover:bg-navy-800 transition-all"
          >
            <MessageSquare size={15} />
            Give Feedback
          </Link>
        )}
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

/* ─── EOTM Vote Tab ─── */
const EOTM_MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

function EotmVoteTab({ employments, user }) {
  const { addNotification } = useNotification()
  const approvedEmployments = employments.filter(e => (e.verification_status ?? e.status) === 'approved' && e.is_current !== false)
  const [selectedCompany, setSelectedCompany] = useState(approvedEmployments[0]?.company_id ?? null)
  const [events, setEvents]     = useState([])
  const [nominees, setNominees] = useState({})
  const [winners, setWinners]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [voting, setVoting]     = useState(null)
  const [expanded, setExpanded] = useState(null)
  const [certWinner, setCertWinner] = useState(null)

  useEffect(() => {
    if (!selectedCompany) { setLoading(false); return }
    setLoading(true)
    Promise.all([
      getCompanyEotmEvents(selectedCompany),
      getCompanyEotmWinners(selectedCompany),
    ])
      .then(([evRes, winRes]) => {
        setEvents(evRes?.data?.events ?? evRes?.data ?? [])
        setWinners(winRes?.data?.winners ?? winRes?.data ?? [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [selectedCompany])

  const loadNominees = async (eventId) => {
    if (expanded === eventId) { setExpanded(null); return }
    setExpanded(eventId)
    if (!nominees[eventId]) {
      try {
        const res = await getEotmNominees(eventId)
        setNominees(prev => ({ ...prev, [eventId]: res?.data?.nominees ?? res?.data ?? [] }))
        if (!res?.data?.nominees?.length) addNotification('No nominees in this event yet', 'info')
      } catch { setNominees(prev => ({ ...prev, [eventId]: [] })) }
    }
  }

  const handleVote = async (eventId, nomineeId) => {
    setVoting(nomineeId)
    try {
      await castEotmVote(eventId, nomineeId)
      addNotification('Vote cast successfully!', 'success')
      // Refresh nominees
      const res = await getEotmNominees(eventId)
      setNominees(prev => ({ ...prev, [eventId]: res?.data?.nominees ?? res?.data ?? [] }))
    } catch (e) { addNotification(e?.message || 'Vote failed', 'error') }
    finally { setVoting(null) }
  }

  if (approvedEmployments.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-navy-100/50 p-12 text-center">
        <Award size={28} className="mx-auto mb-3 text-navy-200" />
        <p className="text-sm text-navy-400">You need a verified employment to participate in EOTM voting.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-navy-900 flex items-center gap-2">
          <Award size={20} className="text-amber-500" />
          Employee of the Month
        </h2>
        {approvedEmployments.length > 1 && (
          <select
            value={selectedCompany ?? ''}
            onChange={e => setSelectedCompany(e.target.value)}
            className="h-9 rounded-xl border border-navy-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500/20"
          >
            {approvedEmployments.map(emp => (
              <option key={emp.company_id ?? emp.companyId} value={emp.company_id ?? emp.companyId}>
                {emp.companies?.name ?? emp.company_name ?? 'Company'}
              </option>
            ))}
          </select>
        )}
      </div>

      {loading ? (
        <div className="py-16 text-center"><Loader2 size={20} className="animate-spin mx-auto text-navy-400" /></div>
      ) : events.length === 0 ? (
        <div className="bg-white rounded-2xl border border-navy-100/50 p-12 text-center">
          <Award size={28} className="mx-auto mb-3 text-navy-200" />
          <p className="text-sm text-navy-400">No EOTM events for this company yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((ev, i) => (
            <Reveal key={ev.id} delay={i * 0.05}>
              <div className="bg-white rounded-2xl border border-navy-100/50 p-5 hover:border-navy-200 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-navy-900">
                      {EOTM_MONTHS[(ev.month ?? 1) - 1]} {ev.year}
                    </p>
                    <p className="text-xs text-navy-400">{(ev.total_votes ?? 0) > 0 ? `${ev.total_votes} total votes` : 'No votes yet'}</p>
                  </div>
                  <Badge variant={ev.status === 'open' ? 'success' : 'default'}>{ev.status === 'open' ? 'Open for Voting' : 'Closed'}</Badge>
                </div>
                <button
                  onClick={() => loadNominees(ev.id)}
                  className="text-xs text-navy-500 hover:text-navy-700 font-medium transition-colors"
                >
                  {expanded === ev.id ? 'Hide Nominees' : ev.status === 'open' ? 'View & Vote' : 'View Results'}
                </button>

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
                          <p className="text-xs text-navy-400 text-center py-3">{ev.status === 'open' ? 'No nominees yet. Cast the first vote!' : 'No nominees in this event.'}</p>
                        ) : (nominees[ev.id] ?? []).map((nom, j) => (
                          <div key={j} className="flex items-center justify-between bg-navy-50/50 rounded-xl px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                                <span className="text-white text-xs font-bold">{(nom.full_name || '?')[0].toUpperCase()}</span>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-navy-900">{nom.full_name ?? 'Unknown'}</p>
                                {nom.vote_count !== null && nom.vote_count !== undefined ? (
                                  <p className="text-xs text-navy-400">{nom.vote_count} vote{nom.vote_count !== 1 ? 's' : ''}</p>
                                ) : (
                                  <p className="text-xs text-navy-400">Results will be revealed when voting ends</p>
                                )}
                              </div>
                            </div>
                            {ev.status === 'open' && (
                              <button
                                onClick={() => handleVote(ev.id, nom.employee_id)}
                                disabled={voting === nom.employee_id}
                                className="h-8 px-3 border border-amber-300 text-amber-700 text-xs font-medium rounded-lg hover:bg-amber-50 transition-colors disabled:opacity-50"
                              >
                                {voting === nom.employee_id ? <Loader2 size={11} className="animate-spin" /> : 'Vote'}
                              </button>
                            )}
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
      )}

      {/* Past winners */}
      {winners.length > 0 && (
        <Reveal delay={0.1}>
          <div className="bg-white rounded-2xl border border-navy-100/50 p-6">
            <h3 className="text-sm font-semibold text-navy-900 mb-4 flex items-center gap-2">
              <Award size={16} className="text-amber-500" />
              Past Winners
            </h3>
            <div className="grid sm:grid-cols-3 gap-3">
              {winners.map((w, i) => w.employee_name ? (
                <div key={i} className="bg-amber-50/50 rounded-xl p-4 text-center border border-amber-100/50">
                  <div className="w-10 h-10 mx-auto rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-2">
                    <span className="text-white font-bold text-xs">{w.employee_name[0].toUpperCase()}</span>
                  </div>
                  <p className="text-sm font-semibold text-navy-900">{w.employee_name}</p>
                  <p className="text-xs text-navy-400 mt-0.5">
                    {EOTM_MONTHS[(w.month ?? 1) - 1]} {w.year}
                  </p>
                  <p className="text-xs text-navy-400">{w.voteCount} votes</p>
                  {w.user_id && user?.id === w.user_id && (
                    <button
                      onClick={() => setCertWinner(w)}
                      className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-amber-600 hover:text-amber-800 transition-colors"
                    >
                      <Download size={12} /> Get Certificate
                    </button>
                  )}
                </div>
              ) : (
                <div key={i} className="bg-gray-50 rounded-xl p-4 text-center border border-gray-200 opacity-60">
                  <div className="w-10 h-10 mx-auto rounded-full bg-gray-300 flex items-center justify-center mb-2">
                    <span className="text-white font-bold text-xs">—</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-500">No Winner</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {EOTM_MONTHS[(w.month ?? 1) - 1]} {w.year}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      )}

      <CertificateModal
        isOpen={!!certWinner}
        onClose={() => setCertWinner(null)}
        winner={certWinner?.employee_name}
        awardType="eotm"
        monthYear={certWinner ? `${EOTM_MONTHS[(certWinner.month ?? 1) - 1]} ${certWinner.year}` : ''}
        companyName={certWinner?.company_name}
      />
    </div>
  )
}

/* ─── EOTY Vote Tab ─── */
function EotyVoteTab({ employments, user }) {
  const { addNotification } = useNotification()
  const approvedEmps = employments.filter(e => (e.verification_status ?? e.status) === 'approved' && e.is_current !== false)
  const [events, setEvents] = useState([])
  const [winners, setWinners] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [nominees, setNominees] = useState({})
  const [voting, setVoting] = useState({})
  const [voteSearch, setVoteSearch] = useState('')
  const [votingForEvent, setVotingForEvent] = useState(null)
  const [coworkerResults, setCoworkerResults] = useState([])
  const [certWinner, setCertWinner] = useState(null)

  useEffect(() => {
    const companyIds = [...new Set(approvedEmps.map(e => e.company_id ?? e.companyId))]
    if (companyIds.length === 0) { setLoading(false); return }
    Promise.all(companyIds.map(id => Promise.all([getCompanyEotyEvents(id), getCompanyEotyWinners(id)])))
      .then(results => {
        const allEvents = results.flatMap(([evRes]) => evRes?.data ?? [])
        const allWinners = results.flatMap(([, wRes]) => wRes?.data ?? [])
        setEvents(allEvents)
        setWinners(allWinners)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [approvedEmps.length])

  const loadNominees = async (eventId) => {
    if (expanded === eventId) { setExpanded(null); return }
    setExpanded(eventId)
    try {
      const res = await getEotyNominees(eventId)
      setNominees(n => ({ ...n, [eventId]: res?.data ?? [] }))
    } catch { setNominees(n => ({ ...n, [eventId]: [] })) }
  }

  const handleVote = async (eventId, nomineeId) => {
    setVoting(v => ({ ...v, [nomineeId]: true }))
    try {
      await castEotyVote(eventId, nomineeId)
      addNotification('Vote cast successfully!', 'success')
      await loadNominees(eventId)
    } catch (e) { addNotification(e?.message || 'Vote failed', 'error') }
    finally { setVoting(v => ({ ...v, [nomineeId]: false })) }
  }

  if (loading) return <div className="py-20 text-center text-navy-400 text-sm"><Loader2 size={20} className="animate-spin mx-auto" /></div>

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-navy-900 flex items-center gap-2">
        <Trophy size={18} className="text-amber-500" /> Employee of the Year
      </h2>

      {events.length === 0 && (
        <div className="bg-white rounded-2xl border border-navy-100/50 p-12 text-center">
          <Trophy size={32} className="text-navy-200 mx-auto mb-3" />
          <p className="text-sm text-navy-400">No EOTY events at your companies right now.</p>
        </div>
      )}

      {events.map((ev, i) => {
        const isOpen = ev.status === 'open' || ev.status === 'active'
        return (
        <Reveal key={ev.id} delay={i * 0.05}>
          <div className="bg-white rounded-2xl border border-navy-100/50 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Trophy size={18} className="text-amber-500" />
                <div>
                  <p className="text-sm font-semibold text-navy-900">Year {ev.year}</p>
                  <p className="text-xs text-navy-400">{(ev.total_votes ?? 0) > 0 ? `${ev.total_votes} total votes` : 'No votes yet'}</p>
                </div>
                <Badge variant={isOpen ? 'success' : 'default'}>{isOpen ? 'Open for Voting' : 'Closed'}</Badge>
              </div>
              <button onClick={() => loadNominees(ev.id)}
                className="text-xs text-navy-500 hover:text-navy-700 font-medium transition-colors">
                {expanded === ev.id ? 'Hide Nominees' : isOpen ? 'View & Vote' : 'View Results'}
              </button>
            </div>

            <AnimatePresence>
              {expanded === ev.id && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="border-t border-navy-100 pt-3 space-y-2">
                    {(nominees[ev.id] ?? []).length === 0 ? (
                      <p className="text-xs text-navy-400 text-center py-3">{isOpen ? 'No nominees yet. Cast the first vote!' : 'No nominees in this event.'}</p>
                    ) : (nominees[ev.id] ?? []).map((nom, j) => (
                      <div key={j} className="flex items-center justify-between bg-navy-50/50 rounded-xl px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                            <span className="text-white text-xs font-bold">{(nom.full_name || nom.employee_name || '?')[0].toUpperCase()}</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-navy-900">{nom.full_name ?? nom.employee_name ?? 'Unknown'}</p>
                            {nom.vote_count !== null && nom.vote_count !== undefined ? (
                              <p className="text-xs text-navy-400">{nom.vote_count} vote{nom.vote_count !== 1 ? 's' : ''}</p>
                            ) : (
                              <p className="text-xs text-navy-400">Results will be revealed when voting ends</p>
                            )}
                          </div>
                        </div>
                        {isOpen && (
                          <button onClick={() => handleVote(ev.id, nom.employee_id ?? nom.nominee_id)} disabled={!!voting[nom.employee_id ?? nom.nominee_id]}
                            className="h-8 px-4 bg-amber-500 text-white text-xs font-semibold rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50">
                            {voting[nom.employee_id ?? nom.nominee_id] ? <Loader2 size={12} className="animate-spin" /> : 'Vote'}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Reveal>
        )
      })}

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
                  {w.user_id && user?.id === w.user_id && (
                    <button
                      onClick={() => setCertWinner(w)}
                      className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-amber-600 hover:text-amber-800 transition-colors"
                    >
                      <Download size={12} /> Get Certificate
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      )}

      <CertificateModal
        isOpen={!!certWinner}
        onClose={() => setCertWinner(null)}
        winner={certWinner?.employee_name}
        awardType="eoty"
        monthYear={certWinner ? `Year ${certWinner.year}` : ''}
        companyName={certWinner?.company_name}
      />
    </div>
  )
}

/* ─── Job Board Tab ─── */
function JobBoardTab({ employments, refetchEmployments }) {
  const { user } = useAuth()
  const [jobs, setJobs] = useState([])
  const [myApps, setMyApps] = useState([])
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState({})
  const [coverLetter, setCoverLetter] = useState({})
  const [cvFiles, setCvFiles] = useState({})
  const [acceptingHire, setAcceptingHire] = useState({})
  const [jobError, setJobError] = useState('')
  const [subTab, setSubTab] = useState('open')
  const [searchQuery, setSearchQuery] = useState('')
  const [jobPage, setJobPage] = useState(1)
  const [appPage, setAppPage] = useState(1)
  const JOBS_PER_PAGE = 10

  const loadData = () => {
    Promise.all([getAllJobPositions(), getMyApplications()])
      .then(([jobsRes, appsRes]) => {
        setJobs(jobsRes?.data ?? [])
        setMyApps(appsRes?.data ?? [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [])

  // Reset pages when search changes
  useEffect(() => { setJobPage(1); setAppPage(1) }, [searchQuery])

  const appliedPositionIds = new Set(myApps.map(a => a.position_id))

  const handleApply = async (positionId) => {
    setApplying(a => ({ ...a, [positionId]: true }))
    setJobError('')
    try {
      await applyToJob(positionId, {
        cvFile: cvFiles[positionId] || undefined,
        coverLetter: coverLetter[positionId]?.trim() || undefined,
      })
      const updatedApps = await getMyApplications()
      setMyApps(updatedApps?.data ?? [])
      setCoverLetter(c => ({ ...c, [positionId]: '' }))
      setCvFiles(f => ({ ...f, [positionId]: null }))
    } catch (e) { setJobError(e?.message || 'Application failed. Please try again.') }
    finally { setApplying(a => ({ ...a, [positionId]: false })) }
  }

  const handleAcceptHireInvite = async (appId) => {
    setAcceptingHire(a => ({ ...a, [appId]: true }))
    setJobError('')
    try {
      await acceptHireInvite(appId)
      const updatedApps = await getMyApplications()
      setMyApps(updatedApps?.data ?? [])
      refetchEmployments?.()
    } catch (e) { setJobError(e?.message || 'Failed to accept employment offer.') }
    finally { setAcceptingHire(a => ({ ...a, [appId]: false })) }
  }

  const handleRejectHireInvite = async (appId) => {
    setAcceptingHire(a => ({ ...a, [appId]: true }))
    setJobError('')
    try {
      await rejectHireInvite(appId)
      const updatedApps = await getMyApplications()
      setMyApps(updatedApps?.data ?? [])
      refetchEmployments?.()
    } catch (e) { setJobError(e?.message || 'Failed to reject employment offer.') }
    finally { setAcceptingHire(a => ({ ...a, [appId]: false })) }
  }

  if (loading) return <div className="py-20 text-center text-navy-400 text-sm"><Loader2 size={20} className="animate-spin mx-auto" /></div>

  const APP_STATUS_COLORS = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    interview: 'bg-blue-50 text-blue-700 border-blue-200',
    approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rejected: 'bg-red-50 text-red-700 border-red-200',
  }

  // Filter open jobs by search query
  const openJobs = jobs.filter(j => j.status === 'open')
  const filteredJobs = searchQuery
    ? openJobs.filter(j => {
        const q = searchQuery.toLowerCase()
        return (j.title?.toLowerCase().includes(q)) ||
               (j.companies?.name?.toLowerCase().includes(q)) ||
               (j.companies?.location?.toLowerCase().includes(q)) ||
               (j.location?.toLowerCase().includes(q))
      })
    : openJobs

  // Filter applications by search query
  const filteredApps = searchQuery
    ? myApps.filter(a => {
        const q = searchQuery.toLowerCase()
        return (a.job_positions?.title?.toLowerCase().includes(q)) ||
               (a.position_title?.toLowerCase().includes(q)) ||
               (a.job_positions?.companies?.name?.toLowerCase().includes(q))
      })
    : myApps

  // Pagination for jobs
  const totalJobPages = Math.max(1, Math.ceil(filteredJobs.length / JOBS_PER_PAGE))
  const pagedJobs = filteredJobs.slice((jobPage - 1) * JOBS_PER_PAGE, jobPage * JOBS_PER_PAGE)

  // Pagination for applications
  const totalAppPages = Math.max(1, Math.ceil(filteredApps.length / JOBS_PER_PAGE))
  const pagedApps = filteredApps.slice((appPage - 1) * JOBS_PER_PAGE, appPage * JOBS_PER_PAGE)

  const PaginationControls = ({ currentPage, totalPages, setPage: setP }) => {
    if (totalPages <= 1) return null
    return (
      <div className="flex items-center justify-center gap-2 mt-4">
        <button disabled={currentPage <= 1} onClick={() => setP(currentPage - 1)}
          className="h-8 px-3 rounded-lg text-xs font-medium border border-navy-200 text-navy-600 hover:bg-navy-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
          Previous
        </button>
        <span className="text-xs text-navy-400">Page {currentPage} of {totalPages}</span>
        <button disabled={currentPage >= totalPages} onClick={() => setP(currentPage + 1)}
          className="h-8 px-3 rounded-lg text-xs font-medium border border-navy-200 text-navy-600 hover:bg-navy-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
          Next
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-navy-900 flex items-center gap-2">
        <Briefcase size={18} className="text-navy-500" /> Job Board
      </h2>

      {jobError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 flex items-center justify-between">
          <span>{jobError}</span>
          <button onClick={() => setJobError('')} className="text-red-400 hover:text-red-600 text-xs font-semibold">✕</button>
        </div>
      )}

      {/* Verification warning */}
      {user?.isVerified === false && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <ShieldCheck size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">
            Your account must be <strong>verified by a system admin</strong> before you can apply for jobs or accept employment offers.
          </p>
        </div>
      )}

      {/* Search bar */}
      <div className="relative max-w-md">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" />
        <input
          type="text"
          placeholder="Search by job name, company, or location..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full h-10 rounded-xl border border-navy-200 bg-white pl-9 pr-4 text-sm text-navy-900 placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 transition-all"
        />
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 bg-navy-50 rounded-xl p-1 w-fit">
        <button
          onClick={() => { setSubTab('open'); setJobPage(1) }}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            subTab === 'open' ? 'bg-white text-navy-900 shadow-sm' : 'text-navy-500 hover:text-navy-700'
          }`}
        >
          Open Positions ({filteredJobs.length})
        </button>
        <button
          onClick={() => { setSubTab('applications'); setAppPage(1) }}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            subTab === 'applications' ? 'bg-white text-navy-900 shadow-sm' : 'text-navy-500 hover:text-navy-700'
          }`}
        >
          My Applications ({filteredApps.length})
        </button>
      </div>

      {/* Open Positions sub-tab */}
      {subTab === 'open' && (
        <>
          {filteredJobs.length === 0 && (
            <div className="bg-white rounded-2xl border border-navy-100/50 p-12 text-center">
              <Briefcase size={32} className="text-navy-200 mx-auto mb-3" />
              <p className="text-sm text-navy-400">
                {searchQuery ? 'No positions match your search.' : 'No open positions right now. Check back later!'}
              </p>
            </div>
          )}

          {pagedJobs.map((job, i) => {
            const alreadyApplied = appliedPositionIds.has(job.id)
            return (
              <Reveal key={job.id} delay={i * 0.05}>
                <div className="bg-white rounded-2xl border border-navy-100/50 p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-navy-900">{job.title}</h4>
                      <p className="text-xs text-navy-400 mt-0.5">
                        {job.companies?.name && <span>{job.companies.name} · </span>}
                        {(job.location || job.companies?.location) && <span>{job.location || job.companies?.location} · </span>}
                        Posted {new Date(job.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {alreadyApplied ? (
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-200">Applied</span>
                    ) : (
                      <button onClick={() => handleApply(job.id)} disabled={!!applying[job.id] || !cvFiles[job.id]}
                        className="h-8 px-4 bg-navy-900 text-white text-xs font-semibold rounded-lg hover:bg-navy-800 disabled:opacity-50 flex items-center gap-1.5"
                        title={!cvFiles[job.id] ? 'Please upload a CV to apply' : undefined}>
                        {applying[job.id] ? <Loader2 size={12} className="animate-spin" /> : 'Apply'}
                      </button>
                    )}
                  </div>
                  {job.description && <p className="text-xs text-navy-500">{job.description}</p>}
                  {job.requirements && (
                    <div className="text-xs text-navy-400">
                      <strong className="text-navy-600">Requirements:</strong> {job.requirements}
                    </div>
                  )}
                  {!alreadyApplied && (
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 p-2.5 border border-dashed border-navy-200 rounded-xl cursor-pointer hover:border-navy-400 hover:bg-navy-50 transition-all">
                        <Download size={14} className="text-navy-400 flex-shrink-0" />
                        <span className="text-xs text-navy-500 truncate">
                          {cvFiles[job.id] ? cvFiles[job.id].name : 'Upload CV (PDF or Word, optional)'}
                        </span>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          className="hidden"
                          onChange={e => setCvFiles(f => ({ ...f, [job.id]: e.target.files?.[0] || null }))}
                        />
                      </label>
                      <textarea
                        placeholder="Cover letter (optional)..."
                        value={coverLetter[job.id] ?? ''}
                        onChange={e => setCoverLetter(c => ({ ...c, [job.id]: e.target.value }))}
                        className="w-full h-20 rounded-xl border border-navy-200 bg-white px-3 py-2 text-sm placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 transition-all resize-none"
                      />
                    </div>
                  )}
                </div>
              </Reveal>
            )
          })}

          <PaginationControls currentPage={jobPage} totalPages={totalJobPages} setPage={setJobPage} />
        </>
      )}

      {/* My Applications sub-tab */}
      {subTab === 'applications' && (
        <>
          {filteredApps.length === 0 && (
            <div className="bg-white rounded-2xl border border-navy-100/50 p-12 text-center">
              <Briefcase size={32} className="text-navy-200 mx-auto mb-3" />
              <p className="text-sm text-navy-400">
                {searchQuery ? 'No applications match your search.' : "You haven't applied to any positions yet."}
              </p>
            </div>
          )}

          {filteredApps.length > 0 && (
            <div className="bg-white rounded-2xl border border-navy-100/50 p-5">
              <div className="space-y-2">
                {pagedApps.map(app => {
                  const hireInviteSent = !!app.hire_invite_sent_at
                  const hireInviteAccepted = !!app.hire_invite_accepted_at

                  // Determine employment status for this application by matching company_id
                  const appCompanyId = app.company_id ?? app.job_positions?.company_id
                  const myEmployment = employments.find(e => (e.company_id ?? e.companyId) === appCompanyId)

                  // Prefer explicit application 'rejected' status (from decline) over employment-derived labels
                  let displayStatus = app.status
                  if (app.status === 'rejected') {
                    displayStatus = 'rejected'
                  } else if (myEmployment) {
                    const verified = (myEmployment.verification_status ?? myEmployment.status)
                    if (myEmployment.is_current === true && verified === 'approved') displayStatus = 'employed'
                    else if ((myEmployment.is_current === false || myEmployment.is_current === 0) && verified === 'approved') displayStatus = 'ended'
                    else displayStatus = verified || app.status
                  }

                  const statusClass = displayStatus === 'employed'
                    ? 'px-2 py-1 bg-emerald-50 text-emerald-700 text-[11px] font-semibold rounded-lg border border-emerald-200'
                    : displayStatus === 'ended'
                      ? 'px-2.5 py-1 rounded-full border text-xs font-semibold bg-gray-50 text-navy-600 border-navy-100'
                      : `px-2.5 py-1 rounded-full border text-xs font-semibold ${APP_STATUS_COLORS[app.status] ?? APP_STATUS_COLORS.pending}`

                  const statusLabel = displayStatus === 'employed' ? 'Employed ✓' : displayStatus === 'ended' ? 'Ended' : displayStatus

                  return (
                    <div key={app.id} className="bg-ice-50 rounded-xl px-4 py-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-navy-900">{app.job_positions?.title ?? app.position_title ?? 'Position'}</p>
                          <p className="text-xs text-navy-400 mt-0.5">
                            {app.job_positions?.companies?.name && <span>{app.job_positions.companies.name} · </span>}
                            {app.job_positions?.location && <span>{app.job_positions.location} · </span>}
                            Applied {new Date(app.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap justify-end">
                          {hireInviteSent && !hireInviteAccepted && app.status === 'interview' && (
                            <>
                              <button
                                onClick={() => handleAcceptHireInvite(app.id)}
                                disabled={!!acceptingHire[app.id]}
                                className="h-7 px-3 bg-emerald-700 text-white text-xs font-semibold rounded-lg hover:bg-emerald-800 disabled:opacity-50 flex items-center gap-1"
                              >
                                {acceptingHire[app.id] ? <Loader2 size={11} className="animate-spin" /> : null}
                                Accept Employment
                              </button>
                              <button
                                onClick={() => handleRejectHireInvite(app.id)}
                                disabled={!!acceptingHire[app.id]}
                                className="h-7 px-3 bg-red-50 text-red-700 text-xs font-semibold rounded-lg hover:bg-red-100 disabled:opacity-50 flex items-center gap-1 border border-red-100"
                              >
                                Decline
                              </button>
                            </>
                          )}

                          <span className={statusClass}>{statusLabel}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              <PaginationControls currentPage={appPage} totalPages={totalAppPages} setPage={setAppPage} />
            </div>
          )}
        </>
      )}
    </div>
  )
}
