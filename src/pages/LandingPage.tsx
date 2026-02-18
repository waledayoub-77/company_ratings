import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import {
  ArrowRight,
  Shield,
  Eye,
  Users,
  MessageSquare,
  Star,
  Building2,
  TrendingUp,
  CheckCircle2,
  ChevronRight,
  Quote,
} from 'lucide-react'
import Reveal from '../components/ui/Reveal.tsx'
import Footer from '../components/layout/Footer.tsx'

/* ─── Mock data ─── */
const stats = [
  { value: '10K+', label: 'Verified Reviews' },
  { value: '2,500+', label: 'Companies Listed' },
  { value: '50K+', label: 'Employees Registered' },
  { value: '4.8', label: 'Avg. Platform Rating' },
]

const features = [
  {
    icon: Shield,
    title: 'Employment Verified',
    desc: 'Every reviewer is a verified employee. No fake reviews, no bots — just real voices from real workplaces.',
  },
  {
    icon: Eye,
    title: 'Anonymous Protection',
    desc: 'Share honest feedback without fear. Your identity is cryptographically protected from employers and admins.',
  },
  {
    icon: MessageSquare,
    title: 'Private Peer Feedback',
    desc: 'Our unique internal feedback module lets teams improve collaboration with structured, confidential reviews.',
  },
  {
    icon: TrendingUp,
    title: 'Company Analytics',
    desc: 'Employers get actionable insights — rating trends, feedback summaries, and team dynamics at a glance.',
  },
]

const testimonials = [
  {
    name: 'Sarah K.',
    role: 'Software Engineer',
    company: 'TechCorp',
    text: 'Finally a platform where I can share honest feedback without worrying about retaliation. The verification system gives it real credibility.',
    rating: 5,
  },
  {
    name: 'Marcus T.',
    role: 'HR Director',
    company: 'NovaCo',
    text: 'The internal feedback module transformed how our teams communicate. We caught issues early and improved our retention by 23%.',
    rating: 5,
  },
  {
    name: 'Priya R.',
    role: 'Product Manager',
    company: 'Dataline',
    text: 'I used RateHub to research companies before my last job switch. The verified reviews gave me confidence in my decision.',
    rating: 4,
  },
]

const topCompanies = [
  { name: 'Stripe', industry: 'Fintech', rating: 4.7, reviews: 342, color: 'from-indigo-500 to-violet-600' },
  { name: 'Notion', industry: 'Productivity', rating: 4.6, reviews: 218, color: 'from-navy-500 to-navy-700' },
  { name: 'Linear', industry: 'Dev Tools', rating: 4.8, reviews: 156, color: 'from-cyan-500 to-blue-600' },
  { name: 'Vercel', industry: 'Cloud', rating: 4.5, reviews: 289, color: 'from-gray-800 to-gray-950' },
]

