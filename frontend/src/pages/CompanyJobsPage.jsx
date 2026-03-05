// Feature 5: Company Jobs Listing & Application Page
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Briefcase, MapPin, Building2, FileText, Send, X, Upload, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader.jsx'
import Reveal from '../components/ui/Reveal.jsx'
import { getCompanyById } from '../api/companies'
import { getCompanyPositions, applyToPosition } from '../api/jobs'

const MAX_CV_SIZE = 5 * 1024 * 1024 // 5MB

export default function CompanyJobsPage() {
  const { companyId } = useParams()
  const navigate = useNavigate()

  const [company, setCompany] = useState(null)
  const [positions, setPositions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Application modal state
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [selectedPosition, setSelectedPosition] = useState(null)
  const [coverLetter, setCoverLetter] = useState('')
  const [cvFile, setCvFile] = useState(null)
  const [cvFileName, setCvFileName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState(false)

  // Load company and positions
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const [companyRes, posRes] = await Promise.all([
          getCompanyById(companyId),
          getCompanyPositions(companyId),
        ])
        if (cancelled) return
        setCompany(companyRes?.data)
        setPositions(posRes?.data || [])
      } catch (err) {
        if (!cancelled) setError(err?.message || 'Failed to load jobs')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [companyId])

  const handleApplyClick = (position) => {
    setSelectedPosition(position)
    setCoverLetter('')
    setCvFile(null)
    setCvFileName('')
    setSubmitError('')
    setSubmitSuccess(false)
    setShowApplyModal(true)
  }

  const handleCvUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_CV_SIZE) {
      setSubmitError('CV must be smaller than 5MB')
      return
    }
    setCvFile(file)
    setCvFileName(file.name)
  }

  const handleSubmitApplication = async () => {
    if (!selectedPosition) return
    setSubmitError('')
    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('positionId', selectedPosition.id)
      if (coverLetter.trim()) formData.append('coverLetter', coverLetter.trim())
      if (cvFile) formData.append('cv', cvFile)

      const res = await applyToPosition(formData)
      if (res?.success || res?.data) {
        setSubmitSuccess(true)
        setTimeout(() => {
          setShowApplyModal(false)
          setSelectedPosition(null)
          setCoverLetter('')
          setCvFile(null)
        }, 2000)
      } else {
        setSubmitError(res?.message || 'Failed to submit application')
      }
    } catch (err) {
      setSubmitError(err?.message || 'Failed to submit application')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-ice-50 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-navy-400" />
      </div>
    )
  }

  if (error || !company) {
    return (
      <div className="min-h-screen bg-ice-50">
        <PageHeader tag="Error" title="Page Not Found" backHref />
        <div className="max-w-2xl mx-auto px-6 text-center py-16">
          <AlertCircle size={48} className="mx-auto text-red-400 mb-4" />
          <p className="text-navy-600">{error || 'Company not found'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ice-50">
      <PageHeader
        tag="Careers"
        title={`Jobs at ${company.name}`}
        subtitle={`Explore open positions at ${company.name}`}
        backHref
      />

      <div className="max-w-6xl mx-auto px-6 lg:px-8 pb-20">
        {/* Company header */}
        <div className="bg-white rounded-2xl border border-navy-100/50 p-8 mb-12 shadow-sm">
          <div className="flex items-center gap-6">
            {company.logo_url && (
              <img src={company.logo_url} alt={company.name} className="w-20 h-20 rounded-xl object-cover" />
            )}
            <div>
              <h1 className="text-2xl font-bold text-navy-900 mb-2">{company.name}</h1>
              <div className="flex items-center gap-4 text-sm text-navy-600">
                {company.industry && (
                  <span className="flex items-center gap-1">
                    <Briefcase size={14} />
                    {company.industry}
                  </span>
                )}
                {company.location && (
                  <span className="flex items-center gap-1">
                    <MapPin size={14} />
                    {company.location}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Empty state */}
        {positions.length === 0 ? (
          <div className="text-center py-16">
            <Building2 size={48} className="mx-auto text-navy-200 mb-4" />
            <p className="text-lg font-semibold text-navy-700">No open positions</p>
            <p className="text-sm text-navy-400 mt-1">Check back later for new opportunities.</p>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-bold text-navy-900 mb-6">Open Positions</h2>
            <div className="grid gap-5">
              {positions.map((pos, i) => (
                <Reveal key={pos.id} delay={i * 0.05}>
                  <div className="bg-white rounded-2xl border border-navy-100/50 overflow-hidden hover:border-navy-200 hover:shadow-lg transition-all duration-300 group">
                    <div className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-navy-900 group-hover:text-navy-700 transition-colors mb-2">
                            {pos.title}
                          </h3>
                          {pos.description && (
                            <p className="text-sm text-navy-500 mb-4 line-clamp-2">
                              {pos.description}
                            </p>
                          )}
                          {pos.requirements && (
                            <div className="text-xs text-navy-400">
                              <strong>Requirements:</strong> {pos.requirements}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleApplyClick(pos)}
                          className="h-11 px-6 bg-navy-900 text-white text-sm font-medium rounded-xl hover:bg-navy-800 transition-all flex items-center gap-2 whitespace-nowrap shadow-sm"
                        >
                          <Send size={14} />
                          Apply Now
                        </button>
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Application Modal */}
      <AnimatePresence>
        {showApplyModal && selectedPosition && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
            onClick={() => !submitting && setShowApplyModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl border border-navy-100 max-w-lg w-full p-8 shadow-xl"
            >
              {submitSuccess ? (
                <>
                  <CheckCircle2 size={48} className="mx-auto text-green-500 mb-4" />
                  <h2 className="text-xl font-bold text-navy-900 text-center mb-2">Application Submitted!</h2>
                  <p className="text-sm text-navy-500 text-center">
                    We've received your application for <strong>{selectedPosition.title}</strong>. 
                    The company will review it shortly.
                  </p>
                </>
              ) : (
                <>
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-navy-900">Apply for Position</h2>
                      <p className="text-sm text-navy-500 mt-1">{selectedPosition.title}</p>
                    </div>
                    <button
                      onClick={() => setShowApplyModal(false)}
                      disabled={submitting}
                      className="text-navy-400 hover:text-navy-600 disabled:opacity-50"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="space-y-4 mb-6">
                    {/* Cover Letter */}
                    <div>
                      <label className="block text-xs font-medium text-navy-700 mb-2">
                        Cover Letter <span className="text-navy-400">(optional)</span>
                      </label>
                      <textarea
                        value={coverLetter}
                        onChange={(e) => setCoverLetter(e.target.value.slice(0, 2000))}
                        placeholder="Tell us why you're interested in this role..."
                        className="w-full h-28 rounded-xl border border-navy-200 bg-white px-4 py-3 text-sm placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 transition-all resize-none"
                      />
                      <p className="text-xs text-navy-400 mt-1">{coverLetter.length}/2,000</p>
                    </div>

                    {/* CV Upload */}
                    <div>
                      <label className="block text-xs font-medium text-navy-700 mb-2">
                        Upload CV <span className="text-navy-400">(optional)</span>
                      </label>
                      <label className="flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-navy-200 hover:border-navy-300 cursor-pointer transition-colors bg-navy-50/30">
                        <Upload size={16} className="text-navy-400" />
                        <span className="text-sm text-navy-600">
                          {cvFileName ? cvFileName : 'Click to upload PDF/DOC'}
                        </span>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={handleCvUpload}
                          disabled={submitting}
                          className="hidden"
                        />
                      </label>
                      <p className="text-xs text-navy-400 mt-1">Max 5MB. Supported: PDF, DOC, DOCX</p>
                    </div>

                    {/* Error */}
                    {submitError && (
                      <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2 text-sm">
                        <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
                        <span className="text-red-700">{submitError}</span>
                      </div>
                    )}
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowApplyModal(false)}
                      disabled={submitting}
                      className="flex-1 h-11 rounded-xl border border-navy-200 text-navy-700 text-sm font-medium hover:bg-navy-50 transition-all disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmitApplication}
                      disabled={submitting}
                      className="flex-1 h-11 bg-navy-900 text-white text-sm font-medium rounded-xl hover:bg-navy-800 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {submitting ? (
                        <><Loader2 size={14} className="animate-spin" /> Submitting…</>
                      ) : (
                        <><Send size={14} /> Submit Application</>
                      )}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
