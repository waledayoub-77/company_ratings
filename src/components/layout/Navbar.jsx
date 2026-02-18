import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Menu,
  X,
  ChevronDown,
  User,
  LayoutDashboard,
  Building2,
  LogOut,
  MessageSquare,
  Shield,
  Bell,
} from 'lucide-react'

const navLinks = [
  { label: 'Companies', href: '/companies' },
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Feedback', href: '/dashboard/feedback' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
    setProfileOpen(false)
  }, [location])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-md shadow-[0_1px_0_0_rgba(15,40,84,0.06)]'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-[72px]">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-lg bg-navy-900 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
              <span className="text-white font-serif font-bold text-lg leading-none">R</span>
            </div>
            <span className="text-navy-900 font-semibold text-lg tracking-tight hidden sm:block">
              Rate<span className="text-navy-500">Hub</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.href
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`relative px-4 py-2 text-[14px] font-medium rounded-lg transition-colors duration-200 ${
                    isActive
                      ? 'text-navy-900'
                      : 'text-navy-600 hover:text-navy-900'
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <motion.div
                      layoutId="navIndicator"
                      className="absolute bottom-0 left-3 right-3 h-[2px] bg-navy-500 rounded-full"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Notification bell */}
            <button className="hidden md:flex relative w-10 h-10 items-center justify-center rounded-xl text-navy-600 hover:bg-navy-50 hover:text-navy-900 transition-colors">
              <Bell size={18} strokeWidth={1.8} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            {/* Profile dropdown */}
            <div className="relative hidden md:block">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl hover:bg-navy-50 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-navy-500 to-navy-700 flex items-center justify-center">
                  <span className="text-white text-xs font-semibold">JD</span>
                </div>
                <span className="text-sm font-medium text-navy-800">John D.</span>
                <ChevronDown
                  size={14}
                  className={`text-navy-400 transition-transform duration-200 ${
                    profileOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg shadow-navy-900/8 border border-navy-100/60 py-1.5 overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-navy-100/60">
                      <p className="text-sm font-semibold text-navy-900">John Doe</p>
                      <p className="text-xs text-navy-500 mt-0.5">john@company.com</p>
                    </div>
                    <div className="py-1">
                      <DropdownLink icon={User} label="My Profile" href="/profile" />
                      <DropdownLink icon={LayoutDashboard} label="Dashboard" href="/dashboard" />
                      <DropdownLink icon={MessageSquare} label="Feedback" href="/dashboard/feedback" />
                      <DropdownLink icon={Building2} label="Company Admin" href="/company-admin" />
                      <DropdownLink icon={Shield} label="System Admin" href="/admin" />
                    </div>
                    <div className="border-t border-navy-100/60 pt-1">
                      <button className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                        <LogOut size={16} strokeWidth={1.8} />
                        Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl text-navy-700 hover:bg-navy-50 transition-colors"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="md:hidden overflow-hidden bg-white border-t border-navy-100/40"
          >
            <div className="px-6 py-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`block px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    location.pathname === link.href
                      ? 'bg-navy-50 text-navy-900'
                      : 'text-navy-600 hover:bg-navy-50'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-2 border-t border-navy-100/40 mt-2">
                <Link to="/profile" className="block px-4 py-3 rounded-xl text-sm font-medium text-navy-600 hover:bg-navy-50">
                  My Profile
                </Link>
                <Link to="/company-admin" className="block px-4 py-3 rounded-xl text-sm font-medium text-navy-600 hover:bg-navy-50">
                  Company Admin
                </Link>
                <Link to="/admin" className="block px-4 py-3 rounded-xl text-sm font-medium text-navy-600 hover:bg-navy-50">
                  System Admin
                </Link>
                <button className="block w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50">
                  Sign Out
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

function DropdownLink({ icon: Icon, label, href }) {
  return (
    <Link
      to={href}
      className="flex items-center gap-3 px-4 py-2.5 text-sm text-navy-700 hover:bg-navy-50 transition-colors"
    >
      <Icon size={16} strokeWidth={1.8} className="text-navy-400" />
      {label}
    </Link>
  )
}
