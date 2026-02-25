import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import { ToastProvider, useToast } from './context/ToastContext.jsx'
import { SESSION_EXPIRED_EVENT } from './api/client.js'
import Layout from './components/layout/Layout.jsx'
import LandingPage from './pages/LandingPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import VerifyEmailPage from './pages/VerifyEmailPage.jsx'
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx'
import ResetPasswordPage from './pages/ResetPasswordPage.jsx'
import CompaniesPage from './pages/CompaniesPage.jsx'
import CompanyProfilePage from './pages/CompanyProfilePage.jsx'
import EmployeeDashboard from './pages/EmployeeDashboard.jsx'
import CompanyAdminDashboard from './pages/CompanyAdminDashboard.jsx'
import AdminPanel from './pages/AdminPanel.jsx'
import WriteReviewPage from './pages/WriteReviewPage.jsx'
import InternalFeedbackPage from './pages/InternalFeedbackPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'

const ROLE_HOME = { employee: '/dashboard', company_admin: '/company-admin', system_admin: '/admin' }

// Redirect already-logged-in users away from auth pages
function GuestRoute({ children }) {
  const { user } = useAuth()
  if (!user) return children
  return <Navigate to={ROLE_HOME[user.role] || '/'} replace />
}

// Require any authenticated user — redirects to /login if not logged in
function ProtectedRoute({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return children
}

// Require a specific role — redirects to their home if wrong role
function RoleRoute({ role, children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== role) return <Navigate to={ROLE_HOME[user.role] || '/'} replace />
  return children
}

function AppRoutes() {
  return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login"                element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register"             element={<GuestRoute><RegisterPage /></GuestRoute>} />
        <Route path="/verify-email/:token"  element={<GuestRoute><VerifyEmailPage /></GuestRoute>} />
        <Route path="/forgot-password"      element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
        <Route path="/reset-password/:token" element={<GuestRoute><ResetPasswordPage /></GuestRoute>} />

        <Route element={<Layout />}>
          {/* Public */}
          <Route path="/companies"    element={<CompaniesPage />} />
          <Route path="/companies/:id" element={<CompanyProfilePage />} />

          {/* Any authenticated user */}
          <Route path="/companies/:id/review" element={<ProtectedRoute><WriteReviewPage /></ProtectedRoute>} />
          <Route path="/profile"              element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

          {/* Role-specific */}
          <Route path="/dashboard"           element={<RoleRoute role="employee"><EmployeeDashboard /></RoleRoute>} />
          <Route path="/dashboard/feedback"  element={<RoleRoute role="employee"><InternalFeedbackPage /></RoleRoute>} />
          <Route path="/company-admin"       element={<RoleRoute role="company_admin"><CompanyAdminDashboard /></RoleRoute>} />
          <Route path="/admin"               element={<RoleRoute role="system_admin"><AdminPanel /></RoleRoute>} />
        </Route>

        {/* 404 catch-all */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
  )
}

// Listen for session-expired events from the API client and show a toast
function SessionExpiredListener() {
  const toast = useToast()
  useEffect(() => {
    const handler = () => toast.error('Your session has expired. Please sign in again.')
    window.addEventListener(SESSION_EXPIRED_EVENT, handler)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handler)
  }, [toast])
  return null
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <SessionExpiredListener />
        <AppRoutes />
      </ToastProvider>
    </AuthProvider>
  )
}
