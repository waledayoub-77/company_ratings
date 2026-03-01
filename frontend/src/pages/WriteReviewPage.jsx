import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Eye, EyeOff, CheckCircle2, AlertCircle, Briefcase, TrendingUp, Users, Heart, Building, Sparkles } from 'lucide-react'
import StarRating from '../components/ui/StarRating.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { getCompanyById } from '../api/companies.js'
import { createReview } from '../api/reviews.js'

const CATEGORIES = [
  { key: 'work_life_balance', label: 'Work-Life Balance', icon: Heart,       color: 'from-pink-500 to-rose-500' },
  { key: 'compensation',      label: 'Compensation & Benefits', icon: TrendingUp, color: 'from-emerald-500 to-teal-500' },
  { key: 'management',        label: 'Management Quality', icon: Users,      color: 'from-blue-500 to-indigo-500' },
  { key: 'culture',           label: 'Company Culture', icon: Sparkles,    color: 'from-violet-500 to-purple-500' },
  { key: 'career_growth',     label: 'Career Growth', icon: Briefcase,   color: 'from-amber-500 to-orange-500' },
  { key: 'facilities',        label: 'Facilities & Environment', icon: Building, color: 'from-cyan-500 to-blue-500' },
]

const DEPARTURE_REASONS = [
  { value: '', label: 'Select (optional)' },
  { value: 'still_employed', label: 'Still employed here' },
  { value: 'better_opportunity', label: 'Found a better opportunity' },
  { value: 'laid_off', label: 'Laid off / Downsized' },
  { value: 'contract_ended', label: 'Contract ended' },
  { value: 'relocated', label: 'Relocated' },
  { value: 'career_change', label: 'Career change' },
  { value: 'management_issues', label: 'Management issues' },
  { value: 'compensation', label: 'Inadequate compensation' },
  { value: 'work_life_balance', label: 'Poor work-life balance' },
  { value: 'other', label: 'Other / Prefer not to say' },
]

