import { useEffect, useState, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { apiVerifyEmail } from '../api/auth'

export default function VerifyEmailPage() {
  const { token } = useParams()
  const [status, setStatus] = useState('loading') // 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('')
  const calledRef = useRef(false)

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Invalid verification link.')
      return
    }
    // Prevent double-call from React 18 Strict Mode
    if (calledRef.current) return
    calledRef.current = true

    apiVerifyEmail(token)
      .then(() => setStatus('success'))
      .catch((err) => {
        setStatus('error')
        setMessage(err.message || 'This link is invalid or has expired.')
      })
  }, [token])

  return (
    <div className="min-h-screen flex items-center justify-center bg-ice-50 px-6">
      <motion.div
        className="w-full max-w-md text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Logo */}
        <Link to="/" className="inline-flex items-center gap-3 mb-12">
          <div className="w-9 h-9 rounded-lg bg-navy-900 flex items-center justify-center">
            <span className="text-white font-serif font-bold text-lg leading-none">R</span>
          </div>
          <span className="text-navy-900 font-semibold text-lg tracking-tight">
            Rate<span className="text-navy-500">Hub</span>
          </span>
        </Link>

        {/* Loading */}
        {status === 'loading' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <div className="w-16 h-16 rounded-2xl bg-navy-50 flex items-center justify-center mx-auto">
              <Loader2 size={28} className="text-navy-400 animate-spin" />
            </div>
            <h1 className="text-2xl font-serif font-bold text-navy-900 tracking-tight">
              Verifying your email…
            </h1>
            <p className="text-sm text-navy-500">This will only take a moment.</p>
          </motion.div>
        )}

        {/* Success */}
        {status === 'success' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="space-y-4"
          >
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto">
              <CheckCircle2 size={28} className="text-emerald-500" />
            </div>
            <h1 className="text-2xl font-serif font-bold text-navy-900 tracking-tight">
              Email Verified!
            </h1>
            <p className="text-sm text-navy-500 max-w-xs mx-auto leading-relaxed">
              Your email has been confirmed. You can now sign in to your RateHub account.
            </p>
            <div className="pt-4">
              <Link
                to="/login"
                className="inline-flex items-center justify-center h-11 px-8 bg-navy-900 text-white text-sm font-medium rounded-xl hover:bg-navy-800 transition-all shadow-sm shadow-navy-900/15"
              >
                Sign In
              </Link>
            </div>
          </motion.div>
        )}

        {/* Error */}
        {status === 'error' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="space-y-4"
          >
            <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto">
              <XCircle size={28} className="text-red-500" />
            </div>
            <h1 className="text-2xl font-serif font-bold text-navy-900 tracking-tight">
              Verification Failed
            </h1>
            <p className="text-sm text-navy-500 max-w-xs mx-auto leading-relaxed">
              {message || 'This verification link is invalid or has expired. Please request a new one.'}
            </p>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/login"
                className="inline-flex items-center justify-center h-11 px-6 bg-navy-900 text-white text-sm font-medium rounded-xl hover:bg-navy-800 transition-all shadow-sm shadow-navy-900/15"
              >
                Back to Sign In
              </Link>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
