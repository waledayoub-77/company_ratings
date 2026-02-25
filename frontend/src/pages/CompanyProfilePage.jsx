import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Star,
  MapPin,
  Building2,
  Users,
  Calendar,
  PenSquare,
  Flag,
  Shield,
  CheckCircle2,
  ThumbsUp,
  ChevronDown,
  ExternalLink,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import PageHeader from '../components/ui/PageHeader.jsx'
import StarRating from '../components/ui/StarRating.jsx'
import Badge from '../components/ui/Badge.jsx'
import Reveal from '../components/ui/Reveal.jsx'
import { getCompanyById, getCompanyReviews } from '../api/companies'
import { submitReport } from '../api/admin'
import { useAuth } from '../context/AuthContext'

// Gradient colors (rotate for visual variety)
const gradients = [
  'from-indigo-500 to-violet-600',
  'from-navy-500 to-navy-700',
  'from-cyan-500 to-blue-600',
  'from-purple-500 to-indigo-600',
]

// Map frontend sort to backend sort values
const sortMap = {
  'Recent': 'newest',
  'Highest Rated': 'highest',
  'Lowest Rated': 'lowest',
  'Most Helpful': 'newest', // Backend doesn't have helpful sort, use newest
}

export default function CompanyProfilePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [company, setCompany] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [reviewsLoading, setReviewsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sortReviews, setSortReviews] = useState('Recent')
  const [reportingId, setReportingId] = useState(null)
  const [reportReason, setReportReason] = useState('')
  const [reportDescription, setReportDescription] = useState('')
  const [reportSubmitting, setReportSubmitting] = useState(false)

  // Fetch company data
  useEffect(() => {
    const fetchCompany = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await getCompanyById(id)
        setCompany(response.data)
      } catch (err) {
        console.error('Error fetching company:', err)
        setError(err.message || 'Company not found')
      } finally {
        setLoading(false)
      }
    }
    fetchCompany()
  }, [id])

  // Fetch reviews (re-fetch when sort changes)
  useEffect(() => {
    const fetchReviews = async () => {
      setReviewsLoading(true)
      try {
        const response = await getCompanyReviews(id, { 
          sort: sortMap[sortReviews],
          limit: 10,
        })
        setReviews(response.data || [])
      } catch (err) {
        console.error('Error fetching reviews:', err)
      } finally {
        setReviewsLoading(false)
      }
    }
    if (company) {
      fetchReviews()
    }
  }, [id, sortReviews, company])

  // Submit report
  const handleSubmitReport = async () => {
    if (!user) {
      alert('Please sign in to report reviews')
      navigate('/login')
      return
    }
    
    if (!reportReason) {
      alert('Please select a reason')
      return
    }

    setReportSubmitting(true)
    try {
      await submitReport({
        reviewId: reportingId,
        reason: reportReason,
        description: reportDescription || undefined,
      })
      alert('Report submitted successfully')
      setReportingId(null)
      setReportReason('')
      setReportDescription('')
    } catch (err) {
      console.error('Error submitting report:', err)
      alert(err.message || 'Failed to submit report')
    } finally {
      setReportSubmitting(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-ice-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin text-navy-400 mx-auto mb-4" />
          <p className="text-sm text-navy-500">Loading company...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !company) {
    return (
      <div className="min-h-screen bg-ice-50 flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <AlertCircle size={28} className="text-red-600" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-navy-900 mb-2">Company Not Found</h2>
          <p className="text-sm text-navy-500 mb-6">{error || 'The company you are looking for does not exist.'}</p>
          <Link
            to="/companies"
            className="inline-block px-6 py-3 bg-navy-900 text-white text-sm font-medium rounded-xl hover:bg-navy-800 transition-colors"
          >
            Browse Companies
          </Link>
        </div>
      </div>
    )
  }

  // Calculate rating distribution percentages
  const ratingDistribution = [5, 4, 3, 2, 1].map(stars => {
    const count = reviews.filter(r => r.rating === stars).length
    const pct = reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0
    return { stars, count, pct }
  })

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
              <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${gradients[0]} flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20`}>
                <Building2 size={36} className="text-white" strokeWidth={1.3} />
              </div>

              <div className="flex-1">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-serif font-bold text-navy-900">{company.name}</h1>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-navy-500">
                      {company.industry && (
                        <>
                          <span className="flex items-center gap-1.5">
                            <Building2 size={14} />
                            {company.industry}
                          </span>
                          <span className="text-navy-200">·</span>
                        </>
                      )}
                      {company.location && (
                        <>
                          <span className="flex items-center gap-1.5">
                            <MapPin size={14} />
                            {company.location}
                          </span>
                          <span className="text-navy-200">·</span>
                        </>
                      )}
                      {company.employee_count && (
                        <>
                          <span className="flex items-center gap-1.5">
                            <Users size={14} />
                            {company.employee_count.toLocaleString()} employees
                          </span>
                          <span className="text-navy-200">·</span>
                        </>
                      )}
                      {company.founded_year && (
                        <span className="flex items-center gap-1.5">
                          <Calendar size={14} />
                          Founded {company.founded_year}
                        </span>
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
                  <p className="text-5xl font-serif font-bold text-navy-900">
                    {company.average_rating ? Number(company.average_rating).toFixed(1) : 'N/A'}
                  </p>
                  {company.average_rating && (
                    <>
                      <div className="flex justify-center mt-2">
                        <StarRating rating={Number(company.average_rating)} size={20} />
                      </div>
                      <p className="text-sm text-navy-400 mt-2">
                        Based on {company.total_reviews || 0} verified reviews
                      </p>
                    </>
                  )}
                  {!company.average_rating && (
                    <p className="text-sm text-navy-400 mt-2">No reviews yet</p>
                  )}
                </div>

                {/* Distribution */}
                <div className="pt-6 space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-navy-400 mb-4">
                    Rating Distribution
                  </h3>
                  {ratingDistribution.map(d => (
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

                {/* Quick stats */}
                <div className="mt-8 pt-6 border-t border-navy-100/50 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-navy-500">Total reviews</span>
                    <span className="font-semibold text-navy-900">{company.total_reviews || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-navy-500">Verified employees</span>
                    <span className="font-semibold text-navy-900">{company.verified_employees || 0}</span>
                  </div>
                  {company.is_verified && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-navy-500">Company status</span>
                      <span className="font-semibold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 size={13} />
                        Verified
                      </span>
                    </div>
                  )}
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
                  <option>Most Helpful</option>
                </select>
                <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-navy-400 pointer-events-none" />
              </div>
            </div>

            {/* Reviews loading */}
            {reviewsLoading && (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white rounded-2xl border border-navy-100/50 p-6 animate-pulse">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-navy-100" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-navy-100 rounded w-1/3" />
                        <div className="h-3 bg-navy-100 rounded w-1/4" />
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="h-4 bg-navy-100 rounded" />
                      <div className="h-4 bg-navy-100 rounded w-5/6" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Reviews list */}
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
                                {review.author_name ? review.author_name.split(' ').map(n => n[0]).join('') : 'U'}
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-sm text-navy-900">
                                {review.is_anonymous ? 'Anonymous Verified Employee' : (review.author_name || 'Employee')}
                              </span>
                              {review.is_anonymous && (
                                <Badge variant="info" size="sm">Anonymous</Badge>
                              )}
                              <Badge variant="success" size="sm">Verified</Badge>
                            </div>
                            <p className="text-xs text-navy-400 mt-0.5">
                              {review.position || 'Employee'} · {new Date(review.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <StarRating rating={review.rating} size={14} />
                          <span className="text-sm font-bold text-navy-900 ml-1">{review.rating}.0</span>
                        </div>
                      </div>

                      {/* Review text */}
                      <p className="mt-4 text-sm text-navy-600 leading-relaxed">
                        {review.review_text}
                      </p>

                      {/* Review footer */}
                      <div className="mt-5 pt-4 border-t border-navy-50 flex items-center justify-between">
                        <div className="text-xs text-navy-400">
                          {review.can_edit_until && new Date(review.can_edit_until) > new Date() && (
                            <span className="text-navy-400">Editable until {new Date(review.can_edit_until).toLocaleDateString()}</span>
                          )}
                        </div>
                        <button
                          onClick={() => setReportingId(reportingId === review.id ? null : review.id)}
                          className="flex items-center gap-1.5 text-xs text-navy-300 hover:text-red-500 transition-colors"
                        >
                          <Flag size={13} />
                          Report
                        </button>
                      </div>

                      {/* Inline report form */}
                      {reportingId === review.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          className="mt-4 p-4 bg-red-50/50 rounded-xl border border-red-100"
                        >
                          <p className="text-xs font-medium text-red-700 mb-2">
                            {!user ? 'Sign in to report this review' : 'Report this review'}
                          </p>
                          {!user ? (
                            <div className="flex gap-2">
                              <Link
                                to="/login"
                                className="h-8 px-4 bg-navy-900 text-white text-xs font-medium rounded-lg hover:bg-navy-800 transition-colors"
                              >
                                Sign In
                              </Link>
                              <button
                                onClick={() => setReportingId(null)}
                                className="h-8 px-4 text-xs text-navy-500 hover:text-navy-700 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <>
                              <select
                                value={reportReason}
                                onChange={(e) => setReportReason(e.target.value)}
                                className="w-full h-9 rounded-lg border border-red-200 bg-white px-3 text-xs text-navy-700 mb-2 focus:outline-none"
                              >
                                <option value="">Select reason...</option>
                                <option value="false_info">False information</option>
                                <option value="spam">Spam</option>
                                <option value="harassment">Harassment</option>
                                <option value="other">Other</option>
                              </select>
                              <textarea
                                value={reportDescription}
                                onChange={(e) => setReportDescription(e.target.value)}
                                placeholder="Additional details (optional)"
                                className="w-full h-16 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs text-navy-700 resize-none mb-2 focus:outline-none"
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={handleSubmitReport}
                                  disabled={reportSubmitting || !reportReason}
                                  className="h-8 px-4 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                  {reportSubmitting && <Loader2 size={12} className="animate-spin" />}
                                  {reportSubmitting ? 'Submitting...' : 'Submit Report'}
                                </button>
                                <button
                                  onClick={() => {
                                    setReportingId(null)
                                    setReportReason('')
                                    setReportDescription('')
                                  }}
                                  className="h-8 px-4 text-xs text-navy-500 hover:text-navy-700 transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            </>
                          )}
                        </motion.div>
                      )}
                    </div>
                  </Reveal>
                ))}
              </div>
            )}

            {/* Empty state */}
            {!reviewsLoading && reviews.length === 0 && (
              <div className="bg-white rounded-2xl border border-navy-100/50 p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-navy-100 flex items-center justify-center">
                  <Star size={28} className="text-navy-400" />
                </div>
                <h3 className="text-lg font-semibold text-navy-900 mb-2">No reviews yet</h3>
                <p className="text-sm text-navy-500 mb-6">
                  Be the first to share your experience working at {company.name}
                </p>
                <Link
                  to={`/companies/${id}/review`}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-navy-900 text-white text-sm font-medium rounded-xl hover:bg-navy-800 transition-colors"
                >
                  <PenSquare size={15} />
                  Write a Review
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