export default function WriteReviewPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [companyName, setCompanyName] = useState('')
  const [rating, setRating] = useState(0)
  const [review, setReview] = useState('')
  const [anonymous, setAnonymous] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [categoryRatings, setCategoryRatings] = useState({})
  const [departureReason, setDepartureReason] = useState('')

  useEffect(() => {
    if (user?.role === 'company_admin' || user?.role === 'system_admin') {
      navigate('/dashboard', { replace: true })
    }
  }, [user, navigate])

  useEffect(() => {
    getCompanyById(id)
      .then(res => setCompanyName(res?.data?.name ?? res?.name ?? ''))
      .catch(() => {})
  }, [id])

  const charCount = review.length
  const isValid = rating > 0 && charCount >= 50 && charCount <= 2000

  const userInitials = (user?.full_name ?? user?.fullName ?? '')
    .split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'ME'
  const userName = user?.full_name ?? user?.fullName ?? 'You'

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isValid) return
    setLoading(true)
    setError('')
    try {
      await createReview({
        companyId: id,
        overallRating: rating,
        content: review,
        isAnonymous: anonymous,
        categoryRatings: Object.keys(categoryRatings).length > 0 ? categoryRatings : undefined,
        departureReason: departureReason || undefined,
      })
      setSubmitted(true)
    } catch (err) {
      const msg = err?.message ?? ''
      if (msg.toLowerCase().includes('verif') || msg.toLowerCase().includes('employ')) {
        setError('You must have a verified employment at this company to write a review.')
      } else if (msg.toLowerCase().includes('duplicate') || msg.toLowerCase().includes('already')) {
        setError('You have already submitted a review for this company.')
      } else {
        setError(msg || 'Failed to submit review. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-ice-50 flex items-center justify-center px-6">
        <motion.div
          className="max-w-md text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={32} className="text-emerald-500" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-navy-900 mb-3">
            Review Published!
          </h1>
          <p className="text-sm text-navy-500 mb-8 leading-relaxed">
            Your verified review has been published successfully.
            {anonymous ? ' Your identity remains fully anonymous.' : ''}
            {' '}A confirmation email has been sent to your inbox.
          </p>
          <div className="flex justify-center gap-3">
            <Link
              to={`/companies/${id}`}
              className="h-11 px-6 bg-navy-900 text-white text-sm font-medium rounded-xl inline-flex items-center gap-2 hover:bg-navy-800 transition-all"
            >
              View Company
            </Link>
            <Link
              to="/dashboard"
              className="h-11 px-6 border border-navy-200 text-navy-700 text-sm font-medium rounded-xl inline-flex items-center hover:bg-navy-50 transition-all"
            >
              Go to Dashboard
            </Link>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ice-50">
      <div className="max-w-3xl mx-auto px-6 lg:px-8 pt-28 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Back link */}
          <Link
            to={`/companies/${id}`}
            className="inline-flex items-center gap-2 text-sm text-navy-500 hover:text-navy-700 transition-colors mb-8"
          >
            <ArrowLeft size={15} />
            {companyName ? `Back to ${companyName}` : 'Back to Company'}
          </Link>

          <h1 className="text-3xl font-serif font-bold text-navy-900 mb-2">
            Write Your Review
          </h1>
          <p className="text-navy-500 text-sm mb-10">
            Share your honest experience{companyName ? ` at ${companyName}` : ''}. Your review helps others make informed career decisions.
          </p>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-6">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Rating */}
            <div className="bg-white rounded-2xl border border-navy-100/50 p-6">
              <h3 className="text-sm font-semibold text-navy-900 mb-4">Overall Rating *</h3>
              <div className="flex items-center gap-4">
                <StarRating rating={rating} size={32} interactive onChange={setRating} />
                {rating > 0 && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-2xl font-serif font-bold text-navy-900"
                  >
                    {rating}.0
                  </motion.span>
                )}
              </div>
              {rating === 0 && (
                <p className="mt-2 text-xs text-navy-400">Click a star to set your rating</p>
              )}
            </div>

            {/* Written review */}
            <div className="bg-white rounded-2xl border border-navy-100/50 p-6">
              <h3 className="text-sm font-semibold text-navy-900 mb-1">Your Review *</h3>
              <p className="text-xs text-navy-400 mb-4">
                Minimum 50 characters. Be specific and constructive.
              </p>
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="Share your experience working at this company. What do you like? What could be improved? Would you recommend it to others?"
                className="w-full h-48 rounded-xl border border-navy-200 bg-white px-4 py-3 text-sm text-navy-900 placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 transition-all resize-none leading-relaxed"
              />
              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {charCount < 50 && charCount > 0 && (
                    <span className="flex items-center gap-1 text-xs text-amber-600">
                      <AlertCircle size={12} />
                      {50 - charCount} more characters needed
                    </span>
                  )}
                  {charCount >= 50 && (
                    <span className="flex items-center gap-1 text-xs text-emerald-600">
                      <CheckCircle2 size={12} />
                      Meets minimum length
                    </span>
                  )}
                </div>
                <span className={`text-xs font-medium ${charCount > 2000 ? 'text-red-500' : 'text-navy-400'}`}>
                  {charCount}/2,000
                </span>
              </div>
            </div>

            {/* Category Ratings */}
            <div className="bg-white rounded-2xl border border-navy-100/50 p-6">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-semibold text-navy-900">Category Ratings</h3>
                <span className="text-[11px] text-navy-300 font-medium">Optional</span>
              </div>
              <p className="text-xs text-navy-400 mb-5">
                Rate specific aspects on a scale of 1–10 to help others understand your experience better.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                {CATEGORIES.map(cat => {
                  const val = categoryRatings[cat.key] || 0
                  return (
                    <div key={cat.key} className="bg-ice-50 rounded-xl p-4 border border-navy-50">
                      <div className="flex items-center gap-2 mb-3">
                        <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${cat.color} flex items-center justify-center`}>
                          <cat.icon size={14} className="text-white" />
                        </div>
                        <span className="text-xs font-semibold text-navy-700">{cat.label}</span>
                        {val > 0 && (
                          <span className="ml-auto text-sm font-bold text-navy-900">{val}/10</span>
                        )}
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        value={val}
                        onChange={e => {
                          const v = parseInt(e.target.value)
                          setCategoryRatings(prev => {
                            if (v === 0) {
                              const next = { ...prev }
                              delete next[cat.key]
                              return next
                            }
                            return { ...prev, [cat.key]: v }
                          })
                        }}
                        className="w-full h-2 rounded-full appearance-none cursor-pointer accent-navy-600"
                        style={{
                          background: val > 0
                            ? `linear-gradient(to right, #1e3a5f ${val * 10}%, #e2e8f0 ${val * 10}%)`
                            : '#e2e8f0'
                        }}
                      />
                      <div className="flex justify-between mt-1">
                        <span className="text-[10px] text-navy-300">1</span>
                        <span className="text-[10px] text-navy-300">5</span>
                        <span className="text-[10px] text-navy-300">10</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Departure Reason */}
            <div className="bg-white rounded-2xl border border-navy-100/50 p-6">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-semibold text-navy-900">Employment Status</h3>
                <span className="text-[11px] text-navy-300 font-medium">Optional</span>
              </div>
              <p className="text-xs text-navy-400 mb-4">
                Why did you leave this company? This helps others understand the context of your review.
              </p>
              <select
                value={departureReason}
                onChange={e => setDepartureReason(e.target.value)}
                className="w-full sm:w-72 h-10 rounded-xl border border-navy-200 bg-white px-3 text-sm text-navy-700 focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 transition-all"
              >
                {DEPARTURE_REASONS.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            {/* Anonymous toggle */}
            <div className="bg-white rounded-2xl border border-navy-100/50 p-6">
              <div className="flex items-start gap-4">
                <button
                  type="button"
                  onClick={() => setAnonymous(!anonymous)}
                  className={`relative w-12 h-7 rounded-full transition-colors duration-200 shrink-0 mt-0.5 ${
                    anonymous ? 'bg-navy-900' : 'bg-navy-200'
                  }`}
                >
                  <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
                    anonymous ? 'left-6' : 'left-1'
                  }`} />
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    {anonymous ? <EyeOff size={16} className="text-navy-700" /> : <Eye size={16} className="text-navy-400" />}
                    <h3 className="text-sm font-semibold text-navy-900">
                      {anonymous ? 'Anonymous Review' : 'Public Review'}
                    </h3>
                  </div>
                  <p className="text-xs text-navy-500 mt-1 leading-relaxed">
                    {anonymous
                      ? 'Your review will be shown as "Anonymous Verified Employee". Your identity is fully protected — even company admins cannot see who you are.'
                      : 'Your name and position will be visible on this review. Switch to anonymous if you prefer privacy.'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Preview */}
            {(rating > 0 || review.length > 0) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-navy-50/50 rounded-2xl border border-navy-100/50 p-6"
              >
                <h3 className="text-xs font-semibold uppercase tracking-wider text-navy-400 mb-4">Preview</h3>
                <div className="bg-white rounded-xl p-5 border border-navy-100/50">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-lg bg-navy-100 flex items-center justify-center">
                      <span className="text-navy-500 text-xs font-semibold">
                        {anonymous ? '?' : userInitials}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-navy-900">
                        {anonymous ? 'Anonymous Verified Employee' : userName}
                      </p>
                      <p className="text-[11px] text-navy-400">Just now</p>
                    </div>
                  </div>
                  {rating > 0 && <StarRating rating={rating} size={14} />}
                  {review && <p className="mt-2 text-sm text-navy-600 leading-relaxed">{review}</p>}
                </div>
              </motion.div>
            )}

            {/* Submit */}
            <div className="flex items-center justify-between pt-4">
              <p className="text-xs text-navy-400">
                Reviews can be edited within 48 hours of submission.
              </p>
              <button
                type="submit"
                disabled={!isValid || loading}
                className="h-12 px-8 bg-navy-900 text-white text-sm font-medium rounded-xl flex items-center gap-2 hover:bg-navy-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm shadow-navy-900/15"
              >
                {loading ? (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  'Publish Review'
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
