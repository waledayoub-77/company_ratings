// Feature 1: Accept Invitation Page
import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle2, AlertCircle, Loader2, Building2 } from 'lucide-react'
import { acceptInvite } from '../api/employments'
import { useAuth } from '../context/AuthContext'

export default function AcceptInvitePage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()

  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [message, setMessage] = useState('')

  // If not logged in, redirect to register with the invite token
  useEffect(() => {
    if (!authLoading && !user) {
      navigate(`/register?inviteToken=${token || ''}`, { replace: true })
    }
  }, [authLoading, user, token, navigate])

  const handleAccept = async () => {
    if (!token) {
      setStatus('error')
      setMessage('Invalid invitation link — no token found.')
      return
    }
    setStatus('loading')
    setMessage('')
    try {
      const res = await acceptInvite(token)
      if (res?.success || res?.data) {
        setStatus('success')
        setMessage('Your invitation has been accepted! Your employment is now pending approval.')
      } else {
        setStatus('error')
        setMessage(res?.message || 'Failed to accept invitation.')
      }
    } catch (err) {
      setStatus('error')
      setMessage(err?.message || 'Something went wrong.')
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ice-50">
        <Loader2 size={32} className="animate-spin text-navy-400" />
      </div>
    )
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ice-50 px-4">
        <div className="bg-white rounded-2xl border border-navy-100 p-8 max-w-md w-full text-center shadow-sm">
          <AlertCircle size={40} className="mx-auto text-red-400 mb-4" />
          <h1 className="text-xl font-bold text-navy-900 mb-2">Invalid Invitation</h1>
          <p className="text-sm text-navy-500 mb-6">This invitation link is missing or invalid.</p>
          <Link to="/" className="text-sm text-navy-600 underline hover:text-navy-800">Go to homepage</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ice-50 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-navy-100 p-8 max-w-md w-full text-center shadow-sm"
      >
        {status === 'success' ? (
          <>
            <CheckCircle2 size={48} className="mx-auto text-green-500 mb-4" />
            <h1 className="text-xl font-bold text-navy-900 mb-2">Invitation Accepted!</h1>
            <p className="text-sm text-navy-500 mb-6">{message}</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="h-11 px-7 bg-navy-900 text-white text-sm font-medium rounded-xl hover:bg-navy-800 transition-all"
            >
              Go to Dashboard
            </button>
          </>
        ) : status === 'error' ? (
          <>
            <AlertCircle size={48} className="mx-auto text-red-400 mb-4" />
            <h1 className="text-xl font-bold text-navy-900 mb-2">Invitation Error</h1>
            <p className="text-sm text-navy-500 mb-6">{message}</p>
            <Link to="/dashboard" className="text-sm text-navy-600 underline">Go to Dashboard</Link>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-navy-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Building2 size={28} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-navy-900 mb-2">You've Been Invited!</h1>
            <p className="text-sm text-navy-500 mb-2">
              You have been invited to verify your employment on <strong>RateHub</strong>.
            </p>
            <p className="text-xs text-navy-400 mb-8">
              Click below to accept. Your employment request will be submitted for company admin approval.
            </p>
            <button
              onClick={handleAccept}
              disabled={status === 'loading'}
              className="w-full h-11 bg-navy-900 text-white text-sm font-medium rounded-xl hover:bg-navy-800 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {status === 'loading' ? (
                <><Loader2 size={16} className="animate-spin" /> Accepting…</>
              ) : (
                <><CheckCircle2 size={16} /> Accept Invitation</>
              )}
            </button>
          </>
        )}
      </motion.div>
    </div>
  )
}
