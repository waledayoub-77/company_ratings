import { useState, useEffect } from 'react'
import { submitFeedback, getCoworkers } from '../api/feedback.js'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Star,
  MessageSquare,
  Users,
  Search,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Send,
  ArrowLeft,
  Loader2,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/ui/PageHeader.jsx'
import Reveal from '../components/ui/Reveal.jsx'

const ITEMS_PER_PAGE = 6
const categories = ['Professionalism', 'Communication', 'Teamwork', 'Reliability']

function getInitials(name = '') {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return (parts[0]?.[0] ?? '?').toUpperCase()
}

export default function InternalFeedbackPage() {
  const [step, setStep] = useState('select')
  const [selectedPerson, setSelectedPerson] = useState(null)
  const [search, setSearch] = useState('')
  const [ratings, setRatings] = useState({})
  const [comment, setComment] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  /* ── Coworkers data ── */
  const [coworkers, setCoworkers] = useState([])
  const [loadingCoworkers, setLoadingCoworkers] = useState(true)
  const [coworkersError, setCoworkersError] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    let cancelled = false
    setLoadingCoworkers(true)
    setCoworkersError('')
    getCoworkers()
      .then((res) => {
        if (cancelled) return
        setCoworkers(res?.data ?? [])
      })
      .catch((err) => {
        if (cancelled) return
        setCoworkersError(err?.message || 'Failed to load coworkers.')
      })
      .finally(() => { if (!cancelled) setLoadingCoworkers(false) })
    return () => { cancelled = true }
  }, [])

  const filtered = coworkers.filter(c =>
    (c.fullName ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (c.position ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (c.companyName ?? '').toLowerCase().includes(search.toLowerCase())
  )

  /* pagination */
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const pageItems  = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  const allRated = categories.every(cat => ratings[cat] > 0)

  const handleSelectPerson = (person) => {
    setSelectedPerson(person)
    setRatings({})
    setComment('')
    setIsAnonymous(false)
    setStep('rate')
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      await submitFeedback({
        ratedEmployeeId: selectedPerson.employeeId,
        companyId:       selectedPerson.companyId,
        professionalism: parseInt(ratings['Professionalism'], 10),
        communication:   parseInt(ratings['Communication'],   10),
        teamwork:        parseInt(ratings['Teamwork'],        10),
        reliability:     parseInt(ratings['Reliability'],     10),
        writtenFeedback: comment.trim() || undefined,
        quarter:         parseInt(selectedPerson.quarter, 10) || Math.ceil((new Date().getMonth() + 1) / 3),
        year:            parseInt(selectedPerson.year,    10) || new Date().getFullYear(),
        isAnonymous,
      })
      /* mark as rated locally so UI reflects it immediately */
      setCoworkers(prev => prev.map(c =>
        c.employeeId === selectedPerson.employeeId && c.companyId === selectedPerson.companyId
          ? { ...c, alreadyRated: true }
          : c
      ))
      setStep('success')
    } catch (err) {
      const msg = err?.message ?? ''
      if (msg.includes('409') || msg.toLowerCase().includes('quarter') || msg.toLowerCase().includes('already') || msg.toLowerCase().includes('exists')) {
        setError('You have already submitted feedback for this person this quarter.')
      } else {
        setError(msg || 'Failed to submit feedback. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setStep('select')
    setSelectedPerson(null)
    setRatings({})
    setComment('')
    setIsAnonymous(false)
    setPage(1)
  }

  return (
    <div className="min-h-screen bg-ice-50">
      <PageHeader
        tag="Internal Feedback"
        title="Peer Feedback Module"
        subtitle="Rate your coworkers on key professional dimensions. Feedback is visible only to the rated employee and your company admin."
        backHref
      />

      <div className="max-w-5xl mx-auto px-6 lg:px-8 pb-20">
        <AnimatePresence mode="wait">
          {step === 'select' && (
            <motion.div
              key="select"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Info banner */}
              <div className="bg-navy-900 rounded-2xl p-6 mb-8 text-white">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                    <MessageSquare size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">How it works</h3>
                    <p className="text-sm text-navy-300 leading-relaxed">
                      Select a coworker from your company, rate them on 4 categories (1–5 stars each), 
                      and optionally leave a written comment. You can submit one feedback per person per quarter.
                      Feedback is <strong className="text-white">not anonymous</strong> — your name will be shown.
                    </p>
                  </div>
                </div>
              </div>

              {/* Search coworkers */}
              <div className="mb-6">
                <div className="relative">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-navy-400" />
                  <input
                    type="text"
                    placeholder="Search by name, position or company..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                    className="w-full h-12 rounded-xl border border-navy-200 bg-white pl-11 pr-4 text-sm placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 transition-all"
                  />
                </div>
              </div>

              {/* Loading / error states */}
              {loadingCoworkers && (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-navy-400">
                  <Loader2 size={28} className="animate-spin" />
                  <p className="text-sm">Loading your coworkers…</p>
                </div>
              )}

              {!loadingCoworkers && coworkersError && (
                <div className="text-center py-12">
                  <Users size={32} className="text-red-300 mx-auto mb-3" />
                  <p className="text-sm text-red-500">{coworkersError}</p>
                </div>
              )}

              {!loadingCoworkers && !coworkersError && (
                <>
                  {/* Coworker grid */}
                  {pageItems.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                      {pageItems.map((person, i) => {
                        const initials = getInitials(person.fullName)
                        return (
                          <Reveal key={`${person.employeeId}-${person.companyId}`} delay={i * 0.04}>
                            <button
                              onClick={() => !person.alreadyRated && handleSelectPerson(person)}
                              disabled={person.alreadyRated}
                              className={`w-full flex flex-col items-start bg-white rounded-2xl border p-5 text-left transition-all duration-200 ${
                                person.alreadyRated
                                  ? 'border-navy-100/50 opacity-55 cursor-not-allowed'
                                  : 'border-navy-100/50 hover:border-navy-300 hover:shadow-md cursor-pointer'
                              }`}
                            >
                              <div className="flex items-center justify-between w-full mb-3">
                                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-navy-500 to-navy-700 flex items-center justify-center shrink-0">
                                  <span className="text-white text-sm font-semibold">{initials}</span>
                                </div>
                                {person.alreadyRated ? (
                                  <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                                    Rated Q{person.quarter}
                                  </span>
                                ) : (
                                  <ChevronRight size={15} className="text-navy-300" />
                                )}
                              </div>
                              <h3 className="font-semibold text-navy-900 text-sm leading-snug">{person.fullName}</h3>
                              <p className="text-xs text-navy-400 mt-0.5 truncate w-full">{person.position}{person.department ? ` · ${person.department}` : ''}</p>
                              <p className="text-[11px] text-navy-300 mt-1.5 truncate w-full">{person.companyName}</p>
                            </button>
                          </Reveal>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Users size={32} className="text-navy-200 mx-auto mb-3" />
                      <p className="text-sm text-navy-400">
                        {search ? 'No coworkers found matching your search.' : 'No coworkers found. Make sure you have an approved employment at a company.'}
                      </p>
                    </div>
                  )}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="w-9 h-9 rounded-xl border border-navy-200 flex items-center justify-center text-navy-500 hover:bg-navy-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >
                        <ChevronLeft size={16} />
                      </button>

                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={`w-9 h-9 rounded-xl text-sm font-medium transition-all ${
                            p === page
                              ? 'bg-navy-900 text-white shadow-sm'
                              : 'border border-navy-200 text-navy-600 hover:bg-navy-50'
                          }`}
                        >
                          {p}
                        </button>
                      ))}

                      <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="w-9 h-9 rounded-xl border border-navy-200 flex items-center justify-center text-navy-500 hover:bg-navy-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  )}

                  {/* Count line */}
                  {filtered.length > 0 && (
                    <p className="text-center text-xs text-navy-300 mt-4">
                      Showing {Math.min((page - 1) * ITEMS_PER_PAGE + 1, filtered.length)}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} coworker{filtered.length !== 1 ? 's' : ''}
                    </p>
                  )}
                </>
              )}
            </motion.div>
          )}

          {step === 'rate' && selectedPerson && (
            <motion.div
              key="rate"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Back */}
              <button
                onClick={() => setStep('select')}
                className="inline-flex items-center gap-2 text-sm text-navy-500 hover:text-navy-700 transition-colors mb-6"
              >
                <ArrowLeft size={15} />
                Back to coworkers
              </button>

              {/* Person header */}
              <div className="bg-white rounded-2xl border border-navy-100/50 p-6 mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-navy-500 to-navy-700 flex items-center justify-center">
                    <span className="text-white text-lg font-semibold">{getInitials(selectedPerson?.fullName)}</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-navy-900">{selectedPerson?.fullName}</h2>
                    <p className="text-sm text-navy-500">
                      {selectedPerson?.position}
                      {selectedPerson?.department ? ` · ${selectedPerson.department}` : ''}
                    </p>
                    <p className="text-xs text-navy-400 mt-0.5">{selectedPerson?.companyName}</p>
                  </div>
                </div>
              </div>

              {/* Rating categories */}
              <div className="space-y-4 mb-6">
                {categories.map((cat, i) => (
                  <Reveal key={cat} delay={i * 0.08}>
                    <div className="bg-white rounded-2xl border border-navy-100/50 p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-semibold text-navy-900">{cat}</h3>
                          <p className="text-xs text-navy-400 mt-0.5">
                            {cat === 'Professionalism' && 'Conduct, ethics, and work standards'}
                            {cat === 'Communication' && 'Clarity, responsiveness, and listening skills'}
                            {cat === 'Teamwork' && 'Collaboration, support, and group contribution'}
                            {cat === 'Reliability' && 'Dependability, punctuality, and follow-through'}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map(s => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => setRatings(prev => ({ ...prev, [cat]: s }))}
                                className="transition-transform hover:scale-110"
                              >
                                <Star
                                  size={24}
                                  strokeWidth={1.5}
                                  className={
                                    s <= (ratings[cat] || 0)
                                      ? 'fill-amber-400 text-amber-400'
                                      : 'fill-navy-100 text-navy-200 hover:fill-navy-200 hover:text-navy-300'
                                  }
                                />
                              </button>
                            ))}
                          </div>
                          {ratings[cat] && (
                            <span className="text-lg font-serif font-bold text-navy-900 w-6 text-center">
                              {ratings[cat]}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>

              {/* Optional comment */}
              <Reveal delay={0.3}>
                <div className="bg-white rounded-2xl border border-navy-100/50 p-6 mb-6">
                  <h3 className="text-sm font-semibold text-navy-900 mb-1">
                    Written Feedback <span className="font-normal text-navy-400">(optional)</span>
                  </h3>
                  <p className="text-xs text-navy-400 mb-3">Max 1,000 characters. Be constructive and specific.</p>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value.slice(0, 1000))}
                    placeholder="Share specific examples of what this person does well or could improve..."
                    className="w-full h-32 rounded-xl border border-navy-200 bg-white px-4 py-3 text-sm placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 transition-all resize-none leading-relaxed"
                  />
                  <p className="text-xs text-navy-400 text-right mt-1">{comment.length}/1,000</p>
                </div>
              </Reveal>

              {/* Visibility notice */}
              <Reveal delay={0.35}>
                <div className="bg-white rounded-2xl border border-navy-100/50 p-6 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-navy-900 mb-1">Anonymous Feedback</h3>
                      <p className="text-xs text-navy-400">
                        {isAnonymous
                          ? 'Your name will be hidden from the recipient. Only the company admin can see who submitted it.'
                          : 'Your name will be shown to the recipient and the company admin.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsAnonymous(!isAnonymous)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        isAnonymous ? 'bg-navy-900' : 'bg-navy-200'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        isAnonymous ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                </div>
              </Reveal>

              <div className="bg-ice-500/20 rounded-xl p-4 mb-6 flex items-start gap-3">
                <MessageSquare size={16} className="text-navy-500 mt-0.5 shrink-0" />
                <p className="text-xs text-navy-600 leading-relaxed">
                  <strong>Visibility:</strong> This feedback will be visible to <strong>{selectedPerson?.fullName}</strong> and 
                  your <strong>company admin</strong>. {isAnonymous ? 'Your name will be hidden from the recipient.' : 'Your name will be shown as the reviewer.'}
                  Feedback is immutable — it cannot be deleted after submission.
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                  <Send size={14} className="shrink-0" />
                  {error}
                </div>
              )}

              {/* Submit */}
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setStep('select')}
                  className="h-11 px-5 text-sm text-navy-500 hover:text-navy-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!allRated || loading}
                  className="h-11 px-7 bg-navy-900 text-white text-sm font-medium rounded-xl inline-flex items-center gap-2 hover:bg-navy-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                >
                  {loading ? (
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <>
                      <Send size={15} />
                      Submit Feedback
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16"
            >
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={32} className="text-emerald-500" />
              </div>
              <h2 className="text-2xl font-serif font-bold text-navy-900 mb-3">
                Feedback Submitted!
              </h2>
              <p className="text-sm text-navy-500 mb-8 max-w-sm mx-auto leading-relaxed">
                Your feedback for {selectedPerson?.fullName} has been submitted successfully. 
                They will be notified and can view your ratings.
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={handleReset}
                  className="h-11 px-6 bg-navy-900 text-white text-sm font-medium rounded-xl hover:bg-navy-800 transition-all"
                >
                  Rate Another Coworker
                </button>
                <Link
                  to="/dashboard"
                  className="h-11 px-6 border border-navy-200 text-navy-700 text-sm font-medium rounded-xl inline-flex items-center hover:bg-navy-50 transition-all"
                >
                  Back to Dashboard
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
