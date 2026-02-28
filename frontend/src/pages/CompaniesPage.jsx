import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Search,
  SlidersHorizontal,
  Star,
  MapPin,
  Building2,
  ChevronDown,
  ArrowUpDown,
  X,
  AlertCircle,
} from 'lucide-react'
import PageHeader from '../components/ui/PageHeader.jsx'
import Reveal from '../components/ui/Reveal.jsx'
import StarRating from '../components/ui/StarRating.jsx'
import { getCompanies } from '../api/companies'

/* ─── Constants ─── */
const industries = [
  'All Industries', 'Technology', 'Healthcare', 'Finance', 'Education',
  'Retail', 'Manufacturing', 'Consulting', 'Media & Entertainment',
  'Real Estate', 'Transportation', 'Food & Beverage', 'Energy',
  'Telecommunications', 'Automotive', 'Aerospace', 'Pharmaceuticals',
  'Legal', 'Marketing & Advertising', 'Construction', 'Hospitality',
]
const locations = [
  'All Locations', 'San Francisco', 'New York', 'Los Angeles', 'Chicago',
  'Seattle', 'Austin', 'Boston', 'Denver', 'Washington DC', 'Atlanta',
  'Dallas', 'Miami', 'Portland', 'San Diego', 'Phoenix', 'Philadelphia',
  'Minneapolis', 'Detroit', 'Houston', 'Nashville', 'Charlotte',
  'San Jose', 'Remote',
]
const sortOptions = [
  { label: 'Highest Rated',  sortBy: 'overall_rating', sortOrder: 'desc' },
  { label: 'Most Reviewed',  sortBy: 'total_reviews',  sortOrder: 'desc' },
  { label: 'Alphabetical',   sortBy: 'name',           sortOrder: 'asc'  },
  { label: 'Recently Added', sortBy: 'created_at',     sortOrder: 'desc' },
]
const GRADIENTS = [
  'from-indigo-500 to-violet-600',  'from-cyan-500 to-blue-600',
  'from-pink-500 to-rose-600',      'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',   'from-purple-500 to-indigo-600',
  'from-blue-500 to-sky-600',       'from-gray-800 to-gray-950',
  'from-navy-500 to-navy-700',      'from-red-500 to-rose-600',
]
function pickGradient(name) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return GRADIENTS[Math.abs(h) % GRADIENTS.length]
}
function buildPageButtons(cur, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const p = [1]
  if (cur > 3) p.push('...')
  for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) p.push(i)
  if (cur < total - 2) p.push('...')
  p.push(total)
  return p
}
const LIMIT = 9

