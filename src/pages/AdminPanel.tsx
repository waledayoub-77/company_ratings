import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Shield,
  Users,
  Building2,
  FileText,
  Flag,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  ChevronDown,
  Eye,
  Ban,
  Trash2,
  BarChart3,
  Activity,
  Clock,
} from 'lucide-react'
import PageHeader from '../components/ui/PageHeader.tsx'
import Badge from '../components/ui/Badge.tsx'
import Reveal from '../components/ui/Reveal.tsx'

/* ─── Mock data ─── */
const platformStats = [
  { label: 'Total Users', value: '12,450', icon: Users, change: '+340 this month' },
  { label: 'Companies', value: '856', icon: Building2, change: '+28 this month' },
  { label: 'Reviews', value: '34,200', icon: FileText, change: '+1,200 this month' },
  { label: 'Open Reports', value: '7', icon: Flag, change: '3 urgent' },
]

const reportedReviews = [
  {
    id: 1,
    review: 'This company is terrible. Management is corrupt and incompetent.',
    reviewer: 'Anonymous',
    company: 'NovaCo',
    reportedBy: 'HR Admin',
    reason: 'Harassment',
    description: 'Contains potentially defamatory language about specific managers.',
    date: '2026-02-17',
    status: 'pending',
  },
  {
    id: 2,
    review: 'Great salary but literally everything else is fake. They stage employee events for LinkedIn.',
    reviewer: 'Marcus T.',
    company: 'MediaPulse',
    reportedBy: 'Company Admin',
    reason: 'False Information',
    description: 'Claims in the review are disputed by the company.',
    date: '2026-02-16',
    status: 'pending',
  },
  {
    id: 3,
    review: 'kjashdf asdkjhf spam review test test',
    reviewer: 'Anonymous',
    company: 'Stripe',
    reportedBy: 'User Report',
    reason: 'Spam',
    description: 'Clearly a spam/test review with no meaningful content.',
    date: '2026-02-15',
    status: 'pending',
  },
]

const pendingCompanies = [
  { id: 1, name: 'NeoFinance', industry: 'Finance', admin: 'Sarah Lee', email: 'sarah@neofinance.com', date: '2026-02-17' },
  { id: 2, name: 'CloudBase', industry: 'Technology', admin: 'David Park', email: 'david@cloudbase.io', date: '2026-02-16' },
]

const auditLog = [
  { action: 'Removed review #3421', admin: 'Admin User', reason: 'Spam content', date: '2026-02-17 14:30' },
  { action: 'Suspended user @spammer42', admin: 'Admin User', reason: 'Multiple spam reviews', date: '2026-02-17 14:25' },
  { action: 'Approved company "TechFlow"', admin: 'Admin User', reason: 'Verified registration', date: '2026-02-16 10:15' },
  { action: 'Dismissed report #892', admin: 'Admin User', reason: 'Review meets guidelines', date: '2026-02-15 16:40' },
  { action: 'Removed review #3389', admin: 'Admin User', reason: 'Harassment content', date: '2026-02-14 11:20' },
]

