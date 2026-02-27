import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User,
  Mail,
  Briefcase,
  Calendar,
  Building2,
  Edit3,
  Save,
  X,
  Shield,
  Star,
  FileText,
  CheckCircle2,
  ChevronRight,
  Tag,
  Plus,
  Eye,
  EyeOff,
} from 'lucide-react'
import PageHeader from '../components/ui/PageHeader.jsx'
import Badge from '../components/ui/Badge.jsx'
import Reveal from '../components/ui/Reveal.jsx'
import { useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button.jsx'
import Input from '../components/ui/Input.jsx'
import { useAuth } from '../context/AuthContext'
import { apiGetMe, apiUpdateMe, apiChangePassword } from '../api/auth'
import { getEmployeeProfile, updateEmployeeProfile } from '../api/employees'
import { getMyEmployments } from '../api/employments'
import { getMyReviews } from '../api/reviews'
import { getFeedbackGiven, getFeedbackReceived } from '../api/feedback'

export default function ProfilePage() {
  const { user, updateUser, logout } = useAuth()
  const navigate     = useNavigate()
  const employeeId   = user?.employeeId
  const originalEmailRef = useRef('')

  const [editing, setEditing] = useState(false)
  const [activeSection, setActiveSection] = useState('profile')
  const [form, setForm] = useState({
    fullName:          '',
    email:             '',
    currentPosition:   '',
    bio:               '',
    skills:            [],
    profileVisibility: 'public',
    joined:            '',
  })
  const [employments, setEmployments] = useState([])
  const [activityStats, setActivityStats] = useState({ totalReviews: 0, feedbackGiven: 0, feedbackReceived: 0, avgRating: '–' })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState('')
  const [loading, setLoading] = useState(true)

  // Capture original email the moment editing starts so we can detect a change
  useEffect(() => {
    if (editing) originalEmailRef.current = form.email
  }, [editing]) // eslint-disable-line react-hooks/exhaustive-deps
  const [resolvedEmployeeId, setResolvedEmployeeId] = useState(employeeId ?? null)

  /* Resolve employeeId — login response doesn't include it, only /auth/me does */
  useEffect(() => {
    if (employeeId) {
      setResolvedEmployeeId(employeeId)
      return
    }
    if (!user?.id) {
      setLoading(false)
      return
    }
    apiGetMe()
      .then(res => {
        const me = res?.data?.user ?? res?.data ?? res
        const eid = me?.employeeId ?? null
        setResolvedEmployeeId(eid)
        // For non-employee users (system_admin, company_admin) there is no employee profile.
        // Populate what we can from the /auth/me response so the page is not blank.
        if (!eid) {
          setForm(f => ({
            ...f,
            fullName: me?.fullName ?? me?.full_name ?? user?.email ?? '',
            email:    me?.email    ?? user?.email    ?? '',
            joined:   me?.createdAt ?? me?.created_at ?? '',
          }))
          setLoading(false)
        }
      })
      .catch(() => setLoading(false))
  }, [user?.id, employeeId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!resolvedEmployeeId) {
      if (!user?.id) return          // still waiting for user
      setLoading(false)              // user has no employee profile
      return
    }

    setLoading(true)

    /* Load employee profile */
    getEmployeeProfile(resolvedEmployeeId)
      .then(res => {
        const e = res?.data ?? {}
        setForm({
          fullName:          e.full_name          ?? '',
          email:             user?.email          ?? '',
          currentPosition:   e.current_position   ?? '',
          bio:               e.bio                ?? '',
          skills:            Array.isArray(e.skills) ? e.skills : [],
          profileVisibility: e.profile_visibility ?? 'public',
          joined:            e.created_at         ?? '',
        })
      })
      .catch(() => {
        setForm(f => ({ ...f, email: user?.email ?? '' }))
      })
      .finally(() => setLoading(false))

    /* Load employments */
    getMyEmployments()
      .then(res => setEmployments(res?.data ?? []))
      .catch(() => {})

    /* Load activity stats */
    Promise.allSettled([getMyReviews(), getFeedbackGiven(), getFeedbackReceived()])
      .then(([reviewsRes, givenRes, receivedRes]) => {
        const reviews  = reviewsRes.status  === 'fulfilled' ? (reviewsRes.value?.reviews ?? reviewsRes.value?.data  ?? []) : []
        const given    = givenRes.status    === 'fulfilled' ? (givenRes.value?.data    ?? []) : []
        const received = receivedRes.status === 'fulfilled' ? (receivedRes.value?.data ?? []) : []
        const avgRating = reviews.length > 0
          ? (reviews.reduce((s, r) => s + (r.overall_rating ?? 0), 0) / reviews.length).toFixed(1)
          : '–'
        setActivityStats({
          totalReviews:     reviews.length,
          feedbackGiven:    Array.isArray(given)    ? given.length    : 0,
          feedbackReceived: Array.isArray(received) ? received.length : 0,
          avgRating,
        })
      })
  }, [resolvedEmployeeId]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async () => {
    setSaving(true)
    setSaveError('')
    setSaveSuccess('')
    try {
      const newEmail     = form.email.trim()
      const emailChanged = newEmail !== originalEmailRef.current

      if (resolvedEmployeeId) {
        // Employee-specific fields → employees table
        await updateEmployeeProfile(resolvedEmployeeId, {
          fullName:          form.fullName.trim(),
          currentPosition:   form.currentPosition.trim(),
          bio:               form.bio,
          skills:            form.skills,
          profileVisibility: form.profileVisibility,
        })
        // Email lives in users table — route through /auth/me for all roles
        if (emailChanged) {
          await apiUpdateMe({ email: newEmail })
        }
      } else {
        // Admin / company_admin: all fields through PATCH /auth/me
        await apiUpdateMe({
          fullName:        form.fullName.trim(),
          bio:             form.bio,
          currentPosition: form.currentPosition?.trim(),
          email:           newEmail,
        })
      }

      // Patch auth context so Navbar refreshes immediately
      updateUser({
        fullName: form.fullName.trim(),
        email:    newEmail,
      })

      setSaveSuccess(emailChanged
        ? 'Email updated — signing you out…'
        : 'Profile saved successfully.'
      )
      setEditing(false)

      if (emailChanged) {
        // Email changed → all sessions revoked on backend → sign out
        setSaveError('')
        setTimeout(async () => {
          await logout()
          navigate('/login')
        }, 1800)
      } else {
        setTimeout(() => setSaveSuccess(''), 3000)
      }
    } catch (err) {
      setSaveError(err?.message || 'Failed to save changes.')
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setEditing(false)
    setSaveError('')
    /* Re-fetch to restore any unsaved changes */
    if (resolvedEmployeeId) {
      getEmployeeProfile(resolvedEmployeeId).then(res => {
        const e = res?.data ?? {}
        setForm(f => ({
          ...f,
          fullName:          e.full_name          ?? f.fullName,
          currentPosition:   e.current_position   ?? f.currentPosition,
          bio:               e.bio                ?? f.bio,
          skills:            Array.isArray(e.skills) ? e.skills : f.skills,
          profileVisibility: e.profile_visibility ?? f.profileVisibility,
        }))
      }).catch(() => {})
    }
  }

  const isAdmin = user?.role === 'system_admin'
  const isCompanyAdmin = user?.role === 'company_admin'

  const sections = [
    { id: 'profile',    label: 'Profile',    icon: User      },
    ...(!isAdmin ? [{ id: 'employment', label: 'Employment', icon: Briefcase }] : []),
    ...(!isAdmin ? [{ id: 'activity',   label: 'Activity',   icon: FileText  }] : []),
    { id: 'settings',   label: 'Settings',   icon: Shield    },
  ]

  return (
    <div className="h-full flex flex-col overflow-hidden bg-ice-50">
      <PageHeader
        tag="My Account"
        title="Profile"
        subtitle="Manage your personal information, employment history, and account settings."
        backHref
      />

      <div className="flex-1 overflow-y-auto">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-[260px_1fr] gap-8">
          {/* Sidebar */}
          <aside>
            <Reveal direction="left">
              <div className="bg-white rounded-2xl border border-navy-100/50 overflow-hidden sticky top-28">
                {/* Avatar section */}
                <div className="p-6 text-center border-b border-navy-50">
                  <div className="relative inline-block mb-4">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-navy-400 to-navy-700 flex items-center justify-center">
                      <span className="text-white text-2xl font-semibold">
                        {form.fullName ? form.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : (user?.email?.[0]?.toUpperCase() ?? '?')}
                      </span>
                    </div>
                  </div>
                  <h3 className="font-semibold text-navy-900">{form.fullName || user?.email}</h3>
                  <p className="text-xs text-navy-400 mt-0.5">
                    {isAdmin ? 'System Administrator' : isCompanyAdmin ? 'Company Admin' : (form.currentPosition || 'No position set')}
                  </p>
                  {isAdmin && (
                    <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-100 text-violet-700">
                      <Shield size={9} /> Admin
                    </span>
                  )}
                </div>

                {/* Nav links */}
                <nav className="p-2">
                  {sections.map(section => (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        activeSection === section.id
                          ? 'bg-navy-50 text-navy-900'
                          : 'text-navy-400 hover:text-navy-600 hover:bg-navy-50/50'
                      }`}
                    >
                      <section.icon size={15} />
                      {section.label}
                      <ChevronRight size={13} className="ml-auto opacity-40" />
                    </button>
                  ))}
                </nav>
              </div>
            </Reveal>
          </aside>

          {/* Main content */}
          <main>
            <AnimatePresence mode="wait">
              {activeSection === 'profile' && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25 }}
                >
                  <ProfileSection
                    form={form}
                    setForm={setForm}
                    editing={editing}
                    setEditing={setEditing}
                    onSave={handleSave}
                    onCancel={handleCancelEdit}
                    saving={saving}
                    saveError={saveError}
                    saveSuccess={saveSuccess}
                    loading={loading}
                    isAdmin={isAdmin}
                  />
                </motion.div>
              )}

              {activeSection === 'employment' && (
                <motion.div
                  key="employment"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25 }}
                >
                  <EmploymentSection employments={employments} />
                </motion.div>
              )}

              {activeSection === 'activity' && (
                <motion.div
                  key="activity"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25 }}
                >
                  <ActivitySection stats={activityStats} />
                </motion.div>
              )}

              {activeSection === 'settings' && (
                <motion.div
                  key="settings"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25 }}
                >
                  <SettingsSection />
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>
      </div>
      </div>
    </div>
  )
}

/* ─── Profile Section ─── */
function ProfileSection({ form, setForm, editing, setEditing, onSave, onCancel, saving, saveError, saveSuccess, loading, isAdmin }) {
  const [skillInput, setSkillInput] = useState('')
  const skillInputRef = useRef(null)

  const addSkill = () => {
    const s = skillInput.trim()
    if (s && !form.skills.includes(s)) {
      setForm(f => ({ ...f, skills: [...f.skills, s] }))
    }
    setSkillInput('')
  }

  const removeSkill = (skill) => {
    setForm(f => ({ ...f, skills: f.skills.filter(s => s !== skill) }))
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-lg font-semibold text-navy-900">Personal Information</h2>
        <div className="bg-white rounded-2xl border border-navy-100/50 p-12 flex items-center justify-center">
          <svg className="animate-spin h-6 w-6 text-navy-400" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-navy-900">Personal Information</h2>
        <button
          onClick={() => editing ? onCancel() : setEditing(true)}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg transition-all ${
            editing
              ? 'bg-navy-100 text-navy-700'
              : 'border border-navy-200 text-navy-600 hover:bg-navy-50'
          }`}
        >
          {editing ? <X size={13} /> : <Edit3 size={13} />}
          {editing ? 'Cancel' : 'Edit'}
        </button>
      </div>

      {saveSuccess && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl px-4 py-3">
          <CheckCircle2 size={15} />
          {saveSuccess}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-navy-100/50 p-6">
        {editing ? (
          <div className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-5">
      <Input
                label="Full Name"
                value={form.fullName}
                onChange={(e) => setForm(f => ({ ...f, fullName: e.target.value }))}
              />
              <div>
                <Input
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                />
                <p className="text-[11px] text-amber-600 mt-1 flex items-center gap-1">
                   Changing your email will sign you out immediately.
                </p>
              </div>
            </div>
            <Input
              label="Current Position / Job Title"
              value={form.currentPosition}
              onChange={(e) => setForm(f => ({ ...f, currentPosition: e.target.value }))}
              placeholder="e.g. Senior Software Engineer"
            />
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1.5">Bio</label>
              <textarea
                value={form.bio}
                onChange={(e) => setForm(f => ({ ...f, bio: e.target.value }))}
                rows={3}
                placeholder="Tell others about yourself…"
                className="w-full rounded-xl border border-navy-200 bg-white px-4 py-3 text-sm placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 transition-all resize-none"
              />
            </div>

            {/* Skills */}
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1.5">Skills</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {form.skills.map(skill => (
                  <span key={skill} className="inline-flex items-center gap-1.5 bg-navy-50 text-navy-700 text-xs font-medium px-3 py-1.5 rounded-full border border-navy-100">
                    {skill}
                    <button type="button" onClick={() => removeSkill(skill)} className="text-navy-400 hover:text-navy-700 transition-colors">
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  ref={skillInputRef}
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill() } }}
                  placeholder="Add a skill and press Enter"
                  className="flex-1 h-10 rounded-xl border border-navy-200 bg-white px-4 text-sm placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 transition-all"
                />
                <button
                  type="button"
                  onClick={addSkill}
                  className="h-10 px-3 rounded-xl border border-navy-200 text-navy-600 hover:bg-navy-50 transition-all"
                >
                  <Plus size={15} />
                </button>
              </div>
            </div>

            {/* Profile Visibility */}
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1.5">Profile Visibility</label>
              <div className="flex gap-3">
                {['public', 'private'].map(v => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, profileVisibility: v }))}
                    className={`flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-medium border transition-all ${
                      form.profileVisibility === v
                        ? 'bg-navy-900 text-white border-navy-900'
                        : 'border-navy-200 text-navy-600 hover:bg-navy-50'
                    }`}
                  >
                    {v === 'public' ? <Eye size={14} /> : <EyeOff size={14} />}
                    {v.charAt(0).toUpperCase() + v.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {saveError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{saveError}</p>
            )}

            <div className="flex justify-end">
              <Button onClick={onSave} size="sm" disabled={saving}>
                <Save size={14} className="mr-1.5" />
                {saving ? 'Saving…' : 'Save Changes'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-y-5 gap-x-8">
              <InfoRow icon={User}      label="Full Name"      value={form.fullName        || '—'} />
              <InfoRow icon={Mail}      label="Email"          value={form.email           || '—'} />
              {isAdmin
                ? <InfoRow icon={Shield}    label="Role"           value="System Administrator" />
                : <InfoRow icon={Briefcase} label="Position"       value={form.currentPosition || '—'} />
              }
              <InfoRow icon={Calendar}  label="Member Since"   value={form.joined ? new Date(form.joined).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'} />
              {!isAdmin && <InfoRow icon={Eye} label="Visibility" value={form.profileVisibility === 'private' ? 'Private' : 'Public'} />}
            </div>
            {form.bio && (
              <div className="pt-4 border-t border-navy-50">
                <p className="text-xs font-medium text-navy-400 mb-1">Bio</p>
                <p className="text-sm text-navy-600 leading-relaxed">{form.bio}</p>
              </div>
            )}
            {!isAdmin && form.skills.length > 0 && (
              <div className="pt-4 border-t border-navy-50">
                <p className="text-xs font-medium text-navy-400 mb-2">Skills</p>
                <div className="flex flex-wrap gap-2">
                  {form.skills.map(skill => (
                    <span key={skill} className="inline-flex items-center gap-1 bg-navy-50 text-navy-700 text-xs font-medium px-3 py-1.5 rounded-full border border-navy-100">
                      <Tag size={10} />
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-navy-50 flex items-center justify-center shrink-0">
        <Icon size={14} className="text-navy-400" />
      </div>
      <div>
        <p className="text-xs text-navy-400">{label}</p>
        <p className="text-sm font-medium text-navy-800">{value}</p>
      </div>
    </div>
  )
}

/* ─── Employment Section ─── */
function EmploymentSection({ employments }) {
  if (!employments.length) return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-navy-900">Employment History</h2>
      <div className="bg-white rounded-2xl border border-navy-100/50 p-12 text-center">
        <Building2 size={28} className="text-navy-200 mx-auto mb-3" />
        <p className="text-sm text-navy-500">No employment records yet.</p>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-navy-900">Employment History</h2>

      <div className="relative pl-8">
        {/* Vertical line */}
        <div className="absolute left-[13px] top-3 bottom-3 w-[2px] bg-navy-100" />

        {employments.map((job, i) => {
          const company  = job.companies?.name ?? '—'
          const period   = job.start_date
            ? `${new Date(job.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} — ${
                job.end_date
                  ? new Date(job.end_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                  : 'Present'
              }`
            : '—'
          const status   = job.verification_status
          const verified = status === 'approved'

          return (
            <Reveal key={job.id} delay={i * 0.1}>
              <div className="relative mb-6 last:mb-0">
                {/* Dot */}
                <div className={`absolute -left-8 top-5 w-[10px] h-[10px] rounded-full border-2 ${
                  verified ? 'bg-emerald-500 border-emerald-300' : 'bg-white border-navy-300'
                }`} />

                <div className="bg-white rounded-2xl border border-navy-100/50 p-6 hover:border-navy-200 transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-navy-50 flex items-center justify-center">
                        <Building2 size={18} className="text-navy-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-navy-900">{company}</h3>
                        <p className="text-sm text-navy-500">{job.position ?? '—'}{job.department ? ` · ${job.department}` : ''}</p>
                        <p className="text-xs text-navy-400 mt-0.5">{period}</p>
                      </div>
                    </div>
                    {verified ? (
                      <Badge variant="success">
                        <CheckCircle2 size={12} className="mr-1" /> Verified
                      </Badge>
                    ) : status === 'rejected' ? (
                      <Badge variant="error">Rejected</Badge>
                    ) : (
                      <Badge variant="warning">Pending</Badge>
                    )}
                  </div>
                </div>
              </div>
            </Reveal>
          )
        })}
      </div>
    </div>
  )
}

/* ─── Activity Section ─── */
function ActivitySection({ stats }) {
  const statItems = [
    { label: 'Reviews Written',   value: stats.totalReviews,    icon: FileText },
    { label: 'Feedback Given',    value: stats.feedbackGiven,   icon: Star     },
    { label: 'Feedback Received', value: stats.feedbackReceived,icon: Star     },
    { label: 'Average Rating',    value: stats.avgRating,       icon: Star     },
  ]

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-navy-900">Activity Overview</h2>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statItems.map((stat, i) => (
          <Reveal key={stat.label} delay={i * 0.08}>
            <div className="bg-white rounded-2xl border border-navy-100/50 p-5 text-center">
              <stat.icon size={18} className="text-navy-500 mx-auto mb-2" strokeWidth={1.8} />
              <p className="text-2xl font-serif font-bold text-navy-900">{stat.value}</p>
              <p className="text-xs text-navy-400 mt-1">{stat.label}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  )
}

/* ─── Settings Section ─── */
function SettingsSection() {
  const { logout }              = useAuth()
  const navigate                = useNavigate()
  const [form, setForm]         = useState({ current: '', new: '', confirm: '' })
  const [show, setShow]         = useState({ current: false, new: false, confirm: false })
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState('')
  const [saving, setSaving]     = useState(false)

  const toggleShow = (field) => setShow(s => ({ ...s, [field]: !s[field] }))
  const setField   = (field, val) => { setForm(f => ({ ...f, [field]: val })); setError(''); setSuccess('') }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setSuccess('')

    if (!form.current || !form.new || !form.confirm) {
      return setError('All fields are required.')
    }
    if (form.new.length < 8) {
      return setError('New password must be at least 8 characters.')
    }
    if (form.new === form.current) {
      return setError('New password must be different from your current password.')
    }
    if (form.new !== form.confirm) {
      return setError('New password and confirmation do not match.')
    }

    setSaving(true)
    try {
      await apiChangePassword({ currentPassword: form.current, newPassword: form.new })
      setSuccess('Password updated successfully. Signing you out…')
      setForm({ current: '', new: '', confirm: '' })
      setTimeout(async () => {
        await logout()
        navigate('/login')
      }, 1500)
    } catch (err) {
      setError(err?.error?.message || err?.message || 'Failed to update password.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-navy-900">Account Settings</h2>

      {/* Change password */}
      <Reveal>
        <div className="bg-white rounded-2xl border border-navy-100/50 p-6">
          <h3 className="font-semibold text-navy-900 mb-4">Change Password</h3>

          <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
            {/* Current password */}
            {['current', 'new', 'confirm'].map((field) => (
              <div key={field} className="space-y-1">
                <label className="block text-xs font-medium text-navy-600 capitalize">
                  {field === 'current' ? 'Current Password' : field === 'new' ? 'New Password' : 'Confirm New Password'}
                </label>
                <div className="relative">
                  <input
                    type={show[field] ? 'text' : 'password'}
                    value={form[field]}
                    onChange={e => setField(field, e.target.value)}
                    autoComplete={field === 'current' ? 'current-password' : 'new-password'}
                    className="w-full h-10 rounded-xl border border-navy-200 bg-white px-3 pr-10 text-sm text-navy-900 placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => toggleShow(field)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-600 transition-colors"
                    tabIndex={-1}
                  >
                    {show[field] ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <p className="text-[11px] text-amber-600 mt-1 flex items-center gap-1">
                   Changing your password will sign you out immediately.
                </p>
              </div>
            ))}

            {/* Inline same-password hint under New Password */}
            {form.new && form.current && form.new === form.current && (
              <p className="text-xs text-red-500 -mt-2">New password cannot be the same as your current password.</p>
            )}

            {/* Error / success banners */}
            {error && (
              <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
                <X size={15} className="shrink-0 mt-0.5" />
                {error}
              </div>
            )}
            {success && (
              <div className="flex items-start gap-2 rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm text-emerald-700">
                <CheckCircle2 size={15} className="shrink-0 mt-0.5" />
                {success}
              </div>
            )}

            <Button size="sm" type="submit" disabled={saving}>
              {saving ? 'Updating…' : 'Update Password'}
            </Button>
          </form>
        </div>
      </Reveal>

      {/* Notification preferences */}
      <Reveal delay={0.1}>
        <div className="bg-white rounded-2xl border border-navy-100/50 p-6">
          <h3 className="font-semibold text-navy-900 mb-4">Notification Preferences</h3>
          <div className="space-y-3">
            {[
              { label: 'Email notifications for new reviews', checked: true },
              { label: 'Email notifications for feedback received', checked: true },
              { label: 'Email notifications for employment verification updates', checked: false },
              { label: 'Weekly digest of platform activity', checked: false },
            ].map(pref => (
              <label key={pref.label} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  defaultChecked={pref.checked}
                  className="w-4 h-4 rounded border-navy-300 text-navy-600 focus:ring-navy-500/30"
                />
                <span className="text-sm text-navy-600 group-hover:text-navy-800 transition-colors">
                  {pref.label}
                </span>
              </label>
            ))}
          </div>
        </div>
      </Reveal>

      {/* Danger Zone */}
      <Reveal delay={0.15}>
        <div className="bg-white rounded-2xl border border-red-100 p-6">
          <h3 className="font-semibold text-red-700 mb-2">Danger Zone</h3>
          <p className="text-xs text-red-500 mb-4">These actions are irreversible. Please proceed with caution.</p>
          <div className="flex gap-2">
            <button className="h-9 px-4 border border-red-200 text-red-600 text-xs font-medium rounded-lg hover:bg-red-50 transition-colors">
              Deactivate Account
            </button>
            <button className="h-9 px-4 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition-colors">
              Delete Account
            </button>
          </div>
        </div>
      </Reveal>
    </div>
  )
}

