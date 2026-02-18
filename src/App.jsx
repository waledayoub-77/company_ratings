import { Routes, Route } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
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

export default function App() {
  return (
    <AnimatePresence mode="wait">
      <Routes>
        {/* Public routes - no navbar on landing */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Routes with layout */}
        <Route element={<Layout />}>
          <Route path="/companies" element={<CompaniesPage />} />
          <Route path="/companies/:id" element={<CompanyProfilePage />} />
          <Route path="/companies/:id/review" element={<WriteReviewPage />} />
          <Route path="/dashboard" element={<EmployeeDashboard />} />
          <Route path="/dashboard/feedback" element={<InternalFeedbackPage />} />
          <Route path="/company-admin" element={<CompanyAdminDashboard />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Routes>
    </AnimatePresence>
  )
}
