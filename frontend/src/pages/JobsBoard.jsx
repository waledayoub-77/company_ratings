import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Country, City } from 'country-state-city'
import { Users, Briefcase, MapPin, Loader2, Search, ChevronDown, FileText, CheckCircle2, Send } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext.jsx'
import { request } from '../api/client'
import { applyToJob, getMyApplications } from '../api/jobs'
import PageHeader from '../components/ui/PageHeader.jsx'
import Reveal from '../components/ui/Reveal.jsx'

const ALL_COUNTRIES = Country.getAllCountries().map(c => ({ name: c.name, isoCode: c.isoCode }))

const INDUSTRIES = [
  'Technology', 'Software & SaaS', 'Finance & Banking', 'Healthcare',
  'Education', 'Retail & E-commerce', 'Manufacturing', 'Consulting',
].sort()

export default function JobsBoard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [country, setCountry] = useState('')
  const [city, setCity] = useState('')
  const [industry, setIndustry] = useState('')
  const [applying, setApplying] = useState({})
  const [appliedIds, setAppliedIds] = useState(new Set())
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 5

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const res = await request('/jobs/all')
        if (!cancelled) setJobs(res.data || [])
      } catch (e) {
        if (!cancelled) setJobs([])
      } finally { if (!cancelled) setLoading(false) }
    })()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!user) return
    getMyApplications()
      .then(res => setAppliedIds(new Set((res.data || []).map(a => a.position_id))))
      .catch(() => {})
  }, [user])

  const availableCities = useMemo(() => {
    const sel = ALL_COUNTRIES.find(c => c.name === country)
    const iso = sel?.isoCode
    return iso ? [...new Set(City.getCitiesOfCountry(iso).map(x => x.name))].sort() : []
  }, [country])

  // Custom dropdown controls to ensure options open downward
  const [countryOpen, setCountryOpen] = useState(false)
  const [cityOpen, setCityOpen] = useState(false)
  const countryRef = useRef(null)
  const cityRef = useRef(null)

  useEffect(() => {
    function onDoc(e) {
      if (countryRef.current && !countryRef.current.contains(e.target)) setCountryOpen(false)
      if (cityRef.current && !cityRef.current.contains(e.target)) setCityOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])


  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return jobs.filter(j => {
      if (j.is_active === false) return false
      const jobIndustry = (j.companies?.industry || j.company?.industry || j.industry || '')
      if (industry && jobIndustry.toLowerCase() !== industry.toLowerCase()) return false
      if (country && city) {
        if (!j.location) return false
        if (!j.location.toLowerCase().includes(city.toLowerCase())) return false
      } else if (country) {
        if (!j.location) return false
        if (!j.location.toLowerCase().includes(country.toLowerCase())) return false
      }
      if (!q) return true
      const companyName = (j.companies?.name || j.company?.name || j.company_name || '').toLowerCase()
      const title = (j.title || '').toLowerCase()
      return companyName.includes(q) || title.includes(q)
    })
  }, [jobs, search, country, city, industry])

  // Reset page when filters change
  useEffect(() => { setPage(1) }, [search, country, city, industry])

  const handleApply = async (positionId) => {
    if (!user) { navigate('/login?redirect=/jobs'); return }
    if (user.role === 'company_admin' || user.role === 'system_admin') return
    setApplying(a => ({ ...a, [positionId]: true }))
    try {
      await applyToJob(positionId)
      setAppliedIds(s => new Set([...s, positionId]))
    } catch (e) {
      // ignore; could add toast
    } finally { setApplying(a => ({ ...a, [positionId]: false })) }
  }

  // Modal state for applying with CV + cover letter
  const [applyModal, setApplyModal] = useState({ open: false, job: null })
  const [applyFile, setApplyFile] = useState(null)
  const [applyCoverLetter, setApplyCoverLetter] = useState('')
  const [applySubmitting, setApplySubmitting] = useState(false)
  const [applySuccess, setApplySuccess] = useState(false)
  const [applyError, setApplyError] = useState('')

  const openApplyModal = (job) => {
    if (!user) { navigate('/login?redirect=/jobs'); return }
    if (user.role === 'company_admin' || user.role === 'system_admin') return
    setApplyModal({ open: true, job })
    setApplyFile(null)
    setApplyCoverLetter('')
    setApplyError('')
    setApplySuccess(false)
  }

  const handleApplySubmit = async (e) => {
    e.preventDefault()
    if (!applyModal.job) return
    setApplySubmitting(true)
    setApplyError('')
    try {
      await applyToJob(applyModal.job.id, { cvFile: applyFile || undefined, coverLetter: applyCoverLetter.trim() || undefined })
      setApplySuccess(true)
      setAppliedIds(prev => new Set([...prev, applyModal.job.id]))
      setTimeout(() => setApplyModal({ open: false, job: null }), 1500)
    } catch (err) {
      setApplyError(err.message || 'Failed to submit application. Please try again.')
    } finally {
      setApplySubmitting(false)
    }
  }

  return (
    <>
      <PageHeader title="Jobs" subtitle="Browse open positions across all companies." />
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pb-20">
        <div className="bg-white rounded-2xl border border-navy-100/50 p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:gap-4">
            <div className="relative flex-1 max-w-md md:max-w-none">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search company or position"
                className="w-full h-10 rounded-xl border border-navy-200 bg-white pl-10 pr-4 text-sm text-navy-900 placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 transition-all" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 md:mt-0 md:flex-1">
              <div ref={countryRef} className="relative">
                <button type="button" onClick={() => { setCountryOpen(v => !v); setCityOpen(false) }}
                  className="w-full h-10 rounded-xl border border-navy-200 bg-white px-3 text-sm text-left flex items-center justify-between">
                  <span className="truncate">{country || 'All countries'}</span>
                  <ChevronDown size={14} className="text-navy-400" />
                </button>
                {countryOpen && (
                  <div className="absolute left-0 mt-2 w-full bg-white border border-navy-100 rounded-xl shadow-lg z-50 max-h-60 overflow-auto">
                    <button onClick={() => { setCountry(''); setCity(''); setCountryOpen(false) }} className="w-full text-left px-3 py-2 text-sm text-navy-700 hover:bg-navy-50">All countries</button>
                    {ALL_COUNTRIES.map(c => (
                      <button key={c.isoCode} onClick={() => { setCountry(c.name); setCountryOpen(false); setCity('') }} className="w-full text-left px-3 py-2 text-sm text-navy-700 hover:bg-navy-50">{c.name}</button>
                    ))}
                  </div>
                )}
              </div>

              <div ref={cityRef} className="relative">
                <button type="button" onClick={() => { setCityOpen(v => !v); setCountryOpen(false) }}
                  className="w-full h-10 rounded-xl border border-navy-200 bg-white px-3 text-sm text-left flex items-center justify-between">
                  <span className="truncate">{city || 'All cities'}</span>
                  <ChevronDown size={14} className="text-navy-400" />
                </button>
                {cityOpen && (
                  <div className="absolute left-0 mt-2 w-full bg-white border border-navy-100 rounded-xl shadow-lg z-50 max-h-60 overflow-auto">
                    <button onClick={() => { setCity(''); setCityOpen(false) }} className="w-full text-left px-3 py-2 text-sm text-navy-700 hover:bg-navy-50">All cities</button>
                    {availableCities.map(ct => (
                      <button key={ct} onClick={() => { setCity(ct); setCityOpen(false) }} className="w-full text-left px-3 py-2 text-sm text-navy-700 hover:bg-navy-50">{ct}</button>
                    ))}
                  </div>
                )}
              </div>
              <select value={industry} onChange={e => setIndustry(e.target.value)} className="w-full h-10 rounded-xl border border-navy-200 bg-white px-3 text-sm">
                <option value="">All industries</option>
                {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-10 text-center text-navy-400"><Loader2 className="animate-spin mx-auto" /></div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-navy-100/50 p-10 text-center text-navy-400">No open positions found.</div>
        ) : (
          <div className="space-y-3">
            {filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((j, i) => (
              <Reveal key={j.id} delay={i * 0.04}>
                <div className="bg-white rounded-2xl border border-navy-100/50 p-5 flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-navy-900">{j.title}</h3>
                    <p className="text-xs text-navy-500 mt-1">{j.companies?.name ?? j.company?.name ?? j.company_name ?? j.companyName ?? ''} · <span className="text-navy-400">{j.companies?.industry ?? j.company?.industry ?? j.industry}</span></p>
                    <p className="text-xs text-navy-400 mt-2">{j.location && <><MapPin size={12} className="inline mr-1" />{j.location}</>}</p>
                    {j.salary && <p className="text-xs text-emerald-600 font-medium mt-1">Salary: {j.salary}</p>}
                    {j.description && (
                      <p className="text-sm text-navy-500 mt-3 line-clamp-3">{j.description}</p>
                    )}
                    {j.created_at && <p className="text-[11px] text-navy-300 mt-2">Posted {new Date(j.created_at).toLocaleDateString()}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    {user?.role !== 'company_admin' ? (
                        appliedIds.has(j.id) ? (
                        <button disabled className="h-9 px-4 bg-emerald-50 text-emerald-700 rounded-xl text-sm">Applied</button>
                      ) : (
                        <button onClick={() => openApplyModal(j)} disabled={applying[j.id]}
                          className="h-9 px-4 bg-navy-900 text-white rounded-xl text-sm">{applying[j.id] ? 'Applying...' : 'Apply'}</button>
                      )
                    ) : null}
                  </div>
                </div>
              </Reveal>
            ))}
            {/* Pagination */}
            {filtered.length > PAGE_SIZE && (
              <div className="flex items-center justify-center gap-1 pt-4">
                {Array.from({ length: Math.ceil(filtered.length / PAGE_SIZE) }, (_, i) => (
                  <button key={i + 1} onClick={() => { setPage(i + 1); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                    className={`h-8 w-8 rounded-lg text-xs font-semibold transition-colors ${page === i + 1 ? 'bg-navy-900 text-white' : 'bg-white border border-navy-200 text-navy-600 hover:bg-navy-50'}`}>
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      {/* Apply Modal */}
      <AnimatePresence>
        {applyModal.open && applyModal.job && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) setApplyModal({ open: false, job: null }) }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold text-navy-900">Apply for Position</h3>
                  <p className="text-xs text-navy-500 mt-0.5">{applyModal.job.title} · {applyModal.job.companies?.name ?? applyModal.job.company?.name ?? applyModal.job.company_name ?? applyModal.job.companyName ?? ''}</p>
                </div>
                <button
                  onClick={() => setApplyModal({ open: false, job: null })}
                  className="text-navy-400 hover:text-navy-600 text-lg leading-none"
                >✕</button>
              </div>

              {applySuccess ? (
                <div className="py-8 text-center">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 size={24} className="text-emerald-600" />
                  </div>
                  <p className="text-sm font-semibold text-navy-900">Application Submitted!</p>
                  <p className="text-xs text-navy-400 mt-1">Good luck with your application.</p>
                </div>
              ) : (
                <form onSubmit={handleApplySubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-navy-700 mb-1.5">
                      Upload CV <span className="text-red-500">*</span> <span className="text-navy-400 font-normal">(PDF or Word, max 10 MB)</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 border-2 border-dashed border-navy-200 rounded-xl cursor-pointer hover:border-navy-400 hover:bg-navy-50 transition-all">
                      <FileText size={18} className="text-navy-400 flex-shrink-0" />
                      <span className="text-sm text-navy-500 truncate">
                        {applyFile ? applyFile.name : 'Click to choose file'}
                      </span>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        className="hidden"
                        onChange={e => setApplyFile(e.target.files?.[0] || null)}
                      />
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-navy-700 mb-1.5">Cover Letter <span className="text-navy-400 font-normal">(optional)</span></label>
                    <textarea
                      value={applyCoverLetter}
                      onChange={e => setApplyCoverLetter(e.target.value)}
                      placeholder="Tell us why you're a great fit..."
                      rows={4}
                      className="w-full rounded-xl border border-navy-200 bg-white px-3 py-2 text-sm placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 transition-all resize-none"
                    />
                  </div>

                  {applyError && (
                    <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{applyError}</p>
                  )}

                  <div className="flex gap-2 pt-1">
                    <button
                      type="submit"
                      disabled={applySubmitting || !applyFile}
                      className="flex-1 h-10 bg-navy-900 text-white text-sm font-semibold rounded-xl hover:bg-navy-800 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                    >
                      {applySubmitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                      {applySubmitting ? 'Submitting…' : 'Submit Application'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setApplyModal({ open: false, job: null })}
                      className="h-10 px-4 text-navy-500 text-sm hover:text-navy-700"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
