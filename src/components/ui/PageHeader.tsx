import { type ReactNode } from 'react'
import { motion } from 'framer-motion'

interface PageHeaderProps {
  tag?: string
  title: string
  subtitle?: string
  children?: ReactNode
  align?: 'left' | 'center'
}

export default function PageHeader({ tag, title, subtitle, children, align = 'left' }: PageHeaderProps) {
  return (
    <div className={`pt-28 pb-10 ${align === 'center' ? 'text-center' : ''}`}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          {tag && (
            <span className="inline-block text-xs font-semibold uppercase tracking-[0.15em] text-navy-500 mb-3">
              {tag}
            </span>
          )}
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-navy-900 tracking-tight text-balance">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-3 text-navy-500 text-base md:text-lg max-w-2xl leading-relaxed">
              {subtitle}
            </p>
          )}
          {children && <div className="mt-6">{children}</div>}
        </motion.div>
      </div>
    </div>
  )
}
