import { useState, useEffect, useCallback } from 'react'
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
  Loader2,
} from 'lucide-react'
import PageHeader from '../components/ui/PageHeader.jsx'
import Reveal from '../components/ui/Reveal.jsx'
import { getCompanies } from '../api/companies'

/* ─── Filter options ─── */
const industries = ['All Industries', 'Technology', 'Finance', 'Healthcare', 'Education', 'Retail', 'Media', 'Manufacturing']
const locations = ['All Locations', 'New York', 'San Francisco', 'London', 'Berlin', 'Toronto', 'Remote']

// Map frontend sort options to backend sort values
const sortOptionsMap = {
  'Highest Rated': 'highest',
  'Lowest Rated': 'lowest',
  'Most Reviewed': 'reviews',
  'Alphabetical': 'name',
}
const sortOptions = Object.keys(sortOptionsMap)

// Gradient colors for company cards (rotate through these)
const gradients = [
  'from-indigo-500 to-violet-600',
  'from-navy-500 to-navy-700',
  'from-cyan-500 to-blue-600',
  'from-gray-800 to-gray-950',
  'from-pink-500 to-rose-600',
  'from-purple-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-blue-500 to-sky-600',
]

export default function CompaniesPage() {
  const [search, setSearch] = useState('')
  const [industry, setIndustry] = useState('All Industries')
  const [location, setLocation] = useState('All Locations')
  const [sort, setSort] = useState('Highest Rated')
  const [showFilters, setShowFilters] = useState(false)
  const [ratingFilter, setRatingFilter] = useState(0)
  
  // API data
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Debounce search input (300ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  // Fetch companies from API
  const fetchCompanies = useCallback(async (page = 1) => {
    setLoading(true)
    setError(null)
    try {
      const params = {
        page,
        limit: 9,
      }
      
      if (debouncedSearch) params.search = debouncedSearch
      if (industry !== 'All Industries') params.industry = industry
      if (location !== 'All Locations') params.location = location
      if (ratingFilter > 0) params.minRating = ratingFilter
      if (sort) params.sort = sortOptionsMap[sort]

      const response = await getCompanies(params)
      
      setCompanies(response.data || [])
      setPagination({
        page: response.pagination?.page || 1,
        totalPages: response.pagination?.totalPages || 1,
        total: response.pagination?.total || 0,
      })
    } catch (err) {
      console.error('Error fetching companies:', err)
      setError(err.message || 'Failed to load companies')
      setCompanies([])
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, industry, location, ratingFilter, sort])

  // Fetch companies when filters change
  useEffect(() => {
    fetchCompanies(1) // Reset to page 1 when filters change
  }, [fetchCompanies])

  const filtered = companies
  const activeFilters = [industry !== 'All Industries' && industry, location !== 'All Locations' && location, ratingFilter > 0 && `${ratingFilter}+ stars`].filter(Boolean)

  return (
    <div className="min-h-screen bg-ice-50">
      <PageHeader
        tag="Explore"
        title="Browse Companies"
        subtitle="Discover verified reviews from real employees at companies across every industry."
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
              <SelectFilter label="Location" value={location} options={locations} onChange={setLocation} />
              <SelectFilter label="Sort by" value={sort} options={sortOptions} onChange={setSort} />
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
                  if (f === location) setLocation('All Locations')
                  if (typeof f === 'string' && f.includes('stars')) setRatingFilter(0)
                }} />
              </span>
            ))}
            <button
              onClick={() => { 
                setIndustry('All Industries')
                setLocation('All Locations')
                setRatingFilter(0)
                setSearch('')
              }}
              className="text-xs text-navy-500 hover:text-navy-700 transition-colors"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Results count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-navy-500">
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 size={14} className="animate-spin" />
                Loading...
              </span>
            ) : (
              <>
                <span className="font-semibold text-navy-900">{pagination.total}</span> companies found
              </>
            )}
          </p>
          <div className="hidden sm:flex items-center gap-2 text-xs text-navy-400">
            <ArrowUpDown size={14} />
            <span>Sorted by {sort.toLowerCase()}</span>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-navy-100/50 overflow-hidden animate-pulse">
                <div className="h-1.5 bg-navy-200" />
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-navy-100" />
                    <div className="flex-1 space-y-2">
                      <div className="h-5 bg-navy-100 rounded w-3/4" />
                      <div className="h-4 bg-navy-100 rounded w-1/2" />
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="h-4 bg-navy-100 rounded" />
                    <div className="h-4 bg-navy-100 rounded w-5/6" />
                  </div>
                  <div className="mt-5 pt-4 border-t border-navy-100/50 flex justify-between">
                    <div className="h-4 bg-navy-100 rounded w-12" />
                    <div className="h-4 bg-navy-100 rounded w-16" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-navy-100 flex items-center justify-center">
              <Building2 size={28} className="text-navy-400" />
            </div>
            <h3 className="text-lg font-semibold text-navy-900 mb-2">No companies found</h3>
            <p className="text-sm text-navy-500 mb-6">
              Try adjusting your filters or search query
            </p>
            <button
              onClick={() => {
                setSearch('')
                setIndustry('All Industries')
                setLocation('All Locations')
                setRatingFilter(0)
              }}
              className="px-4 py-2 bg-navy-900 text-white rounded-lg text-sm font-medium hover:bg-navy-800 transition-colors"
            >
              Clear all filters
            </button>
          </div>
        )}

        {/* Company grid */}
        {!loading && !error && filtered.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((company, i) => (
              <Reveal key={company.id} delay={i * 0.05}>
                <Link
                  to={`/companies/${company.id}`}
                  className="group block bg-white rounded-2xl border border-navy-100/50 overflow-hidden hover:border-navy-200 hover:shadow-lg hover:shadow-navy-900/4 transition-all duration-300"
                >
                  {/* Card header accent */}
                  <div className={`h-1.5 bg-gradient-to-r ${gradients[i % gradients.length]}`} />
                  <div className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradients[i % gradients.length]} flex items-center justify-center shrink-0`}>
                        <Building2 size={22} className="text-white" strokeWidth={1.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-navy-900 text-lg group-hover:text-navy-700 transition-colors truncate">
                          {company.name}
                        </h3>
                        <div className="flex items-center gap-3 mt-0.5">
                          {company.industry && (
                            <>
                              <span className="text-xs text-navy-400">{company.industry}</span>
                              {company.location && <span className="text-navy-200">·</span>}
                            </>
                          )}
                          {company.location && (
                            <span className="flex items-center gap-1 text-xs text-navy-400">
                              <MapPin size={11} />
                              {company.location}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <p className="mt-4 text-sm text-navy-500 leading-relaxed line-clamp-2">
                      {company.description || 'No description available.'}
                    </p>

                    <div className="mt-5 pt-4 border-t border-navy-100/50 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Star size={15} className="fill-amber-400 text-amber-400" />
                          <span className="text-sm font-bold text-navy-900">
                            {company.average_rating ? Number(company.average_rating).toFixed(1) : 'N/A'}
                          </span>
                        </div>
                        {company.average_rating && <span className="text-xs text-navy-300">/5</span>}
                      </div>
                      <span className="text-xs text-navy-400 font-medium">
                        {company.total_reviews || 0} reviews
                      </span>
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && filtered.length > 0 && pagination.totalPages > 1 && (
          <div className="mt-12 flex items-center justify-center gap-2">
            {/* Previous button */}
            <button
              onClick={() => fetchCompanies(pagination.page - 1)}
              disabled={pagination.page === 1}
              className={`px-3 h-10 rounded-xl text-sm font-medium transition-all ${
                pagination.page === 1
                  ? 'text-navy-300 cursor-not-allowed'
                  : 'text-navy-600 hover:bg-navy-50'
              }`}
            >
              Previous
            </button>

            {/* Page numbers */}
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
              .filter(page => {
                // Show first page, last page, current page, and surrounding pages
                return (
                  page === 1 ||
                  page === pagination.totalPages ||
                  Math.abs(page - pagination.page) <= 1
                )
              })
              .map((page, i, arr) => {
                // Add ellipsis if there's a gap
                const prevPage = arr[i - 1]
                const showEllipsis = prevPage && page - prevPage > 1

                return (
                  <div key={page} className="flex items-center gap-2">
                    {showEllipsis && (
                      <span className="text-navy-300 cursor-default">...</span>
                    )}
                    <button
                      onClick={() => fetchCompanies(page)}
                      className={`w-10 h-10 rounded-xl text-sm font-medium transition-all ${
                        page === pagination.page
                          ? 'bg-navy-900 text-white'
                          : 'text-navy-600 hover:bg-navy-50'
                      }`}
                    >
                      {page}
                    </button>
                  </div>
                )
              })}

            {/* Next button */}
            <button
              onClick={() => fetchCompanies(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className={`px-3 h-10 rounded-xl text-sm font-medium transition-all ${
                pagination.page === pagination.totalPages
                  ? 'text-navy-300 cursor-not-allowed'
                  : 'text-navy-600 hover:bg-navy-50'
              }`}
            >
              Next
            </button>
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
