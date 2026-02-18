import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User,
  Mail,
  MapPin,
  Briefcase,
  Calendar,
  Building2,
  Edit3,
  Camera,
  Save,
  X,
  Shield,
  Star,
  FileText,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react'
import PageHeader from '../components/ui/PageHeader.jsx'
import Badge from '../components/ui/Badge.jsx'
import Reveal from '../components/ui/Reveal.jsx'
import Button from '../components/ui/Button.jsx'
import Input from '../components/ui/Input.jsx'

/* ─── Mock profile data ─── */
const profile = {
  name: 'Jane Cooper',
  email: 'jane.cooper@email.com',
  phone: '+1 (555) 012-3456',
  location: 'San Francisco, CA',
  title: 'Senior Product Designer',
  bio: 'Passionate about creating meaningful user experiences. 8+ years in product design across fintech and SaaS companies.',
  joined: '2024-03-15',
  avatar: null,
}

const employmentHistory = [
  {
    company: 'Stripe',
    role: 'Senior Product Designer',
    period: 'Mar 2023 — Present',
    verified: true,
  },
  {
    company: 'Notion',
    role: 'Product Designer',
    period: 'Jul 2021 — Feb 2023',
    verified: true,
  },
  {
    company: 'Figma',
    role: 'Junior Designer',
    period: 'Jan 2019 — Jun 2021',
    verified: false,
  },
]

const activityStats = {
  totalReviews: 5,
  feedbackGiven: 8,
  feedbackReceived: 12,
  avgRating: 4.2,
}

export default function ProfilePage() {
  const [editing, setEditing] = useState(false)
  const [activeSection, setActiveSection] = useState('profile')
  const [form, setForm] = useState(profile)

  const sections = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'employment', label: 'Employment', icon: Briefcase },
    { id: 'activity', label: 'Activity', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Shield },
  ]

  return (
    <div className="min-h-screen bg-ice-50">
      <PageHeader
        tag="My Account"
        title="Profile"
        subtitle="Manage your personal information, employment history, and account settings."
      />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 pb-20">
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
                        {form.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg bg-white border border-navy-200 shadow-sm flex items-center justify-center hover:bg-navy-50 transition-colors">
                      <Camera size={13} className="text-navy-600" />
                    </button>
                  </div>
                  <h3 className="font-semibold text-navy-900">{form.name}</h3>
                  <p className="text-xs text-navy-400 mt-0.5">{form.title}</p>
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
                  <EmploymentSection />
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
                  <ActivitySection />
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
  )
}

/* ─── Profile Section ─── */
function ProfileSection({ form, setForm, editing, setEditing }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-navy-900">Personal Information</h2>
        <button
          onClick={() => setEditing(!editing)}
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

      <div className="bg-white rounded-2xl border border-navy-100/50 p-6">
        {editing ? (
          <div className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-5">
              <Input
                label="Full Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <Input
                label="Email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              <Input
                label="Phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
              <Input
                label="Location"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </div>
            <Input
              label="Job Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1.5">Bio</label>
              <textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                rows={3}
                className="w-full rounded-xl border border-navy-200 bg-white px-4 py-3 text-sm placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 transition-all resize-none"
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setEditing(false)} size="sm">
                <Save size={14} className="mr-1.5" />
                Save Changes
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-y-5 gap-x-8">
              <InfoRow icon={User} label="Full Name" value={form.name} />
              <InfoRow icon={Mail} label="Email" value={form.email} />
              <InfoRow icon={MapPin} label="Location" value={form.location} />
              <InfoRow icon={Briefcase} label="Title" value={form.title} />
              <InfoRow icon={Calendar} label="Member Since" value={new Date(form.joined).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} />
            </div>
            <div className="pt-4 border-t border-navy-50">
              <p className="text-xs font-medium text-navy-400 mb-1">Bio</p>
              <p className="text-sm text-navy-600 leading-relaxed">{form.bio}</p>
            </div>
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
function EmploymentSection() {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-navy-900">Employment History</h2>

      <div className="relative pl-8">
        {/* Vertical line */}
        <div className="absolute left-[13px] top-3 bottom-3 w-[2px] bg-navy-100" />

        {employmentHistory.map((job, i) => (
          <Reveal key={i} delay={i * 0.1}>
            <div className="relative mb-6 last:mb-0">
              {/* Dot */}
              <div className={`absolute -left-8 top-5 w-[10px] h-[10px] rounded-full border-2 ${
                job.verified ? 'bg-emerald-500 border-emerald-300' : 'bg-white border-navy-300'
              }`} />

              <div className="bg-white rounded-2xl border border-navy-100/50 p-6 hover:border-navy-200 transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-navy-50 flex items-center justify-center">
                      <Building2 size={18} className="text-navy-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-navy-900">{job.company}</h3>
                      <p className="text-sm text-navy-500">{job.role}</p>
                      <p className="text-xs text-navy-400 mt-0.5">{job.period}</p>
                    </div>
                  </div>
                  {job.verified ? (
                    <Badge variant="success">
                      <CheckCircle2 size={12} className="mr-1" /> Verified
                    </Badge>
                  ) : (
                    <Badge variant="warning">Pending</Badge>
                  )}
                </div>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  )
}

/* ─── Activity Section ─── */
function ActivitySection() {
  const stats = [
    { label: 'Reviews Written', value: activityStats.totalReviews, icon: FileText },
    { label: 'Feedback Given', value: activityStats.feedbackGiven, icon: Star },
    { label: 'Feedback Received', value: activityStats.feedbackReceived, icon: Star },
    { label: 'Average Rating', value: activityStats.avgRating, icon: Star },
  ]

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-navy-900">Activity Overview</h2>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
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
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' })

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-navy-900">Account Settings</h2>

      {/* Change password */}
      <Reveal>
        <div className="bg-white rounded-2xl border border-navy-100/50 p-6">
          <h3 className="font-semibold text-navy-900 mb-4">Change Password</h3>
          <div className="space-y-4 max-w-md">
            <Input
              label="Current Password"
              type="password"
              value={passwordForm.current}
              onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
            />
            <Input
              label="New Password"
              type="password"
              value={passwordForm.new}
              onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
            />
            <Input
              label="Confirm New Password"
              type="password"
              value={passwordForm.confirm}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
            />
            <Button size="sm">Update Password</Button>
          </div>
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
        <div className="bg-white rounded-2xl border border-red-100  p-6">
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
