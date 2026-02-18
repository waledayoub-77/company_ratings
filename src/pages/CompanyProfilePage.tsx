import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Star,
  MapPin,
  Building2,
  Users,
  Calendar,
  PenSquare,
  Flag,
  Shield,
  CheckCircle2,
  ThumbsUp,
  ChevronDown,
  ExternalLink,
} from 'lucide-react'
import PageHeader from '../components/ui/PageHeader.tsx'
import StarRating from '../components/ui/StarRating.tsx'
import Badge from '../components/ui/Badge.tsx'
import Reveal from '../components/ui/Reveal.tsx'

/* ─── Mock data ─── */
const company = {
  id: 1,
  name: 'Stripe',
  industry: 'Fintech',
  location: 'San Francisco, CA',
  description: 'Stripe is a financial infrastructure platform for businesses. Millions of companies — from the world\'s largest enterprises to the most ambitious startups — use Stripe to accept payments, grow their revenue, and accelerate new business opportunities.',
  rating: 4.7,
  totalReviews: 342,
  employees: 8000,
  founded: 2010,
  gradient: 'from-indigo-500 to-violet-600',
  distribution: [
    { stars: 5, count: 180, pct: 53 },
    { stars: 4, count: 98, pct: 29 },
    { stars: 3, count: 41, pct: 12 },
    { stars: 2, count: 15, pct: 4 },
    { stars: 1, count: 8, pct: 2 },
  ],
}

const reviews = [
  {
    id: 1,
    author: 'Anonymous Verified Employee',
    anonymous: true,
    position: 'Software Engineer',
    rating: 5,
    date: '2026-02-10',
    text: 'Incredible work-life balance and genuinely supportive leadership. The engineering culture encourages innovation without burnout. They actually mean it when they say they care about employee wellbeing. The benefits are top-notch and I\'ve grown more here in 2 years than anywhere else.',
    helpful: 24,
  },
  {
    id: 2,
    author: 'Emily Chen',
    anonymous: false,
    position: 'Product Manager',
    rating: 4,
    date: '2026-01-28',
    text: 'Great company overall. The product culture is strong, and you get a lot of autonomy. Some teams could improve cross-functional communication, but leadership is aware and working on it. Compensation is competitive and the equity component is generous.',
    helpful: 18,
  },
  {
    id: 3,
    author: 'Anonymous Verified Employee',
    anonymous: true,
    position: 'Data Scientist',
    rating: 5,
    date: '2026-01-15',
    text: 'The data team here is world-class. You work with cutting-edge technology and incredibly smart people. The mentorship culture is unlike anything I\'ve experienced before. Every quarter brings exciting new challenges.',
    helpful: 31,
  },
  {
    id: 4,
    author: 'Marcus Johnson',
    anonymous: false,
    position: 'Engineering Manager',
    rating: 4,
    date: '2025-12-20',
    text: 'Strong engineering culture with emphasis on code quality and testing. The onboarding process is excellent. Only feedback - the pace can be intense during launch periods, but the team support makes it manageable.',
    helpful: 12,
  },
  {
    id: 5,
    author: 'Anonymous Verified Employee',
    anonymous: true,
    position: 'Designer',
    rating: 5,
    date: '2025-12-05',
    text: 'Design is treated as a first-class citizen here. You get real influence over product decisions. The design system is well-maintained and the team is collaborative. Remote-friendly with great async communication tools.',
    helpful: 27,
  },
]

