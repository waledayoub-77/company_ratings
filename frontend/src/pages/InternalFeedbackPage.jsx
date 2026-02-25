import { useState, useEffect } from 'react'
import { submitFeedback } from '../api/feedback.js'
import { getMyEmployments } from '../api/employments.js'
import { getCompanyEmployees } from '../api/companies.js'
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
  Building2,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/ui/PageHeader.jsx'
import Reveal from '../components/ui/Reveal.jsx'

const categories = ['Professionalism', 'Communication', 'Teamwork', 'Reliability']

function getCurrentQuarter() {
  const now = new Date()
  return Math.ceil((now.getMonth() + 1) / 3)
}

export default function InternalFeedbackPage() {
  const [step, setStep] = useState('select')
  const [selectedPerson, setSelectedPerson] = useState(null)
  const [search, setSearch] = useState('')
  const [ratings, setRatings] = useState({})
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Data loading state
  const [coworkers, setCoworkers] = useState([])
  const [companies, setCompanies] = useState([])
  const [selectedCompanyId, setSelectedCompanyId] = useState(null)
  const [dataLoading, setDataLoading] = useState(true)
  const [dataError, setDataError] = useState('')

  // Load user's approved employments on mount
  useEffect(() => {
    async function loadEmployments() {
      setDataLoading(true)
      setDataError('')
      try {
        const res = await getMyEmployments()
        const employments = res.data || []
        const approved = employments.filter(
          e => e.verification_status === 'approved' && e.is_current
        )
        const companyMap = new Map()
        for (const emp of approved) {
          if (!companyMap.has(emp.company_id)) {
            companyMap.set(emp.company_id, {
              id: emp.company_id,
              name: emp.companies?.name || emp.company_name || 'Unknown Company',
            })
          }
        }
        const uniqueCompanies = Array.from(companyMap.values())
        setCompanies(uniqueCompanies)
        if (uniqueCompanies.length === 1) {
          setSelectedCompanyId(uniqueCompanies[0].id)
        }
      } catch (err) {
        setDataError(err.message || 'Failed to load your employments')
      } finally {
        setDataLoading(false)
      }
    }
    loadEmployments()
  }, [])

  // Load coworkers when a company is selected
  useEffect(() => {
    if (!selectedCompanyId) {
      setCoworkers([])
      return
    }
    async function loadCoworkers() {
      setDataLoading(true)
      setDataError('')
      try {
        const res = await getCompanyEmployees(selectedCompanyId)
        const employees = (res.data || []).map(emp => ({
          id: emp.id,
          name: emp.fullName || 'Unknown',
          position: emp.position || '',
          dept: emp.department || '',
          initials: (emp.fullName || 'U')
            .split(/\s+/)
            .map(w => w[0])
            .join('')
            .toUpperCase()
            .slice(0, 2),
        }))
        setCoworkers(employees)
      } catch (err) {
        setDataError(err.message || 'Failed to load coworkers')
      } finally {
        setDataLoading(false)
      }
    }
    loadCoworkers()
  }, [selectedCompanyId])

  const filtered = coworkers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.position.toLowerCase().includes(search.toLowerCase())
  )

  const allRated = categories.every(cat => ratings[cat] > 0)

  const handleSelectPerson = (person) => {
    setSelectedPerson(person)
    setRatings({})
    setComment('')
    setStep('rate')
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      const quarter = getCurrentQuarter()
      const year = new Date().getFullYear()

      await submitFeedback({
        ratedEmployeeId: selectedPerson.id,
        companyId: selectedCompanyId,
        professionalism: ratings['Professionalism'],
        communication: ratings['Communication'],
        teamwork: ratings['Teamwork'],
        reliability: ratings['Reliability'],
        writtenFeedback: comment.trim() || undefined,
        quarter,
        year,
      })
      setStep('success')
    } catch (err) {
      const msg = err?.message ?? ''
      if (msg.includes('409') || msg.toLowerCase().includes('quarter') || msg.toLowerCase().includes('already')) {
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

              {/* Company selector (if multiple companies) */}
              {companies.length > 1 && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-navy-700 mb-2">Select Company</label>
                  <div className="flex flex-wrap gap-2">
                    {companies.map(company => (
                      <button
                        key={company.id}
                        onClick={() => setSelectedCompanyId(company.id)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                          selectedCompanyId === company.id
                            ? 'bg-navy-900 text-white border-navy-900'
                            : 'bg-white text-navy-600 border-navy-200 hover:border-navy-300'
                        }`}
                      >
                        <Building2 size={14} />
                        {company.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Loading state */}
              {dataLoading && (
                <div className="text-center py-16">
                  <Loader2 size={28} className="text-navy-400 mx-auto mb-3 animate-spin" />
                  <p className="text-sm text-navy-400">Loading coworkers...</p>
                </div>
              )}

              {/* Error state */}
              {dataError && !dataLoading && (
                <div className="text-center py-16">
                  <AlertCircle size={32} className="text-red-400 mx-auto mb-3" />
                  <p className="text-sm text-red-600 mb-4">{dataError}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="h-9 px-5 bg-navy-900 text-white text-sm font-medium rounded-lg hover:bg-navy-800 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* No approved employment */}
              {!dataLoading && !dataError && companies.length === 0 && (
                <div className="text-center py-16">
                  <Building2 size={32} className="text-navy-200 mx-auto mb-3" />
                  <p className="text-sm text-navy-500 mb-2">No approved employment found.</p>
                  <p className="text-xs text-navy-400">You need an approved employment at a company to give peer feedback.</p>
                </div>
              )}

              {/* Coworker list */}
              {!dataLoading && !dataError && selectedCompanyId && (
                <>
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

                  <div className="space-y-3">
                    {filtered.map((person, i) => (
                      <Reveal key={person.id} delay={i * 0.05}>
                        <button
                          onClick={() => handleSelectPerson(person)}
                          className="w-full flex items-center gap-4 bg-white rounded-2xl border border-navy-100/50 hover:border-navy-200 hover:shadow-md p-5 text-left transition-all duration-200 cursor-pointer"
                        >
                          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-navy-500 to-navy-700 flex items-center justify-center shrink-0">
                            <span className="text-white text-sm font-semibold">{person.initials}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-navy-900 text-sm">{person.name}</h3>
                            <p className="text-xs text-navy-400 mt-0.5">
                              {person.position}{person.dept ? ` · ${person.dept}` : ''}
                            </p>
                          </div>
                          <ChevronRight size={16} className="text-navy-300" />
                        </button>
                      </Reveal>
                    ))}
                  </div>

                  {filtered.length === 0 && !dataLoading && (
                    <div className="text-center py-12">
                      <Users size={32} className="text-navy-200 mx-auto mb-3" />
                      <p className="text-sm text-navy-400">
                        {coworkers.length === 0
                          ? 'No coworkers found at this company.'
                          : 'No coworkers found matching your search.'}
                      </p>
                    </div>
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
                    <span className="text-white text-lg font-semibold">{selectedPerson.initials}</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-navy-900">{selectedPerson.name}</h2>
                    <p className="text-sm text-navy-500">
                      {selectedPerson.position}{selectedPerson.dept ? ` · ${selectedPerson.dept}` : ''}
                    </p>
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

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
                  <AlertCircle size={14} className="shrink-0" />
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
                    <Loader2 size={16} className="animate-spin" />
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
