import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => setLoading(false), 1500)
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

          <h1 className="text-2xl md:text-3xl font-serif font-bold text-navy-900 tracking-tight">
            Welcome back
          </h1>
          <p className="mt-2 text-navy-500 text-sm">
            Sign in to continue sharing verified workplace feedback.
          </p>

          <form onSubmit={handleSubmit} className="mt-10 space-y-5">
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

            <div className="space-y-1.5">
              <div className="flex justify-between">
                <label className="block text-[13px] font-medium text-navy-700">Password</label>
                <button type="button" className="text-[12px] text-navy-500 hover:text-navy-700 transition-colors">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
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
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-navy-900 text-white text-sm font-medium rounded-xl flex items-center justify-center gap-2 hover:bg-navy-800 focus:outline-none focus:ring-2 focus:ring-navy-500/30 transition-all disabled:opacity-50 shadow-sm shadow-navy-900/15"
            >
              {loading ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-navy-500">
              Don't have an account?{' '}
              <Link to="/register" className="font-medium text-navy-700 hover:text-navy-900 transition-colors">
                Create one
              </Link>
            </p>
          </div>
        </motion.div>
      </div>

      {/* Right — Visual panel */}
      <div className="hidden lg:flex items-center justify-center bg-navy-900 p-16 relative overflow-hidden">
        {/* Subtle pattern */}
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
            "Transparency is the key to trust. 
            <br />Trust is the foundation of great workplaces."
          </blockquote>
          <div className="mt-8 flex items-center justify-center gap-2">
            <div className="w-8 h-px bg-white/20" />
            <span className="text-xs text-white/40 uppercase tracking-widest">RateHub</span>
            <div className="w-8 h-px bg-white/20" />
          </div>

          {/* Decorative review cards */}
          <div className="mt-16 space-y-4">
            {[
              { initials: 'AK', stars: 5, text: 'Great leadership and work culture' },
              { initials: 'JL', stars: 4, text: 'Good benefits, room for improvement' },
            ].map((review, i) => (
              <motion.div
                key={i}
                className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 text-left"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.5 + i * 0.2 }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                    <span className="text-white text-xs font-semibold">{review.initials}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }, (_, j) => (
                        <div
                          key={j}
                          className={`w-3 h-3 rounded-sm ${
                            j < review.stars ? 'bg-amber-400' : 'bg-white/10'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-white/50 mt-1">{review.text}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