export default function CompanyProfilePage() {
  const { id } = useParams()
  const [sortReviews, setSortReviews] = useState('Recent')
  const [reportingId, setReportingId] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-ice-50">
      {/* Company header */}
      <div className="bg-white border-b border-navy-100/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-28 pb-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              {/* Company logo */}
              <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${company.gradient} flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20`}>
                <Building2 size={36} className="text-white" strokeWidth={1.3} />
              </div>

              <div className="flex-1">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-serif font-bold text-navy-900">{company.name}</h1>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-navy-500">
                      <span className="flex items-center gap-1.5">
                        <Building2 size={14} />
                        {company.industry}
                      </span>
                      <span className="text-navy-200">·</span>
                      <span className="flex items-center gap-1.5">
                        <MapPin size={14} />
                        {company.location}
                      </span>
                      <span className="text-navy-200">·</span>
                      <span className="flex items-center gap-1.5">
                        <Users size={14} />
                        {company.employees.toLocaleString()} employees
                      </span>
                      <span className="text-navy-200">·</span>
                      <span className="flex items-center gap-1.5">
                        <Calendar size={14} />
                        Founded {company.founded}
                      </span>
                    </div>
                  </div>

                  <Link
                    to={`/companies/${id}/review`}
                    className="h-11 px-6 bg-navy-900 text-white text-sm font-medium rounded-xl inline-flex items-center gap-2 hover:bg-navy-800 transition-all shadow-sm shadow-navy-900/15"
                  >
                    <PenSquare size={15} />
                    Write a Review
                  </Link>
                </div>

                <p className="mt-5 text-sm text-navy-600 leading-relaxed max-w-3xl">
                  {company.description}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Sidebar — Rating summary */}
          <div className="lg:col-span-4 order-2 lg:order-1">
            <Reveal>
              <div className="bg-white rounded-2xl border border-navy-100/50 p-6 lg:sticky lg:top-24">
                {/* Overall rating */}
                <div className="text-center pb-6 border-b border-navy-100/50">
                  <p className="text-5xl font-serif font-bold text-navy-900">{company.rating}</p>
                  <div className="flex justify-center mt-2">
                    <StarRating rating={company.rating} size={20} />
                  </div>
                  <p className="text-sm text-navy-400 mt-2">
                    Based on {company.totalReviews} verified reviews
                  </p>
                </div>

                {/* Distribution */}
                <div className="pt-6 space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-navy-400 mb-4">
                    Rating Distribution
                  </h3>
                  {company.distribution.map(d => (
                    <div key={d.stars} className="flex items-center gap-3">
                      <span className="text-xs font-medium text-navy-600 w-3">{d.stars}</span>
                      <Star size={12} className="fill-amber-400 text-amber-400 shrink-0" />
                      <div className="flex-1 h-2 bg-navy-50 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-amber-400 rounded-full"
                          initial={{ width: 0 }}
                          whileInView={{ width: `${d.pct}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.8, delay: (5 - d.stars) * 0.1 }}
                        />
                      </div>
                      <span className="text-xs text-navy-400 w-8 text-right">{d.count}</span>
                    </div>
                  ))}
                </div>

                {/* Quick stats */}
                <div className="mt-8 pt-6 border-t border-navy-100/50 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-navy-500">Would recommend</span>
                    <span className="font-semibold text-navy-900">89%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-navy-500">CEO approval</span>
                    <span className="font-semibold text-navy-900">94%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-navy-500">Verified reviews</span>
                    <span className="font-semibold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 size={13} />
                      100%
                    </span>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>

          {/* Main content — Reviews */}
          <div className="lg:col-span-8 order-1 lg:order-2">
            {/* Sort & filter bar */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-serif font-semibold text-navy-900">
                Employee Reviews
              </h2>
              <div className="relative">
                <select
                  value={sortReviews}
                  onChange={(e) => setSortReviews(e.target.value)}
                  className="h-9 pl-3 pr-8 rounded-lg border border-navy-200 bg-white text-xs font-medium text-navy-600 appearance-none focus:outline-none focus:ring-2 focus:ring-navy-500/20 cursor-pointer"
                >
                  <option>Recent</option>
                  <option>Highest Rated</option>
                  <option>Lowest Rated</option>
                  <option>Most Helpful</option>
                </select>
                <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-navy-400 pointer-events-none" />
              </div>
            </div>

            {/* Reviews list */}
            <div className="space-y-4">
              {reviews.map((review, i) => (
                <Reveal key={review.id} delay={i * 0.05}>
                  <div className="bg-white rounded-2xl border border-navy-100/50 p-6 hover:border-navy-200 transition-all duration-200">
                    {/* Review header */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          review.anonymous
                            ? 'bg-navy-50'
                            : 'bg-gradient-to-br from-navy-500 to-navy-700'
                        }`}>
                          {review.anonymous ? (
                            <Shield size={18} className="text-navy-400" />
                          ) : (
                            <span className="text-white text-xs font-semibold">
                              {review.author.split(' ').map(n => n[0]).join('')}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm text-navy-900">
                              {review.author}
                            </span>
                            {review.anonymous && (
                              <Badge variant="info" size="sm">Anonymous</Badge>
                            )}
                            <Badge variant="success" size="sm">Verified</Badge>
                          </div>
                          <p className="text-xs text-navy-400 mt-0.5">
                            {review.position} · {new Date(review.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <StarRating rating={review.rating} size={14} />
                        <span className="text-sm font-bold text-navy-900 ml-1">{review.rating}.0</span>
                      </div>
                    </div>

                    {/* Review text */}
                    <p className="mt-4 text-sm text-navy-600 leading-relaxed">
                      {review.text}
                    </p>

                    {/* Review footer */}
                    <div className="mt-5 pt-4 border-t border-navy-50 flex items-center justify-between">
                      <button className="flex items-center gap-2 text-xs text-navy-400 hover:text-navy-600 transition-colors group">
                        <ThumbsUp size={14} className="group-hover:fill-navy-200 transition-all" />
                        Helpful ({review.helpful})
                      </button>
                      <button
                        onClick={() => setReportingId(reportingId === review.id ? null : review.id)}
                        className="flex items-center gap-1.5 text-xs text-navy-300 hover:text-red-500 transition-colors"
                      >
                        <Flag size={13} />
                        Report
                      </button>
                    </div>

                    {/* Inline report form */}
                    {reportingId === review.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        className="mt-4 p-4 bg-red-50/50 rounded-xl border border-red-100"
                      >
                        <p className="text-xs font-medium text-red-700 mb-2">Report this review</p>
                        <select className="w-full h-9 rounded-lg border border-red-200 bg-white px-3 text-xs text-navy-700 mb-2 focus:outline-none">
                          <option>Select reason...</option>
                          <option>False information</option>
                          <option>Spam</option>
                          <option>Harassment</option>
                        </select>
                        <textarea
                          placeholder="Additional details (optional)"
                          className="w-full h-16 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs text-navy-700 resize-none mb-2 focus:outline-none"
                        />
                        <div className="flex gap-2">
                          <button className="h-8 px-4 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition-colors">
                            Submit Report
                          </button>
                          <button
                            onClick={() => setReportingId(null)}
                            className="h-8 px-4 text-xs text-navy-500 hover:text-navy-700 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </Reveal>
              ))}
            </div>

            {/* Load more */}
            <div className="mt-8 text-center">
              <button className="h-11 px-8 border border-navy-200 text-navy-700 text-sm font-medium rounded-xl hover:bg-navy-50 hover:border-navy-300 transition-all">
                Load More Reviews
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
