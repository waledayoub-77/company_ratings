import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Star,
  MapPin,
  Building2,
  PenSquare,
  Flag,
  Shield,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import StarRating from '../components/ui/StarRating.jsx'
import Badge from '../components/ui/Badge.jsx'
import Reveal from '../components/ui/Reveal.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { getCompanyById, getCompanyReviews, getCompanyAnalytics } from '../api/companies'
import { submitReport } from '../api/admin'

/* ─── Helpers ─── */
const GRADIENTS = [
  'from-indigo-500 to-violet-600', 'from-cyan-500 to-blue-600',
  'from-pink-500 to-rose-600',     'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',  'from-purple-500 to-indigo-600',
  'from-blue-500 to-sky-600',      'from-gray-800 to-gray-950',
]
function pickGradient(name) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return GRADIENTS[Math.abs(h) % GRADIENTS.length]
}

const SORT_MAP = {
  Recent:          { sortBy: 'created_at',     sortOrder: 'desc' },
  'Highest Rated': { sortBy: 'overall_rating', sortOrder: 'desc' },
  'Lowest Rated':  { sortBy: 'overall_rating', sortOrder: 'asc'  },
}

export default function CompanyProfilePage() {
  const { id } = useParams()
  const { user } = useAuth()

  // Company state
  const [company, setCompany] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [companyLoading, setCompanyLoading] = useState(true)
  const [companyError, setCompanyError] = useState(null)

  // Reviews state
  const [reviews, setReviews] = useState([])
  const [reviewsPagination, setReviewsPagination] = useState({ total: 0, totalPages: 1, page: 1 })
  const [reviewsLoading, setReviewsLoading] = useState(true)
  const [sortReviews, setSortReviews] = useState('Recent')
  const [reviewPage, setReviewPage] = useState(1)

  // Report state
  const [reportingId, setReportingId] = useState(null)
  const [reportReason, setReportReason] = useState('')
  const [reportDescription, setReportDescription] = useState('')
  const [reportSubmitting, setReportSubmitting] = useState(false)
  const [reportSuccess, setReportSuccess] = useState(null)
  const [reportError, setReportError] = useState(null)

  // Fetch company + analytics
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setCompanyLoading(true)
      setCompanyError(null)
      try {
        const [companyRes, analyticsRes] = await Promise.all([
          getCompanyById(id),
          getCompanyAnalytics(id).catch(() => null),
        ])
        if (!cancelled) {
          setCompany(companyRes.data)
          if (analyticsRes) setAnalytics(analyticsRes.data)
        }
      } catch (err) {
        if (!cancelled) setCompanyError(err.message || 'Company not found')
      } finally {
        if (!cancelled) setCompanyLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [id])

  // Fetch reviews (re-runs when sort or page changes)
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setReviewsLoading(true)
      try {
        const sortOpt = SORT_MAP[sortReviews] || SORT_MAP.Recent
        const res = await getCompanyReviews(id, { page: reviewPage, limit: 10, ...sortOpt })
        if (!cancelled) {
          setReviews(res.data || [])
          setReviewsPagination(res.pagination || { total: 0, totalPages: 1, page: 1 })
        }
      } catch {
        if (!cancelled) setReviews([])
      } finally {
        if (!cancelled) setReviewsLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [id, sortReviews, reviewPage])

  // Reset review page when sort changes
  useEffect(() => { setReviewPage(1) }, [sortReviews])

  // Handle report submit
  const handleReport = async (reviewId) => {
    if (!reportReason) return
    setReportSubmitting(true)
    setReportError(null)
    try {
      await submitReport({ reviewId, reason: reportReason, description: reportDescription })
      setReportSuccess(reviewId)
      setReportingId(null)
      setReportReason('')
      setReportDescription('')
      setTimeout(() => setReportSuccess(null), 3000)
    } catch (err) {
      setReportError(err.message)
    } finally {
      setReportSubmitting(false)
    }
  }

  // Build rating distribution from analytics
  const distribution = analytics?.ratingDistribution
    ? [5, 4, 3, 2, 1].map(stars => {
        const count = analytics.ratingDistribution[stars] || 0
        const pct = analytics.totalReviews > 0 ? Math.round((count / analytics.totalReviews) * 100) : 0
        return { stars, count, pct }
      })
    : []

  // ── Loading state ──
  if (companyLoading) {
    return (
      <div className="min-h-screen bg-ice-50 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-navy-400" />
      </div>
    )
  }

  // ── Error / 404 state ──
  if (companyError || !company) {
    return (
      <div className="min-h-screen bg-ice-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={48} className="mx-auto text-navy-300 mb-4" />
          <p className="text-xl font-semibold text-navy-700">{companyError || 'Company not found'}</p>
          <Link to="/companies" className="mt-4 inline-block text-sm text-navy-500 underline hover:text-navy-700">
            ← Back to companies
          </Link>
        </div>
      </div>
    )
  }

  const gradient = pickGradient(company.name)

  return (
    <div className="min-h-screen bg-ice-50">
      {/* Company header */}
      <div className="bg-white border-b border-navy-100/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-28 pb-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              {/* Company logo */}
              <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20`}>
                <Building2 size={36} className="text-white" strokeWidth={1.3} />
              </div>

              <div className="flex-1">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-serif font-bold text-navy-900">{company.name}</h1>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-navy-500">
                      <span className="flex items-center gap-1.5">
                        <Building2 size={14} />
                        {company.industry}
                      </span>
                      <span className="text-navy-200">·</span>
                      <span className="flex items-center gap-1.5">
                        <MapPin size={14} />
                        {company.location}
                      </span>
                      {company.is_verified && (
                        <>
                          <span className="text-navy-200">·</span>
                          <span className="flex items-center gap-1.5 text-emerald-600">
                            <CheckCircle2 size={14} />
                            Verified
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <Link
                    to={`/companies/${id}/review`}
                    className="h-11 px-6 bg-navy-900 text-white text-sm font-medium rounded-xl inline-flex items-center gap-2 hover:bg-navy-800 transition-all shadow-sm shadow-navy-900/15"
                  >
                    <PenSquare size={15} />
                    Write a Review
                  </Link>
                </div>

                <p className="mt-5 text-sm text-navy-600 leading-relaxed max-w-3xl">
                  {company.description || 'No description available.'}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Sidebar — Rating summary */}
          <div className="lg:col-span-4 order-2 lg:order-1">
            <Reveal>
              <div className="bg-white rounded-2xl border border-navy-100/50 p-6 lg:sticky lg:top-24">
                {/* Overall rating */}
                <div className="text-center pb-6 border-b border-navy-100/50">
                  <p className="text-5xl font-serif font-bold text-navy-900">{Number(company.overall_rating).toFixed(1)}</p>
                  <div className="flex justify-center mt-2">
                    <StarRating rating={Number(company.overall_rating)} size={20} />
                  </div>
                  <p className="text-sm text-navy-400 mt-2">
                    Based on {company.total_reviews} verified reviews
                  </p>
                </div>

                {/* Distribution */}
                {distribution.length > 0 && (
                <div className="pt-6 space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-navy-400 mb-4">
                    Rating Distribution
                  </h3>
                  {distribution.map(d => (
                    <div key={d.stars} className="flex items-center gap-3">
                      <span className="text-xs font-medium text-navy-600 w-3">{d.stars}</span>
                      <Star size={12} className="fill-amber-400 text-amber-400 shrink-0" />
                      <div className="flex-1 h-2 bg-navy-50 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-amber-400 rounded-full"
                          initial={{ width: 0 }}
                          whileInView={{ width: `${d.pct}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.8, delay: (5 - d.stars) * 0.1 }}
                        />
                      </div>
                      <span className="text-xs text-navy-400 w-8 text-right">{d.count}</span>
                    </div>
                  ))}
                </div>
                )}

                {/* Quick stats */}
                <div className="mt-8 pt-6 border-t border-navy-100/50 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-navy-500">Verified company</span>
                    <span className={`font-semibold flex items-center gap-1 ${company.is_verified ? 'text-emerald-600' : 'text-navy-400'}`}>
                      {company.is_verified ? <><CheckCircle2 size={13} /> Yes</> : 'Pending'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-navy-500">Total reviews</span>
                    <span className="font-semibold text-navy-900">{company.total_reviews}</span>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>

          {/* Main content — Reviews */}
          <div className="lg:col-span-8 order-1 lg:order-2">
            {/* Sort & filter bar */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-serif font-semibold text-navy-900">
                Employee Reviews
              </h2>
              <div className="relative">
                <select
                  value={sortReviews}
                  onChange={(e) => setSortReviews(e.target.value)}
                  className="h-9 pl-3 pr-8 rounded-lg border border-navy-200 bg-white text-xs font-medium text-navy-600 appearance-none focus:outline-none focus:ring-2 focus:ring-navy-500/20 cursor-pointer"
                >
                  <option>Recent</option>
                  <option>Highest Rated</option>
                  <option>Lowest Rated</option>
                </select>
                <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-navy-400 pointer-events-none" />
              </div>
            </div>

            {/* Reviews list */}
            {reviewsLoading && (
              <div className="space-y-4">
                {[1,2,3].map(i => (
                  <div key={i} className="bg-white rounded-2xl border border-navy-100/50 p-6 animate-pulse">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-xl bg-navy-100" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-navy-100 rounded w-1/3" />
                        <div className="h-3 bg-navy-50 rounded w-1/4" />
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="h-3 bg-navy-50 rounded w-full" />
                      <div className="h-3 bg-navy-50 rounded w-4/5" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!reviewsLoading && reviews.length === 0 && (
              <div className="py-16 text-center bg-white rounded-2xl border border-navy-100/50">
                <Star size={40} className="mx-auto text-navy-200 mb-3" />
                <p className="text-lg font-semibold text-navy-700">No reviews yet</p>
                <p className="text-sm text-navy-400 mt-1">Be the first to share your experience!</p>
                <Link to={`/companies/${id}/review`} className="mt-4 inline-flex items-center gap-2 h-10 px-5 bg-navy-900 text-white text-sm font-medium rounded-xl hover:bg-navy-800 transition-all">
                  <PenSquare size={14} /> Write a Review
                </Link>
              </div>
            )}

            {!reviewsLoading && reviews.length > 0 && (
            <div className="space-y-4">
              {reviews.map((review, i) => (
                <Reveal key={review.id} delay={i * 0.05}>
                  <div className="bg-white rounded-2xl border border-navy-100/50 p-6 hover:border-navy-200 transition-all duration-200">
                    {/* Review header */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          review.is_anonymous
                            ? 'bg-navy-50'
                            : 'bg-gradient-to-br from-navy-500 to-navy-700'
                        }`}>
                          {review.is_anonymous ? (
                            <Shield size={18} className="text-navy-400" />
                          ) : (
                            <span className="text-white text-xs font-semibold">
                              {(review.reviewer_name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm text-navy-900">
                              {review.is_anonymous ? 'Anonymous Verified Employee' : (review.reviewer_name || 'Unknown')}
                            </span>
                            {review.is_anonymous && (
                              <Badge variant="info" size="sm">Anonymous</Badge>
                            )}
                            <Badge variant="success" size="sm">Verified</Badge>
                          </div>
                          <p className="text-xs text-navy-400 mt-0.5">
                            {review.reviewer_position || 'Employee'} · {new Date(review.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            {review.edited_at && <span className="ml-1 text-navy-300">(edited)</span>}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <StarRating rating={review.overall_rating} size={14} />
                        <span className="text-sm font-bold text-navy-900 ml-1">{review.overall_rating}.0</span>
                      </div>
                    </div>

                    {/* Review text */}
                    <p className="mt-4 text-sm text-navy-600 leading-relaxed">
                      {review.content}
                    </p>

                    {/* Review footer */}
                    <div className="mt-5 pt-4 border-t border-navy-50 flex items-center justify-between">
                      <div />
                      {reportSuccess === review.id ? (
                        <span className="text-xs text-emerald-600 font-medium">Report submitted</span>
                      ) : (
                      <button
                        onClick={() => {
                          if (!user) { window.location.href = '/login'; return }
                          setReportingId(reportingId === review.id ? null : review.id)
                          setReportError(null)
                        }}
                        className="flex items-center gap-1.5 text-xs text-navy-300 hover:text-red-500 transition-colors"
                      >
                        <Flag size={13} />
                        Report
                      </button>
                      )}
                    </div>

                    {/* Inline report form */}
                    {reportingId === review.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        className="mt-4 p-4 bg-red-50/50 rounded-xl border border-red-100"
                      >
                        <p className="text-xs font-medium text-red-700 mb-2">Report this review</p>
                        {reportError && <p className="text-xs text-red-600 mb-2">{reportError}</p>}
                        <select
                          value={reportReason}
                          onChange={e => setReportReason(e.target.value)}
                          className="w-full h-9 rounded-lg border border-red-200 bg-white px-3 text-xs text-navy-700 mb-2 focus:outline-none"
                        >
                          <option value="">Select reason...</option>
                          <option value="false_information">False information</option>
                          <option value="spam">Spam</option>
                          <option value="harassment">Harassment</option>
                          <option value="inappropriate">Inappropriate content</option>
                        </select>
                        <textarea
                          value={reportDescription}
                          onChange={e => setReportDescription(e.target.value)}
                          placeholder="Additional details (optional)"
                          className="w-full h-16 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs text-navy-700 resize-none mb-2 focus:outline-none"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleReport(review.id)}
                            disabled={!reportReason || reportSubmitting}
                            className="h-8 px-4 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                          >
                            {reportSubmitting ? 'Submitting...' : 'Submit Report'}
                          </button>
                          <button
                            onClick={() => { setReportingId(null); setReportError(null) }}
                            className="h-8 px-4 text-xs text-navy-500 hover:text-navy-700 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </Reveal>
              ))}
            </div>
            )}

            {/* Pagination */}
            {!reviewsLoading && reviewsPagination.totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-3">
              <button
                disabled={reviewPage <= 1}
                onClick={() => setReviewPage(p => p - 1)}
                className="w-10 h-10 rounded-xl text-sm font-medium text-navy-600 hover:bg-navy-50 disabled:opacity-30 disabled:cursor-default transition-all"
              >
                <ChevronLeft size={16} className="mx-auto" />
              </button>
              <span className="text-sm text-navy-500">
                Page {reviewPage} of {reviewsPagination.totalPages}
              </span>
              <button
                disabled={reviewPage >= reviewsPagination.totalPages}
                onClick={() => setReviewPage(p => p + 1)}
                className="w-10 h-10 rounded-xl text-sm font-medium text-navy-600 hover:bg-navy-50 disabled:opacity-30 disabled:cursor-default transition-all"
              >
                <ChevronRight size={16} className="mx-auto" />
              </button>
            </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