export default function CompaniesPage() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [industry, setIndustry] = useState('All Industries')
  const [locationFilter, setLocationFilter] = useState('All Locations')
  const [sort, setSort] = useState('Highest Rated')
  const [showFilters, setShowFilters] = useState(false)
  const [ratingFilter, setRatingFilter] = useState(0)
  const [page, setPage] = useState(1)

  const [companies, setCompanies] = useState([])
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(t)
  }, [search])

  // Reset to page 1 when any filter changes
  useEffect(() => { setPage(1) }, [debouncedSearch, industry, locationFilter, sort, ratingFilter])

  // Fetch companies from API
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const s = sortOptions.find(o => o.label === sort) || sortOptions[0]
        const params = { page, limit: LIMIT, sortBy: s.sortBy, sortOrder: s.sortOrder }
        if (debouncedSearch) params.search = debouncedSearch
        if (industry !== 'All Industries') params.industry = industry
        if (locationFilter && locationFilter !== 'All Locations') params.location = locationFilter
        if (ratingFilter > 0) params.minRating = ratingFilter

        const res = await getCompanies(params)
        if (!cancelled) {
          setCompanies(res.data || [])
          setPagination(res.pagination || { total: 0, totalPages: 1 })
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load companies')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [page, debouncedSearch, industry, locationFilter, sort, ratingFilter])

  const activeFilters = [
    industry !== 'All Industries' && industry,
    locationFilter !== 'All Locations' && `📍 ${locationFilter}`,
    ratingFilter > 0 && `${ratingFilter}+ stars`,
  ].filter(Boolean)

  return (
    <div className="min-h-screen bg-ice-50">
      <PageHeader
        tag="Explore"
        title="Browse Companies"
        subtitle="Discover verified reviews from real employees at companies across every industry."
        backHref
      >
        {/* Search bar */}
        <div className="flex items-center gap-3 mt-2">
          <div className="relative flex-1 max-w-xl">
            <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-navy-400" />
            <input
              type="text"
              placeholder="Search companies by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-12 rounded-xl border border-navy-200 bg-white pl-11 pr-4 text-sm text-navy-900 placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 transition-all shadow-sm"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`h-12 px-5 rounded-xl border text-sm font-medium flex items-center gap-2 transition-all ${
              showFilters
                ? 'bg-navy-900 text-white border-navy-900'
                : 'bg-white text-navy-700 border-navy-200 hover:border-navy-300'
            }`}
          >
            <SlidersHorizontal size={16} />
            <span className="hidden sm:inline">Filters</span>
            {activeFilters.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-navy-500 text-white text-[10px] font-bold flex items-center justify-center">
                {activeFilters.length}
              </span>
            )}
          </button>
        </div>
      </PageHeader>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 pb-20">
        {/* Filters panel */}
        <AnimatedPanel show={showFilters}>
          <div className="mb-8 p-6 rounded-2xl bg-white border border-navy-100/50 shadow-sm">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <SelectFilter label="Industry" value={industry} options={industries} onChange={setIndustry} />
              <SelectFilter label="Location" value={locationFilter} options={locations} onChange={setLocationFilter} />
              <SelectFilter label="Sort by" value={sort} options={sortOptions.map(s => s.label)} onChange={setSort} />
              <div className="space-y-1.5">
                <label className="block text-[13px] font-medium text-navy-700">Min Rating</label>
                <div className="flex items-center gap-2">
                  {[0, 3, 3.5, 4, 4.5].map(r => (
                    <button
                      key={r}
                      onClick={() => setRatingFilter(r)}
                      className={`h-9 px-3 rounded-lg text-xs font-medium border transition-all ${
                        ratingFilter === r
                          ? 'bg-navy-900 text-white border-navy-900'
                          : 'bg-white text-navy-600 border-navy-200 hover:border-navy-300'
                      }`}
                    >
                      {r === 0 ? 'Any' : `${r}+`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </AnimatedPanel>

        {/* Active filter badges */}
        {activeFilters.length > 0 && (
          <div className="flex items-center gap-2 mb-6 flex-wrap">
            <span className="text-xs text-navy-400">Active filters:</span>
            {activeFilters.map(f => (
              <span key={f} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-navy-100 text-xs font-medium text-navy-700">
                {f}
                <X size={12} className="cursor-pointer hover:text-navy-900" onClick={() => {
                  if (f === industry) setIndustry('All Industries')
                  if (typeof f === 'string' && f.startsWith('📍')) setLocationFilter('All Locations')
                  if (typeof f === 'string' && f.includes('stars')) setRatingFilter(0)
                }} />
              </span>
            ))}
            <button
              onClick={() => { setIndustry('All Industries'); setLocationFilter('All Locations'); setRatingFilter(0) }}
              className="text-xs text-navy-500 hover:text-navy-700 transition-colors"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Results count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-navy-500">
            {loading
              ? <span className="text-navy-400">Loading…</span>
              : <><span className="font-semibold text-navy-900">{pagination.total}</span> companies found</>
            }
          </p>
          <div className="hidden sm:flex items-center gap-2 text-xs text-navy-400">
            <ArrowUpDown size={14} />
            <span>Sorted by {sort.toLowerCase()}</span>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="mb-8 p-6 rounded-2xl bg-red-50 border border-red-100 text-center">
            <AlertCircle size={24} className="mx-auto text-red-400 mb-2" />
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && !error && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: LIMIT }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-navy-100/50 overflow-hidden animate-pulse">
                <div className="h-1.5 bg-navy-100" />
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-navy-100" />
                    <div className="flex-1 space-y-2">
                      <div className="h-5 bg-navy-100 rounded w-2/3" />
                      <div className="h-3 bg-navy-50 rounded w-1/2" />
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="h-3 bg-navy-50 rounded w-full" />
                    <div className="h-3 bg-navy-50 rounded w-4/5" />
                  </div>
                  <div className="mt-5 pt-4 border-t border-navy-100/50 flex justify-between">
                    <div className="h-4 bg-navy-50 rounded w-16" />
                    <div className="h-4 bg-navy-50 rounded w-20" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && companies.length === 0 && (
          <div className="py-20 text-center">
            <Building2 size={48} className="mx-auto text-navy-200 mb-4" />
            <p className="text-lg font-semibold text-navy-700">No companies found</p>
            <p className="text-sm text-navy-400 mt-1">Try adjusting your search or filters.</p>
          </div>
        )}

        {/* Company grid */}
        {!loading && !error && companies.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {companies.map((company, i) => {
            const gradient = pickGradient(company.name)
            return (
            <Reveal key={company.id} delay={i * 0.05}>
              <Link
                to={`/companies/${company.id}`}
                className="group block bg-white rounded-2xl border border-navy-100/50 overflow-hidden hover:border-navy-200 hover:shadow-lg hover:shadow-navy-900/4 transition-all duration-300"
              >
                {/* Card header accent */}
                <div className={`h-1.5 bg-gradient-to-r ${gradient}`} />
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0`}>
                      <Building2 size={22} className="text-white" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-navy-900 text-lg group-hover:text-navy-700 transition-colors truncate">
                        {company.name}
                      </h3>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-navy-400">{company.industry}</span>
                        <span className="text-navy-200">·</span>
                        <span className="flex items-center gap-1 text-xs text-navy-400">
                          <MapPin size={11} />
                          {company.location}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="mt-4 text-sm text-navy-500 leading-relaxed line-clamp-2">
                    {company.description || 'No description available.'}
                  </p>

                  <div className="mt-5 pt-4 border-t border-navy-100/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <StarRating rating={Number(company.overall_rating)} size={14} />
                      <span className="text-sm font-bold text-navy-900">{Number(company.overall_rating).toFixed(1)}</span>
                      <span className="text-xs text-navy-300">/5</span>
                    </div>
                    <span className="text-xs text-navy-400 font-medium">
                      {company.total_reviews ?? 0} review{(company.total_reviews ?? 0) !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </Link>
            </Reveal>
            )
          })}
        </div>
        )}

        {/* Pagination */}
        {!loading && pagination.totalPages > 1 && (
        <div className="mt-12 flex items-center justify-center gap-2">
          {buildPageButtons(page, pagination.totalPages).map((pg, i) => (
            <button
              key={i}
              disabled={pg === '...'}
              onClick={() => typeof pg === 'number' && setPage(pg)}
              className={`w-10 h-10 rounded-xl text-sm font-medium transition-all ${
                pg === page
                  ? 'bg-navy-900 text-white'
                  : typeof pg === 'number'
                  ? 'text-navy-600 hover:bg-navy-50 cursor-pointer'
                  : 'text-navy-300 cursor-default'
              }`}
            >
              {pg}
            </button>
          ))}
        </div>
        )}
      </div>
    </div>
  )
}

/* ─── Helper components ─── */
function AnimatedPanel({ show, children }) {
  return (
    <motion.div
      initial={false}
      animate={{ height: show ? 'auto' : 0, opacity: show ? 1 : 0 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="overflow-hidden"
    >
      {children}
    </motion.div>
  )
}

function SelectFilter({ label, value, options, onChange }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[13px] font-medium text-navy-700">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-10 rounded-xl border border-navy-200 bg-white pl-3 pr-8 text-sm text-navy-700 appearance-none focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 transition-all cursor-pointer"
        >
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400 pointer-events-none" />
      </div>
    </div>
  )
}
