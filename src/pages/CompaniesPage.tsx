import { useState } from 'react'
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
} from 'lucide-react'
import PageHeader from '../components/ui/PageHeader.tsx'
import Reveal from '../components/ui/Reveal.tsx'

/* ─── Mock data ─── */
const industries = ['All Industries', 'Technology', 'Finance', 'Healthcare', 'Education', 'Retail', 'Media', 'Manufacturing']
const locations = ['All Locations', 'New York', 'San Francisco', 'London', 'Berlin', 'Toronto', 'Remote']
const sortOptions = ['Highest Rated', 'Most Reviewed', 'Alphabetical', 'Recently Added']

const companies = [
  { id: 1, name: 'Stripe', industry: 'Fintech', location: 'San Francisco', rating: 4.7, reviews: 342, desc: 'Financial infrastructure for the internet. Building economic tools for businesses worldwide.', gradient: 'from-indigo-500 to-violet-600' },
  { id: 2, name: 'Notion', industry: 'Technology', location: 'New York', rating: 4.6, reviews: 218, desc: 'All-in-one workspace for notes, docs, and project management.', gradient: 'from-navy-500 to-navy-700' },
  { id: 3, name: 'Linear', industry: 'Technology', location: 'Remote', rating: 4.8, reviews: 156, desc: 'The issue tracking tool you\'ll enjoy using. Streamlined for modern teams.', gradient: 'from-cyan-500 to-blue-600' },
  { id: 4, name: 'Vercel', industry: 'Technology', location: 'San Francisco', rating: 4.5, reviews: 289, desc: 'Frontend cloud platform enabling developers to build and deploy web applications.', gradient: 'from-gray-800 to-gray-950' },
  { id: 5, name: 'Figma', industry: 'Technology', location: 'San Francisco', rating: 4.4, reviews: 431, desc: 'Collaborative interface design tool that connects everyone in the design process.', gradient: 'from-pink-500 to-rose-600' },
  { id: 6, name: 'Datadog', industry: 'Technology', location: 'New York', rating: 4.2, reviews: 198, desc: 'Monitoring and analytics platform for cloud-scale infrastructure and applications.', gradient: 'from-purple-500 to-indigo-600' },
  { id: 7, name: 'Plaid', industry: 'Fintech', location: 'San Francisco', rating: 4.3, reviews: 167, desc: 'Building the infrastructure for a connected financial ecosystem.', gradient: 'from-emerald-500 to-teal-600' },
  { id: 8, name: 'Airtable', industry: 'Technology', location: 'San Francisco', rating: 4.1, reviews: 245, desc: 'Low-code platform for building collaborative apps that evolve with your organization.', gradient: 'from-amber-500 to-orange-600' },
  { id: 9, name: 'Mercury', industry: 'Finance', location: 'Remote', rating: 4.6, reviews: 128, desc: 'Banking for startups. Powerful financial tools designed for ambitious companies.', gradient: 'from-blue-500 to-sky-600' },
]

export default function CompaniesPage() {
  const [search, setSearch] = useState('')
  const [industry, setIndustry] = useState('All Industries')
  const [location, setLocation] = useState('All Locations')
  const [sort, setSort] = useState('Highest Rated')
  const [showFilters, setShowFilters] = useState(false)
  const [ratingFilter, setRatingFilter] = useState(0)

  const filtered = companies
    .filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    .filter(c => industry === 'All Industries' || c.industry === industry)
    .filter(c => location === 'All Locations' || c.location === location)
    .filter(c => c.rating >= ratingFilter)
    .sort((a, b) => {
      if (sort === 'Highest Rated') return b.rating - a.rating
      if (sort === 'Most Reviewed') return b.reviews - a.reviews
      if (sort === 'Alphabetical') return a.name.localeCompare(b.name)
      return 0
    })

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
              <span key={f as string} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-navy-100 text-xs font-medium text-navy-700">
                {f as string}
                <X size={12} className="cursor-pointer hover:text-navy-900" onClick={() => {
                  if (f === industry) setIndustry('All Industries')
                  if (f === location) setLocation('All Locations')
                  if (typeof f === 'string' && f.includes('stars')) setRatingFilter(0)
                }} />
              </span>
            ))}
            <button
              onClick={() => { setIndustry('All Industries'); setLocation('All Locations'); setRatingFilter(0) }}
              className="text-xs text-navy-500 hover:text-navy-700 transition-colors"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Results count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-navy-500">
            <span className="font-semibold text-navy-900">{filtered.length}</span> companies found
          </p>
          <div className="hidden sm:flex items-center gap-2 text-xs text-navy-400">
            <ArrowUpDown size={14} />
            <span>Sorted by {sort.toLowerCase()}</span>
          </div>
        </div>

        {/* Company grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((company, i) => (
            <Reveal key={company.id} delay={i * 0.05}>
              <Link
                to={`/companies/${company.id}`}
                className="group block bg-white rounded-2xl border border-navy-100/50 overflow-hidden hover:border-navy-200 hover:shadow-lg hover:shadow-navy-900/4 transition-all duration-300"
              >
                {/* Card header accent */}
                <div className={`h-1.5 bg-gradient-to-r ${company.gradient}`} />
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${company.gradient} flex items-center justify-center shrink-0`}>
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
                    {company.desc}
                  </p>

                  <div className="mt-5 pt-4 border-t border-navy-100/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Star size={15} className="fill-amber-400 text-amber-400" />
                        <span className="text-sm font-bold text-navy-900">{company.rating}</span>
                      </div>
                      <span className="text-xs text-navy-300">/5</span>
                    </div>
                    <span className="text-xs text-navy-400 font-medium">
                      {company.reviews} reviews
                    </span>
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>

        {/* Pagination */}
        <div className="mt-12 flex items-center justify-center gap-2">
          {[1, 2, 3, '...', 12].map((page, i) => (
            <button
              key={i}
              className={`w-10 h-10 rounded-xl text-sm font-medium transition-all ${
                page === 1
                  ? 'bg-navy-900 text-white'
                  : typeof page === 'number'
                  ? 'text-navy-600 hover:bg-navy-50'
                  : 'text-navy-300 cursor-default'
              }`}
            >
              {page}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─── Helper components ─── */
function AnimatedPanel({ show, children }: { show: boolean; children: React.ReactNode }) {
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

function SelectFilter({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
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
