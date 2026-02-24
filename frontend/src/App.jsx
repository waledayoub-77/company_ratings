import { Routes, Route, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import Layout from './components/layout/Layout.jsx'
import LandingPage from './pages/LandingPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import CompaniesPage from './pages/CompaniesPage.jsx'
import CompanyProfilePage from './pages/CompanyProfilePage.jsx'
import EmployeeDashboard from './pages/EmployeeDashboard.jsx'
import CompanyAdminDashboard from './pages/CompanyAdminDashboard.jsx'
import AdminPanel from './pages/AdminPanel.jsx'
import WriteReviewPage from './pages/WriteReviewPage.jsx'
import InternalFeedbackPage from './pages/InternalFeedbackPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'

// Redirect already-logged-in users away from auth pages
function GuestRoute({ children }) {
  const { user } = useAuth()
  if (!user) return children
  const redirect = { employee: '/dashboard', company_admin: '/company-admin', system_admin: '/admin' }
  return <Navigate to={redirect[user.role] || '/'} replace />
}

function AppRoutes() {
  return (
    <AnimatePresence mode="wait">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login"    element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

        <Route element={<Layout />}>
          <Route path="/companies"             element={<CompaniesPage />} />
          <Route path="/companies/:id"         element={<CompanyProfilePage />} />
          <Route path="/companies/:id/review"  element={<WriteReviewPage />} />
          <Route path="/dashboard"             element={<EmployeeDashboard />} />
          <Route path="/dashboard/feedback"    element={<InternalFeedbackPage />} />
          <Route path="/company-admin"         element={<CompanyAdminDashboard />} />
          <Route path="/admin"                 element={<AdminPanel />} />
          <Route path="/profile"              element={<ProfilePage />} />
        </Route>
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
