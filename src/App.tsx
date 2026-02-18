import { Routes, Route } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Layout from './components/layout/Layout.tsx'
import LandingPage from './pages/LandingPage.tsx'
import LoginPage from './pages/LoginPage.tsx'
import RegisterPage from './pages/RegisterPage.tsx'
import CompaniesPage from './pages/CompaniesPage.tsx'
import CompanyProfilePage from './pages/CompanyProfilePage.tsx'
import EmployeeDashboard from './pages/EmployeeDashboard.tsx'
import CompanyAdminDashboard from './pages/CompanyAdminDashboard.tsx'
import AdminPanel from './pages/AdminPanel.tsx'
import WriteReviewPage from './pages/WriteReviewPage.tsx'
import InternalFeedbackPage from './pages/InternalFeedbackPage.tsx'
import ProfilePage from './pages/ProfilePage.tsx'

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
