import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Star,
  MessageSquare,
  Users,
  Search,
  CheckCircle2,
  ChevronRight,
  Send,
  ArrowLeft,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/ui/PageHeader.tsx'
import Reveal from '../components/ui/Reveal.tsx'

/* ─── Mock data ─── */
const coworkers = [
  { id: 1, name: 'Sarah Miller', position: 'Product Manager', dept: 'Product', initials: 'SM', lastFeedback: null },
  { id: 2, name: 'James Wilson', position: 'Backend Engineer', dept: 'Engineering', initials: 'JW', lastFeedback: 'Q4 2025' },
  { id: 3, name: 'Priya Patel', position: 'UX Designer', dept: 'Design', initials: 'PP', lastFeedback: null },
  { id: 4, name: 'David Kim', position: 'DevOps Engineer', dept: 'Engineering', initials: 'DK', lastFeedback: 'Q4 2025' },
  { id: 5, name: 'Lisa Chen', position: 'QA Lead', dept: 'Engineering', initials: 'LC', lastFeedback: null },
]

const categories = ['Professionalism', 'Communication', 'Teamwork', 'Reliability'] as const

export default function InternalFeedbackPage() {
  const [step, setStep] = useState<'select' | 'rate' | 'success'>('select')
  const [selectedPerson, setSelectedPerson] = useState<typeof coworkers[0] | null>(null)
  const [search, setSearch] = useState('')
  const [ratings, setRatings] = useState<Record<string, number>>({})
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)

  const filtered = coworkers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.position.toLowerCase().includes(search.toLowerCase())
  )

  const allRated = categories.every(cat => ratings[cat] > 0)

  const handleSelectPerson = (person: typeof coworkers[0]) => {
    setSelectedPerson(person)
    setRatings({})
    setComment('')
    setStep('rate')
  }

  const handleSubmit = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setStep('success')
    }, 1500)
  }

  const handleReset = () => {
    setStep('select')
    setSelectedPerson(null)
    setRatings({})
    setComment('')
  }

  return (
    <div className="min-h-screen bg-ice-50">
      <PageHeader
        tag="Internal Feedback"
        title="Peer Feedback Module"
        subtitle="Rate your coworkers on key professional dimensions. Feedback is visible only to the rated employee and your company admin."
      />

      <div className="max-w-3xl mx-auto px-6 lg:px-8 pb-20">
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
                    placeholder="Search coworkers by name or position..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full h-12 rounded-xl border border-navy-200 bg-white pl-11 pr-4 text-sm placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 transition-all"
                  />
                </div>
              </div>

              {/* Coworker list */}
              <div className="space-y-3">
                {filtered.map((person, i) => {
                  const canRate = !person.lastFeedback || person.lastFeedback !== 'Q1 2026'
                  return (
                    <Reveal key={person.id} delay={i * 0.05}>
                      <button
                        onClick={() => canRate && handleSelectPerson(person)}
                        disabled={!canRate}
                        className={`w-full flex items-center gap-4 bg-white rounded-2xl border p-5 text-left transition-all duration-200 ${
                          canRate
                            ? 'border-navy-100/50 hover:border-navy-200 hover:shadow-md cursor-pointer'
                            : 'border-navy-100/50 opacity-60 cursor-not-allowed'
                        }`}
                      >
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-navy-500 to-navy-700 flex items-center justify-center shrink-0">
                          <span className="text-white text-sm font-semibold">{person.initials}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-navy-900 text-sm">{person.name}</h3>
                          <p className="text-xs text-navy-400 mt-0.5">{person.position} · {person.dept}</p>
                        </div>
                        {canRate ? (
                          <ChevronRight size={16} className="text-navy-300" />
                        ) : (
                          <span className="text-[10px] font-medium text-navy-400 bg-navy-50 px-2.5 py-1 rounded-full">
                            Rated in Q1
                          </span>
                        )}
                      </button>
                    </Reveal>
                  )
                })}
              </div>

              {filtered.length === 0 && (
                <div className="text-center py-12">
                  <Users size={32} className="text-navy-200 mx-auto mb-3" />
                  <p className="text-sm text-navy-400">No coworkers found matching your search.</p>
                </div>
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
                    <span className="text-white text-lg font-semibold">{selectedPerson.initials}</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-navy-900">{selectedPerson.name}</h2>
                    <p className="text-sm text-navy-500">{selectedPerson.position} · {selectedPerson.dept}</p>
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
              <div className="bg-ice-500/20 rounded-xl p-4 mb-6 flex items-start gap-3">
                <MessageSquare size={16} className="text-navy-500 mt-0.5 shrink-0" />
                <p className="text-xs text-navy-600 leading-relaxed">
                  <strong>Visibility:</strong> This feedback will be visible to <strong>{selectedPerson.name}</strong> and 
                  your <strong>company admin</strong>. Your name will be shown as the reviewer.
                  Feedback is immutable — it cannot be deleted after submission.
                </p>
              </div>

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
                Your feedback for {selectedPerson?.name} has been submitted successfully. 
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