export default function LandingPage() {
  const { scrollYProgress } = useScroll()
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -60])

  return (
    <div className="bg-ice-50 overflow-hidden">
      {/* ═══════════════════════════════════════════
          NAVIGATION — Minimal landing nav
      ═══════════════════════════════════════════ */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-ice-50/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-[72px] flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-navy-900 flex items-center justify-center">
              <span className="text-white font-serif font-bold text-lg leading-none">R</span>
            </div>
            <span className="text-navy-900 font-semibold text-lg tracking-tight">
              Rate<span className="text-navy-500">Hub</span>
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-navy-600 hover:text-navy-900 transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm text-navy-600 hover:text-navy-900 transition-colors">How It Works</a>
            <a href="#companies" className="text-sm text-navy-600 hover:text-navy-900 transition-colors">Companies</a>
            <a href="#testimonials" className="text-sm text-navy-600 hover:text-navy-900 transition-colors">Reviews</a>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm font-medium text-navy-700 hover:text-navy-900 transition-colors hidden sm:block"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="h-10 px-5 bg-navy-900 text-white text-sm font-medium rounded-xl inline-flex items-center gap-2 hover:bg-navy-800 transition-colors shadow-sm"
            >
              Get Started
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════
          HERO — Editorial asymmetric layout
      ═══════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center pt-[72px]">
        {/* Subtle grid background */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230F2854' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />

        <div className="max-w-7xl mx-auto px-6 lg:px-8 w-full">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-0 items-center min-h-[calc(100vh-72px)] py-16">
            {/* Left content — 7 columns */}
            <motion.div
              className="lg:col-span-7 lg:pr-16"
              style={{ y: heroY }}
            >
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-navy-900/5 mb-8">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-medium text-navy-700 tracking-wide">
                    Trusted by 50,000+ verified professionals
                  </span>
                </div>

                <h1 className="text-[clamp(2.5rem,5vw,4.5rem)] font-serif font-bold text-navy-900 leading-[1.08] tracking-tight">
                  Your workplace.
                  <br />
                  <span className="relative inline-block">
                    Your voice.
                    <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none">
                      <path d="M2 8 C50 2, 150 2, 198 8" stroke="#4988C4" strokeWidth="3" strokeLinecap="round" opacity="0.4" />
                    </svg>
                  </span>
                  <br />
                  <span className="text-navy-500">Verified.</span>
                </h1>

                <p className="mt-8 text-lg text-navy-600 leading-relaxed max-w-lg">
                  The only review platform where every voice is a verified employee. 
                  No anonymous noise — just authentic, protected feedback that helps 
                  companies and careers grow.
                </p>

                <div className="mt-10 flex flex-wrap items-center gap-4">
                  <Link
                    to="/register"
                    className="group h-[52px] px-7 bg-navy-900 text-white text-[15px] font-medium rounded-xl inline-flex items-center gap-2.5 hover:bg-navy-800 transition-all shadow-lg shadow-navy-900/15"
                  >
                    Start Reviewing
                    <ArrowRight size={17} className="transition-transform group-hover:translate-x-0.5" />
                  </Link>
                  <Link
                    to="/companies"
                    className="h-[52px] px-7 border border-navy-200 text-navy-700 text-[15px] font-medium rounded-xl inline-flex items-center gap-2.5 hover:bg-navy-50 hover:border-navy-300 transition-all"
                  >
                    Browse Companies
                  </Link>
                </div>

                {/* Trust badges */}
                <div className="mt-12 flex items-center gap-6 text-navy-400">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-500" />
                    <span className="text-xs font-medium">Verified Only</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield size={16} className="text-navy-500" />
                    <span className="text-xs font-medium">Anonymous Option</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-navy-500" />
                    <span className="text-xs font-medium">Peer Feedback</span>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Right side — Floating cards composition */}
            <motion.div
              className="lg:col-span-5 relative"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="relative w-full max-w-md mx-auto lg:mx-0">
                {/* Main review card */}
                <motion.div
                  className="bg-white rounded-2xl p-6 shadow-xl shadow-navy-900/5 border border-navy-100/40"
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-navy-500 to-navy-700 flex items-center justify-center shrink-0">
                      <span className="text-white font-semibold text-sm">AK</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-navy-900 text-sm">Anonymous Verified Employee</span>
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-semibold rounded-full">VERIFIED</span>
                      </div>
                      <p className="text-xs text-navy-400 mt-0.5">Software Engineer · TechCorp</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mb-3">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} size={14} className="fill-amber-400 text-amber-400" />
                    ))}
                    <span className="ml-2 text-xs font-semibold text-navy-900">5.0</span>
                  </div>
                  <p className="text-sm text-navy-600 leading-relaxed">
                    "Incredible work-life balance and genuinely supportive leadership. 
                    The engineering culture encourages innovation without burnout. 
                    Best decision of my career."
                  </p>
                  <div className="mt-4 flex items-center gap-4 text-xs text-navy-400">
                    <span>Feb 2026</span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <CheckCircle2 size={12} className="text-emerald-500" />
                      Verified Employment
                    </span>
                  </div>
                </motion.div>

                {/* Floating feedback card */}
                <motion.div
                  className="absolute -left-8 -bottom-8 bg-white rounded-2xl p-5 shadow-lg shadow-navy-900/5 border border-navy-100/40 w-64"
                  animate={{ y: [0, 8, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquare size={14} className="text-navy-500" />
                    <span className="text-xs font-semibold text-navy-700">Internal Feedback</span>
                  </div>
                  <div className="space-y-2">
                    {['Professionalism', 'Communication', 'Teamwork'].map((cat, i) => (
                      <div key={cat} className="flex items-center justify-between">
                        <span className="text-xs text-navy-500">{cat}</span>
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map(s => (
                            <div
                              key={s}
                              className={`w-4 h-1.5 rounded-full ${
                                s <= 4 + (i === 1 ? 1 : 0) ? 'bg-navy-500' : 'bg-navy-100'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Stats mini card */}
                <motion.div
                  className="absolute -right-4 top-1/2 -translate-y-1/2 bg-navy-900 rounded-xl p-4 text-white shadow-xl w-32"
                  animate={{ y: ['-50%', 'calc(-50% + 10px)', '-50%'] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                >
                  <TrendingUp size={16} className="text-navy-400 mb-2" />
                  <p className="text-2xl font-bold">4.7</p>
                  <p className="text-[10px] text-navy-400 mt-0.5">Avg. Company Rating</p>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Bottom scroll indicator */}
        <motion.div 
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        >
          <div className="w-5 h-8 rounded-full border-2 border-navy-300 flex items-start justify-center p-1">
            <div className="w-1 h-1.5 rounded-full bg-navy-400" />
          </div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════
          STATS BAR — Horizontal ticker
      ═══════════════════════════════════════════ */}
      <section className="relative bg-navy-900 py-12 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
            {stats.map((stat, i) => (
              <Reveal key={stat.label} delay={i * 0.1}>
                <div className="text-center">
                  <p className="text-3xl md:text-4xl font-serif font-bold text-white">{stat.value}</p>
                  <p className="text-sm text-navy-400 mt-1.5">{stat.label}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          FEATURES — Offset grid layout
      ═══════════════════════════════════════════ */}
      <section id="features" className="py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-16 items-start">
            {/* Left — Sticky label */}
            <div className="lg:col-span-4 lg:sticky lg:top-32">
              <Reveal>
                <span className="text-xs font-semibold uppercase tracking-[0.15em] text-navy-500">
                  Why RateHub
                </span>
                <h2 className="mt-3 text-3xl md:text-4xl font-serif font-bold text-navy-900 leading-tight">
                  Built for trust.
                  <br />
                  Designed for truth.
                </h2>
                <p className="mt-4 text-navy-500 leading-relaxed">
                  Every feature exists to ensure authentic, useful feedback 
                  that helps employees and companies grow together.
                </p>
                <div className="mt-8 h-px bg-gradient-to-r from-navy-200 to-transparent" />
              </Reveal>
            </div>

            {/* Right — Feature cards with offset */}
            <div className="lg:col-span-8 grid sm:grid-cols-2 gap-5">
              {features.map((feature, i) => (
                <Reveal key={feature.title} delay={i * 0.1} className={i % 2 === 1 ? 'sm:mt-8' : ''}>
                  <div className="group p-7 rounded-2xl bg-white border border-navy-100/50 hover:border-navy-200 hover:shadow-lg hover:shadow-navy-900/4 transition-all duration-300">
                    <div className="w-11 h-11 rounded-xl bg-navy-50 flex items-center justify-center mb-5 group-hover:bg-navy-900 transition-colors duration-300">
                      <feature.icon
                        size={20}
                        strokeWidth={1.6}
                        className="text-navy-500 group-hover:text-white transition-colors duration-300"
                      />
                    </div>
                    <h3 className="text-lg font-semibold text-navy-900 mb-2">{feature.title}</h3>
                    <p className="text-sm text-navy-500 leading-relaxed">{feature.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          HOW IT WORKS — Numbered steps
      ═══════════════════════════════════════════ */}
      <section id="how-it-works" className="py-24 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <Reveal>
            <div className="text-center max-w-xl mx-auto mb-20">
              <span className="text-xs font-semibold uppercase tracking-[0.15em] text-navy-500">
                How It Works
              </span>
              <h2 className="mt-3 text-3xl md:text-4xl font-serif font-bold text-navy-900">
                Three steps to authentic feedback
              </h2>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-0">
            {[
              {
                step: '01',
                title: 'Verify Your Employment',
                desc: 'Create your account, then request verification at your company. Your admin approves to confirm you\'re a real employee.',
                icon: Shield,
              },
              {
                step: '02',
                title: 'Share Your Experience',
                desc: 'Write an honest review — publicly or anonymously. Rate your company on a 1–5 scale with detailed written feedback.',
                icon: Star,
              },
              {
                step: '03',
                title: 'Help Your Team Grow',
                desc: 'Use internal peer feedback to rate colleagues on professionalism, communication, teamwork, and reliability.',
                icon: Users,
              },
            ].map((item, i) => (
              <Reveal key={item.step} delay={i * 0.15}>
                <div className={`relative p-8 lg:p-12 ${i < 2 ? 'md:border-r border-navy-100' : ''}`}>
                  <span className="text-[80px] font-serif font-bold text-navy-50 absolute top-4 right-8 leading-none select-none">
                    {item.step}
                  </span>
                  <div className="relative">
                    <div className="w-12 h-12 rounded-xl bg-navy-900 flex items-center justify-center mb-6">
                      <item.icon size={22} className="text-white" strokeWidth={1.6} />
                    </div>
                    <h3 className="text-xl font-semibold text-navy-900 mb-3">{item.title}</h3>
                    <p className="text-sm text-navy-500 leading-relaxed">{item.desc}</p>
                    {i < 2 && (
                      <ChevronRight size={18} className="hidden md:block absolute top-1/2 -right-[21px] text-navy-300" />
                    )}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          TOP COMPANIES — Cards row
      ═══════════════════════════════════════════ */}
      <section id="companies" className="py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
            <Reveal>
              <span className="text-xs font-semibold uppercase tracking-[0.15em] text-navy-500">
                Top Rated
              </span>
              <h2 className="mt-3 text-3xl md:text-4xl font-serif font-bold text-navy-900">
                Companies people love
              </h2>
            </Reveal>
            <Reveal delay={0.2}>
              <Link
                to="/companies"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-navy-700 hover:text-navy-900 transition-colors group"
              >
                View All Companies
                <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </Reveal>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {topCompanies.map((company, i) => (
              <Reveal key={company.name} delay={i * 0.08}>
                <Link
                  to="/companies/1"
                  className="group block p-6 rounded-2xl bg-white border border-navy-100/50 hover:border-navy-200 hover:shadow-lg hover:shadow-navy-900/4 transition-all duration-300"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${company.color} flex items-center justify-center mb-5`}>
                    <Building2 size={22} className="text-white" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-semibold text-navy-900 text-lg group-hover:text-navy-700 transition-colors">
                    {company.name}
                  </h3>
                  <p className="text-xs text-navy-400 mt-0.5">{company.industry}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Star size={14} className="fill-amber-400 text-amber-400" />
                      <span className="text-sm font-semibold text-navy-900">{company.rating}</span>
                    </div>
                    <span className="text-xs text-navy-400">{company.reviews} reviews</span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          INTERNAL FEEDBACK — Feature highlight
      ═══════════════════════════════════════════ */}
      <section className="py-24 lg:py-32 bg-navy-900 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <Reveal>
              <span className="text-xs font-semibold uppercase tracking-[0.15em] text-navy-400">
                Unique to RateHub
              </span>
              <h2 className="mt-3 text-3xl md:text-4xl font-serif font-bold text-white leading-tight">
                Private peer feedback
                <br />
                <span className="text-navy-400">that transforms teams</span>
              </h2>
              <p className="mt-6 text-navy-300 leading-relaxed max-w-md">
                Go beyond public reviews. Our internal feedback module lets verified 
                employees rate colleagues on four key dimensions — building a culture 
                of constructive, accountable growth.
              </p>
              <div className="mt-8 space-y-4">
                {['Professionalism', 'Communication', 'Teamwork', 'Reliability'].map((cat, i) => (
                  <div key={cat} className="flex items-center gap-4">
                    <span className="text-sm text-navy-300 w-32">{cat}</span>
                    <div className="flex-1 h-2 bg-navy-800 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-navy-500 to-ice-500 rounded-full"
                        initial={{ width: 0 }}
                        whileInView={{ width: `${75 + i * 5}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-white w-8">
                      {(3.8 + i * 0.25).toFixed(1)}
                    </span>
                  </div>
                ))}
              </div>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 mt-10 text-sm font-medium text-navy-400 hover:text-white transition-colors group"
              >
                Try Internal Feedback
                <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </Reveal>

            <Reveal direction="right">
              <div className="relative">
                {/* Feedback module mock */}
                <div className="bg-navy-800/50 rounded-2xl p-8 border border-navy-700/30 backdrop-blur">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-navy-500 to-navy-600 flex items-center justify-center">
                      <span className="text-white text-sm font-semibold">SM</span>
                    </div>
                    <div>
                      <p className="text-white text-sm font-semibold">Sarah Miller</p>
                      <p className="text-navy-400 text-xs">Product Manager · Q1 2026</p>
                    </div>
                  </div>
                  <div className="space-y-5">
                    {[
                      { label: 'Professionalism', value: 5 },
                      { label: 'Communication', value: 4 },
                      { label: 'Teamwork', value: 5 },
                      { label: 'Reliability', value: 4 },
                    ].map(cat => (
                      <div key={cat.label}>
                        <div className="flex justify-between mb-1.5">
                          <span className="text-xs text-navy-300">{cat.label}</span>
                          <div className="flex gap-1">
                            {[1,2,3,4,5].map(s => (
                              <Star
                                key={s}
                                size={12}
                                className={s <= cat.value ? 'fill-amber-400 text-amber-400' : 'text-navy-600'}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 p-4 bg-navy-900/50 rounded-xl">
                    <p className="text-xs text-navy-300 leading-relaxed italic">
                      "Sarah consistently goes above and beyond in cross-team collaboration. 
                      Her ability to align stakeholders is remarkable."
                    </p>
                  </div>
                </div>
                {/* Decorative accent */}
                <div className="absolute -top-4 -right-4 w-24 h-24 rounded-2xl bg-gradient-to-br from-navy-500/20 to-ice-500/20 -z-10" />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          TESTIMONIALS — Editorial quotes
      ═══════════════════════════════════════════ */}
      <section id="testimonials" className="py-24 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <Reveal>
            <div className="mb-16">
              <span className="text-xs font-semibold uppercase tracking-[0.15em] text-navy-500">
                Testimonials
              </span>
              <h2 className="mt-3 text-3xl md:text-4xl font-serif font-bold text-navy-900">
                What our users say
              </h2>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <Reveal key={t.name} delay={i * 0.1}>
                <div className={`p-8 rounded-2xl border transition-all duration-300 hover:shadow-lg hover:shadow-navy-900/4 ${
                  i === 1
                    ? 'bg-navy-900 border-navy-800 md:-translate-y-4'
                    : 'bg-white border-navy-100/50 hover:border-navy-200'
                }`}>
                  <Quote
                    size={28}
                    className={i === 1 ? 'text-navy-600 mb-4' : 'text-navy-200 mb-4'}
                  />
                  <p className={`text-sm leading-relaxed mb-6 ${
                    i === 1 ? 'text-navy-200' : 'text-navy-600'
                  }`}>
                    {t.text}
                  </p>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-semibold ${
                      i === 1
                        ? 'bg-navy-700 text-white'
                        : 'bg-navy-50 text-navy-600'
                    }`}>
                      {t.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${i === 1 ? 'text-white' : 'text-navy-900'}`}>
                        {t.name}
                      </p>
                      <p className={`text-xs ${i === 1 ? 'text-navy-400' : 'text-navy-400'}`}>
                        {t.role} at {t.company}
                      </p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          CTA — Clean editorial
      ═══════════════════════════════════════════ */}
      <section className="py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <Reveal>
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-5xl font-serif font-bold text-navy-900 leading-tight">
                Ready to make your
                <br />
                workplace voice count?
              </h2>
              <p className="mt-6 text-lg text-navy-500 max-w-lg mx-auto">
                Join thousands of verified professionals sharing honest, 
                protected feedback. It takes 2 minutes to get started.
              </p>
              <div className="mt-10 flex flex-wrap justify-center gap-4">
                <Link
                  to="/register"
                  className="group h-[56px] px-8 bg-navy-900 text-white text-base font-medium rounded-xl inline-flex items-center gap-2.5 hover:bg-navy-800 transition-all shadow-lg shadow-navy-900/15"
                >
                  Create Free Account
                  <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  to="/companies"
                  className="h-[56px] px-8 border border-navy-200 text-navy-700 text-base font-medium rounded-xl inline-flex items-center gap-2.5 hover:bg-navy-50 hover:border-navy-300 transition-all"
                >
                  Explore Companies
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <Footer />
    </div>
  )
}
