import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, ArrowLeft, Search } from 'lucide-react'
import Button from '../components/ui/Button'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-ice-50 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md"
      >
        {/* Large 404 */}
        <h1 className="text-8xl font-serif font-bold text-navy-200 select-none">404</h1>

        <h2 className="mt-4 text-2xl font-serif font-bold text-navy-900">
          Page not found
        </h2>

        <p className="mt-3 text-navy-500 text-sm leading-relaxed">
          The page you're looking for doesn't exist or has been moved.
          Let's get you back on track.
        </p>

        {/* Action buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button href="/" icon={<Home size={16} />}>
            Back to Home
          </Button>
          <Button variant="outline" href="/companies" icon={<Search size={16} />}>
            Browse Companies
          </Button>
        </div>

        {/* Go back link */}
        <button
          onClick={() => window.history.back()}
          className="mt-6 inline-flex items-center gap-1.5 text-sm text-navy-400 hover:text-navy-600 transition-colors"
        >
          <ArrowLeft size={14} />
          Go back to previous page
        </button>
      </motion.div>
    </div>
  )
}
