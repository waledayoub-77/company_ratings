import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Star, ArrowLeft, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react'
import StarRating from '../components/ui/StarRating.jsx'

export default function WriteReviewPage() {
  const { id } = useParams()
  const [rating, setRating] = useState(0)
  const [review, setReview] = useState('')
  const [anonymous, setAnonymous] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const charCount = review.length
  const isValid = rating > 0 && charCount >= 50 && charCount <= 2000

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!isValid) return
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setSubmitted(true)
    }, 1500)
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
            Back to Stripe
          </Link>

          <h1 className="text-3xl font-serif font-bold text-navy-900 mb-2">
            Write Your Review
          </h1>
          <p className="text-navy-500 text-sm mb-10">
            Share your honest experience at Stripe. Your review helps others make informed career decisions.
          </p>

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
                        {anonymous ? '?' : 'JD'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-navy-900">
                        {anonymous ? 'Anonymous Verified Employee' : 'John Doe'}
                      </p>
                      <p className="text-[11px] text-navy-400">Software Engineer · Just now</p>
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
