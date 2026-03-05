import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, User, Briefcase, ArrowRight, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react'
import { apiRegister } from '../api/auth'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const inviteToken = searchParams.get('inviteToken') || ''

  const [showPassword, setShowPassword] = useState(false)
  const [role, setRole] = useState('employee')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Controlled form fields
  const [firstName, setFirstName]       = useState('')
  const [lastName, setLastName]         = useState('')
  const [email, setEmail]               = useState('')
  const [password, setPassword]         = useState('')
  const [companyName, setCompanyName]   = useState('')

  // Password strength (0-4)
  const passwordStrength = (() => {
    let score = 0
    if (password.length >= 8)          score++
    if (/[A-Z]/.test(password))        score++
    if (/[0-9]/.test(password))        score++
    if (/[^A-Za-z0-9]/.test(password)) score++
    return score
  })()

  const strengthColor = ['bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-emerald-400']

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await apiRegister({
        email,
        password,
        role,
        fullName:    role === 'employee'      ? `${firstName.trim()} ${lastName.trim()}` : undefined,
        companyName: role === 'company_admin' ? companyName.trim()                      : undefined,
      })
      setSuccess(true)
      // If invite token exists, redirect to accept-invite after success
      if (inviteToken) {
        setTimeout(() => navigate(`/accept-invite?token=${inviteToken}`), 1500)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      className="h-screen overflow-hidden grid lg:grid-cols-2"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{    opacity: 0, y: -12 }}
      transition={{ duration: 0.38, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {/* Left — Visual */}
      <div className="hidden lg:flex flex-col justify-between bg-navy-900 p-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />

        <div className="relative">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
              <span className="text-white font-serif font-bold text-lg leading-none">R</span>
            </div>
            <span className="text-white font-semibold text-lg tracking-tight">
              Rate<span className="text-navy-400">Hub</span>
            </span>
          </Link>
        </div>

        <div className="relative">
          <h2 className="text-2xl font-serif font-bold text-white leading-tight mb-4">
            Join the most trusted
            <br />
            workplace review platform
          </h2>

          <div className="space-y-2">
            {[
              'Employment-verified reviews only',
              'Anonymous feedback protection',
              'Private peer feedback for teams',
              'Company analytics & insights',
              'Email notifications for everything',
            ].map((feature, i) => (
              <motion.div
                key={feature}
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
              >
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span className="text-sm text-navy-200">{feature}</span>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="relative">
          <p className="text-xs text-navy-500">
            © {new Date().getFullYear()} RateHub. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex items-center justify-center px-6 py-4 bg-ice-50">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="lg:hidden mb-5">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-navy-900 flex items-center justify-center">
                <span className="text-white font-serif font-bold text-lg leading-none">R</span>
              </div>
              <span className="text-navy-900 font-semibold text-lg tracking-tight">
                Rate<span className="text-navy-500">Hub</span>
              </span>
            </Link>
          </div>

          <h1 className="text-xl md:text-2xl font-serif font-bold text-navy-900 tracking-tight">
            Create your account
          </h1>
          <p className="mt-2 text-navy-500 text-sm">
            Start sharing verified workplace feedback today.
          </p>

          {/* ── Success state ───────────────────────── */}
          {success ? (
            <motion.div
              className="mt-10 rounded-2xl bg-emerald-50 border border-emerald-200 p-8 text-center"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <CheckCircle2 size={40} className="text-emerald-500 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-navy-900">Account created!</h2>
              <p className="mt-2 text-sm text-navy-500">
                We sent a verification link to <strong>{email}</strong>.<br />
                Click the link in that email to activate your account, then sign in.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="mt-6 inline-flex items-center gap-2 bg-navy-900 text-white text-sm font-medium px-6 py-2.5 rounded-xl hover:bg-navy-800 transition-all"
              >
                Go to Sign In <ArrowRight size={14} />
              </button>
            </motion.div>
          ) : (
          <>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {([
              { value: 'employee', icon: User, label: 'Employee', desc: 'Review & give feedback' },
              { value: 'company_admin', icon: Briefcase, label: 'Company Admin', desc: 'Manage your company' },
            ]).map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                className={`p-3 rounded-xl border text-left transition-all duration-200 ${
                  role === r.value
                    ? 'border-navy-500 bg-navy-50 ring-2 ring-navy-500/15'
                    : 'border-navy-200 bg-white hover:border-navy-300'
                }`}
              >
                <r.icon
                  size={18}
                  className={role === r.value ? 'text-navy-700 mb-2' : 'text-navy-400 mb-2'}
                />
                <p className={`text-sm font-medium ${role === r.value ? 'text-navy-900' : 'text-navy-600'}`}>
                  {r.label}
                </p>
                <p className="text-[11px] text-navy-400 mt-0.5">{r.desc}</p>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            {error && (
              <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
                <AlertCircle size={15} className="text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-[13px] font-medium text-navy-700">First name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                  className="w-full h-11 rounded-xl border border-navy-200 bg-white px-4 text-sm text-navy-900 placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 transition-all"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[13px] font-medium text-navy-700">Last name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                  className="w-full h-11 rounded-xl border border-navy-200 bg-white px-4 text-sm text-navy-900 placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[13px] font-medium text-navy-700">Email address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full h-11 rounded-xl border border-navy-200 bg-white pl-10 pr-4 text-sm text-navy-900 placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 transition-all"
                  required
                />
              </div>
            </div>

            {role === 'company_admin' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="space-y-1.5"
              >
                <label className="block text-[13px] font-medium text-navy-700">Company name</label>
                <div className="relative">
                  <Briefcase size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-400" />
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Your company name"
                    className="w-full h-11 rounded-xl border border-navy-200 bg-white pl-10 pr-4 text-sm text-navy-900 placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 transition-all"
                  />
                </div>
              </motion.div>
            )}

            <div className="space-y-1.5">
              <label className="block text-[13px] font-medium text-navy-700">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="w-full h-11 rounded-xl border border-navy-200 bg-white pl-10 pr-11 text-sm text-navy-900 placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div className="flex gap-1.5 mt-1">
                {[1,2,3,4].map(i => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                      i <= passwordStrength ? strengthColor[passwordStrength - 1] : 'bg-navy-100'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-start gap-3 pt-1">
              <input
                type="checkbox"
                className="mt-1 w-4 h-4 rounded border-navy-300 text-navy-600 focus:ring-navy-500/20"
                required
              />
              <label className="text-xs text-navy-500 leading-relaxed">
                I agree to the{' '}
                <a href="#" className="text-navy-700 hover:underline">Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="text-navy-700 hover:underline">Privacy Policy</a>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 mt-1 bg-navy-900 text-white text-sm font-medium rounded-xl flex items-center justify-center gap-2 hover:bg-navy-800 focus:outline-none focus:ring-2 focus:ring-navy-500/30 transition-all disabled:opacity-50 shadow-sm shadow-navy-900/15"
            >
              {loading ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <>
                  Create Account
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          <div className="mt-5 text-center">
            <p className="text-sm text-navy-500">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-navy-700 hover:text-navy-900 transition-colors">
                Sign in
              </Link>
            </p>
          </div>
          </>
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}