const usersList = [
  { id: 1, name: 'John Doe', email: 'john@email.com', role: 'Employee', status: 'active', reviews: 3, joined: '2025-01-15' },
  { id: 2, name: 'Sarah Lee', email: 'sarah@neofinance.com', role: 'Company Admin', status: 'active', reviews: 0, joined: '2025-03-20' },
  { id: 3, name: 'Bob Spammer', email: 'spam@email.com', role: 'Employee', status: 'suspended', reviews: 0, joined: '2026-02-01' },
  { id: 4, name: 'Emily Chen', email: 'emily@stripe.com', role: 'Employee', status: 'active', reviews: 5, joined: '2024-06-10' },
  { id: 5, name: 'Marcus Johnson', email: 'marcus@notion.com', role: 'Employee', status: 'active', reviews: 2, joined: '2024-09-15' },
]

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<'overview' | 'reports' | 'companies' | 'users' | 'audit'>('overview')

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: BarChart3 },
    { id: 'reports' as const, label: 'Reports', icon: Flag, badge: reportedReviews.length },
    { id: 'companies' as const, label: 'Companies', icon: Building2, badge: pendingCompanies.length },
    { id: 'users' as const, label: 'Users', icon: Users },
    { id: 'audit' as const, label: 'Audit Log', icon: Activity },
  ]

  return (
    <div className="min-h-screen bg-ice-50">
      <PageHeader
        tag="System Admin"
        title="Platform Administration"
        subtitle="Moderate content, manage users and companies, and monitor platform health."
      />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 pb-20">
        {/* Tabs */}
        <div className="flex items-center gap-1 mb-8 border-b border-navy-100/50 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id ? 'text-navy-900' : 'text-navy-400 hover:text-navy-600'
              }`}
            >
              <tab.icon size={15} />
              {tab.label}
              {tab.badge && (
                <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {tab.badge}
                </span>
              )}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="adminTab"
                  className="absolute bottom-0 left-2 right-2 h-[2px] bg-navy-500 rounded-full"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'reports' && <ReportsTab />}
        {activeTab === 'companies' && <CompaniesTab />}
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'audit' && <AuditTab />}
      </div>
    </div>
  )
}

/* ─── Overview Tab ─── */
function OverviewTab() {
  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {platformStats.map((stat, i) => (
          <Reveal key={stat.label} delay={i * 0.08}>
            <div className="bg-white rounded-2xl border border-navy-100/50 p-5">
              <stat.icon size={18} className="text-navy-500 mb-3" strokeWidth={1.8} />
              <p className="text-2xl font-serif font-bold text-navy-900">{stat.value}</p>
              <p className="text-xs text-navy-400 mt-1">{stat.label}</p>
              <p className="text-[11px] text-navy-300 mt-2">{stat.change}</p>
            </div>
          </Reveal>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Reveal delay={0.1}>
          <button
            onClick={() => {}}
            className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-2xl p-5 hover:bg-red-100 transition-all w-full text-left"
          >
            <Flag size={20} className="text-red-500" />
            <div>
              <p className="text-sm font-semibold text-red-700">Review Reports</p>
              <p className="text-xs text-red-500">3 pending</p>
            </div>
          </button>
        </Reveal>
        <Reveal delay={0.15}>
          <button className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-2xl p-5 hover:bg-amber-100 transition-all w-full text-left">
            <Building2 size={20} className="text-amber-600" />
            <div>
              <p className="text-sm font-semibold text-amber-700">Company Approvals</p>
              <p className="text-xs text-amber-500">2 waiting</p>
            </div>
          </button>
        </Reveal>
        <Reveal delay={0.2}>
          <button className="flex items-center gap-3 bg-navy-50 border border-navy-100 rounded-2xl p-5 hover:bg-navy-100 transition-all w-full text-left">
            <Activity size={20} className="text-navy-600" />
            <div>
              <p className="text-sm font-semibold text-navy-700">Audit Log</p>
              <p className="text-xs text-navy-400">5 recent actions</p>
            </div>
          </button>
        </Reveal>
      </div>
    </div>
  )
}

/* ─── Reports Tab ─── */
function ReportsTab() {
  const [reports, setReports] = useState(reportedReviews)

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-navy-900 mb-2">
        Reported Reviews <span className="text-sm font-normal text-navy-400">({reports.length} pending)</span>
      </h2>

      {reports.map((report, i) => (
        <Reveal key={report.id} delay={i * 0.05}>
          <div className="bg-white rounded-2xl border border-navy-100/50 p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={
                    report.reason === 'Harassment' ? 'danger' :
                    report.reason === 'False Information' ? 'warning' : 'default'
                  }>
                    {report.reason}
                  </Badge>
                  <span className="text-xs text-navy-400">
                    at <strong className="text-navy-600">{report.company}</strong>
                  </span>
                </div>
                <p className="text-xs text-navy-400">
                  Reported by {report.reportedBy} · {new Date(report.date).toLocaleDateString()}
                </p>
              </div>
              <AlertTriangle size={18} className="text-amber-500 shrink-0" />
            </div>

            {/* Reported review */}
            <div className="bg-red-50/50 rounded-xl p-4 border border-red-100/50 mb-3">
              <p className="text-xs font-medium text-red-600 mb-1">Reported Review</p>
              <p className="text-sm text-navy-700 italic">"{report.review}"</p>
              <p className="text-xs text-navy-400 mt-2">— {report.reviewer}</p>
            </div>

            {/* Reporter notes */}
            <p className="text-xs text-navy-500 mb-4">
              <strong>Reporter notes:</strong> {report.description}
            </p>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-3 border-t border-navy-50">
              <button
                onClick={() => setReports(prev => prev.filter(r => r.id !== report.id))}
                className="h-9 px-4 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1.5"
              >
                <Trash2 size={13} />
                Remove Review
              </button>
              <button
                onClick={() => setReports(prev => prev.filter(r => r.id !== report.id))}
                className="h-9 px-4 border border-navy-200 text-navy-600 text-xs font-medium rounded-lg hover:bg-navy-50 transition-colors flex items-center gap-1.5"
              >
                <CheckCircle2 size={13} />
                Dismiss Report
              </button>
              <button className="h-9 px-4 text-xs text-navy-400 hover:text-navy-600 transition-colors">
                Contact Reporter
              </button>
            </div>
          </div>
        </Reveal>
      ))}
    </div>
  )
}

/* ─── Companies Tab ─── */
function CompaniesTab() {
  const [companies, setCompanies] = useState(pendingCompanies)

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-navy-900">
        Pending Company Registrations
        <span className="text-sm font-normal text-navy-400 ml-2">({companies.length})</span>
      </h2>

      {companies.map((company, i) => (
        <Reveal key={company.id} delay={i * 0.08}>
          <div className="bg-white rounded-2xl border border-navy-100/50 p-6 hover:border-navy-200 transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-4 flex-1">
                <div className="w-12 h-12 rounded-xl bg-navy-100 flex items-center justify-center">
                  <Building2 size={22} className="text-navy-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-navy-900">{company.name}</h3>
                  <p className="text-xs text-navy-400 mt-0.5">{company.industry} · Admin: {company.admin}</p>
                  <p className="text-xs text-navy-300 mt-0.5">{company.email} · {new Date(company.date).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCompanies(prev => prev.filter(c => c.id !== company.id))}
                  className="h-9 px-4 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle2 size={14} />
                  Approve
                </button>
                <button
                  onClick={() => setCompanies(prev => prev.filter(c => c.id !== company.id))}
                  className="h-9 px-4 border border-red-200 text-red-600 text-xs font-medium rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1.5"
                >
                  <XCircle size={14} />
                  Reject
                </button>
              </div>
            </div>
          </div>
        </Reveal>
      ))}
    </div>
  )
}

/* ─── Users Tab ─── */
function UsersTab() {
  const [search, setSearch] = useState('')

  const filtered = usersList.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-navy-900">User Management</h2>
        <div className="relative w-64">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 rounded-xl border border-navy-200 bg-white pl-10 pr-4 text-sm placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 transition-all"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-navy-100/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-navy-100/50">
                <th className="text-left text-xs font-semibold text-navy-400 uppercase tracking-wider px-6 py-4">User</th>
                <th className="text-left text-xs font-semibold text-navy-400 uppercase tracking-wider px-6 py-4">Role</th>
                <th className="text-left text-xs font-semibold text-navy-400 uppercase tracking-wider px-6 py-4">Status</th>
                <th className="text-left text-xs font-semibold text-navy-400 uppercase tracking-wider px-6 py-4">Reviews</th>
                <th className="text-left text-xs font-semibold text-navy-400 uppercase tracking-wider px-6 py-4">Joined</th>
                <th className="text-right text-xs font-semibold text-navy-400 uppercase tracking-wider px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(user => (
                <tr key={user.id} className="border-b border-navy-50 last:border-0 hover:bg-navy-50/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-navy-400 to-navy-600 flex items-center justify-center">
                        <span className="text-white text-xs font-semibold">
                          {user.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-navy-900">{user.name}</p>
                        <p className="text-xs text-navy-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={user.role === 'Company Admin' ? 'info' : 'default'}>{user.role}</Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={user.status === 'active' ? 'success' : 'danger'}>{user.status}</Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-navy-600">{user.reviews}</td>
                  <td className="px-6 py-4 text-xs text-navy-400">{new Date(user.joined).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button className="w-8 h-8 rounded-lg flex items-center justify-center text-navy-400 hover:bg-navy-50 hover:text-navy-600 transition-colors">
                        <Eye size={14} />
                      </button>
                      <button className="w-8 h-8 rounded-lg flex items-center justify-center text-navy-400 hover:bg-amber-50 hover:text-amber-600 transition-colors">
                        <Ban size={14} />
                      </button>
                      <button className="w-8 h-8 rounded-lg flex items-center justify-center text-navy-400 hover:bg-red-50 hover:text-red-600 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

/* ─── Audit Tab ─── */
function AuditTab() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-navy-900 mb-2">Audit Log</h2>

      <div className="bg-white rounded-2xl border border-navy-100/50 overflow-hidden">
        {auditLog.map((entry, i) => (
          <div
            key={i}
            className={`flex items-start gap-4 px-6 py-4 ${
              i < auditLog.length - 1 ? 'border-b border-navy-50' : ''
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-navy-50 flex items-center justify-center shrink-0 mt-0.5">
              <Shield size={14} className="text-navy-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-navy-800 font-medium">{entry.action}</p>
              <p className="text-xs text-navy-400 mt-0.5">
                by {entry.admin} · Reason: {entry.reason}
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-navy-400 shrink-0">
              <Clock size={12} />
              {entry.date}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
