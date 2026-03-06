import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle2, Loader2, XCircle, Building2 } from 'lucide-react'
import { acceptInvite } from '../api/employments'
import { useAuth } from '../context/AuthContext'

export default function AcceptInvitePage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()
  const { user } = useAuth()

  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [message, setMessage] = useState('')

  const handleAccept = async () => {
    if (!token) { setStatus('error'); setMessage('No invitation token found.'); return }
    setStatus('loading')
    try {
      const res = await acceptInvite(token)
      setStatus('success')
      setMessage(res?.message ?? 'Employment verified successfully!')
    } catch (err) {
      setStatus('error')
      setMessage(err?.message ?? 'Failed to accept invitation. The link may have expired.')
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-ice-50 flex items-center justify-center px-6">
        <div className="text-center">
          <XCircle size={48} className="text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-navy-900 mb-2">Invalid Invitation</h1>
          <p className="text-sm text-navy-400 mb-6">No invitation token was provided in the URL.</p>
          <Link to="/" className="text-sm text-navy-500 hover:text-navy-700 underline">Go Home</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ice-50 flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-2xl border border-navy-100/50 p-8 text-center"
      >
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-navy-500 to-navy-700 flex items-center justify-center mb-6">
          <Building2 size={28} className="text-white" />
        </div>

        <h1 className="text-xl font-semibold text-navy-900 mb-2">Employment Invitation</h1>

        {status === 'idle' && (
          <>
            <p className="text-sm text-navy-400 mb-6">
              {user
                ? 'Click below to accept this employment invitation and verify your position.'
                : 'Please log in first, then click the link again to accept the invitation.'}
            </p>
            {user ? (
              <button
                onClick={handleAccept}
                className="h-11 px-8 bg-navy-900 text-white text-sm font-semibold rounded-xl hover:bg-navy-800 transition-colors"
              >
                Accept Invitation
              </button>
            ) : (
              <Link
                to={`/login?redirect=${encodeURIComponent(`/accept-invite?token=${token}`)}`}
                className="inline-flex h-11 px-8 bg-navy-900 text-white text-sm font-semibold rounded-xl hover:bg-navy-800 transition-colors items-center"
              >
                Log In to Accept
              </Link>
            )}
          </>
        )}

        {status === 'loading' && (
          <div className="py-4">
            <Loader2 size={32} className="animate-spin text-navy-400 mx-auto mb-3" />
            <p className="text-sm text-navy-400">Processing invitation…</p>
          </div>
        )}

        {status === 'success' && (
          <div className="py-4">
            <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-4" />
            <p className="text-sm text-emerald-700 font-medium mb-6">{message}</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="h-11 px-8 bg-navy-900 text-white text-sm font-semibold rounded-xl hover:bg-navy-800 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="py-4">
            <XCircle size={48} className="text-red-400 mx-auto mb-4" />
            <p className="text-sm text-red-600 font-medium mb-6">{message}</p>
            <Link to="/" className="text-sm text-navy-500 hover:text-navy-700 underline">Go Home</Link>
          </div>
        )}
      </motion.div>
    </div>
  )
}
