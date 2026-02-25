import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Lock, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react'
import { apiResetPassword } from '../api/auth'

function getStrength(pwd) {
  let score = 0
  if (pwd.length >= 8)                    score++
  if (/[A-Z]/.test(pwd))                  score++
  if (/[0-9]/.test(pwd))                  score++
  if (/[^A-Za-z0-9]/.test(pwd))           score++
  return score // 0-4
}

const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong']
const STRENGTH_COLORS = ['', 'bg-red-500', 'bg-amber-500', 'bg-sky-500', 'bg-emerald-500']
const STRENGTH_TEXT   = ['', 'text-red-600', 'text-amber-600', 'text-sky-600', 'text-emerald-600']

export default function ResetPasswordPage() {
  const { token }    = useParams()
  const navigate     = useNavigate()

  const [showNew,     setShowNew]     = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [password,    setPassword]    = useState('')
  const [confirm,     setConfirm]     = useState('')
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')
  const [done,        setDone]        = useState(false)

  const strength     = getStrength(password)
  const mismatch     = confirm.length > 0 && password !== confirm
  const canSubmit    = password.length >= 8 && password === confirm && !loading

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!canSubmit) return
    setError('')
    setLoading(true)
    try {
      await apiResetPassword(token, password)
      setDone(true)
      setTimeout(() => navigate('/login'), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left — Form side */}
      <div className="flex items-center justify-center px-6 py-16 bg-ice-50">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <Link to="/" className="flex items-center gap-3 mb-12">
            <div className="w-9 h-9 rounded-lg bg-navy-900 flex items-center justify-center">
              <span className="text-white font-serif font-bold text-lg leading-none">R</span>
            </div>
            <span className="text-navy-900 font-semibold text-lg tracking-tight">
              Rate<span className="text-navy-500">Hub</span>
            </span>
          </Link>

          {!done ? (
            <>
              <h1 className="text-2xl md:text-3xl font-serif font-bold text-navy-900 tracking-tight">
                Reset your password
              </h1>
              <p className="mt-2 text-navy-500 text-sm">
                Choose a strong new password for your account.
              </p>

              <form onSubmit={handleSubmit} className="mt-10 space-y-5">
                {error && (
                  <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
                    <AlertCircle size={15} className="text-red-500 mt-0.5 shrink-0" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                {/* New password */}
                <div className="space-y-1.5">
                  <label className="block text-[13px] font-medium text-navy-700">New Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-400" />
                    <input
                      type={showNew ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className="w-full h-11 rounded-xl border border-navy-200 bg-white pl-10 pr-11 text-sm text-navy-900 placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 transition-all"
                      required
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-600 transition-colors"
                    >
                      {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {/* Strength meter */}
                  {password.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                              i <= strength ? STRENGTH_COLORS[strength] : 'bg-navy-100'
                            }`}
                          />
                        ))}
                      </div>
                      <p className={`text-[11px] font-medium ${STRENGTH_TEXT[strength]}`}>
                        {STRENGTH_LABELS[strength]}
                      </p>
                    </div>
                  )}
                </div>

                {/* Confirm password */}
                <div className="space-y-1.5">
                  <label className="block text-[13px] font-medium text-navy-700">Confirm Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-400" />
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="Repeat your new password"
                      className={`w-full h-11 rounded-xl border bg-white pl-10 pr-11 text-sm text-navy-900 placeholder:text-navy-300 focus:outline-none focus:ring-2 transition-all ${
                        mismatch
                          ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                          : 'border-navy-200 focus:ring-navy-500/20 focus:border-navy-500'
                      }`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-600 transition-colors"
                    >
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {mismatch && (
                    <p className="text-xs text-red-500">Passwords do not match.</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="w-full h-11 bg-navy-900 text-white text-sm font-medium rounded-xl flex items-center justify-center gap-2 hover:bg-navy-800 focus:outline-none focus:ring-2 focus:ring-navy-500/30 transition-all disabled:opacity-50 shadow-sm shadow-navy-900/15"
                >
                  {loading ? (
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <>
                      Set New Password
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mb-6">
                <CheckCircle2 size={26} className="text-emerald-500" />
              </div>
              <h1 className="text-2xl md:text-3xl font-serif font-bold text-navy-900 tracking-tight">
                Password updated!
              </h1>
              <p className="mt-3 text-navy-500 text-sm leading-relaxed">
                Your password has been changed successfully.
                Redirecting you to sign in…
              </p>
              <div className="mt-8">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center h-11 px-8 bg-navy-900 text-white text-sm font-medium rounded-xl hover:bg-navy-800 transition-all shadow-sm shadow-navy-900/15"
                >
                  Sign In Now
                </Link>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Right — Visual panel (matches LoginPage) */}
      <div className="hidden lg:flex items-center justify-center bg-navy-900 p-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        <motion.div
          className="relative max-w-md text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <div className="mb-8">
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mx-auto">
              <span className="text-white font-serif font-bold text-3xl">R</span>
            </div>
          </div>
          <blockquote className="text-xl font-serif text-white/90 leading-relaxed italic">
            "A fresh start is just one step away."
          </blockquote>
          <div className="mt-8 flex items-center justify-center gap-2">
            <div className="w-8 h-px bg-white/20" />
            <span className="text-xs text-white/40 uppercase tracking-widest">RateHub</span>
            <div className="w-8 h-px bg-white/20" />
          </div>
        </motion.div>
      </div>
    </div>
  )
}
