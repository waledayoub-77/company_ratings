/**
 * Reusable skeleton loading components for consistent loading states.
 * Uses navy color scheme to match the design system.
 */

/* Base shimmer animation — a single pulsing bar */
function SkeletonBox({ className = '' }) {
  return (
    <div className={`animate-pulse rounded-lg bg-navy-100/60 ${className}`} />
  )
}

/* Card skeleton — mimics a company or data card */
export function CardSkeleton({ count = 1 }) {
  return Array.from({ length: count }, (_, i) => (
    <div key={i} className="bg-white rounded-2xl border border-navy-100/50 p-6 space-y-4">
      <div className="flex items-center gap-4">
        <SkeletonBox className="w-12 h-12 rounded-xl" />
        <div className="flex-1 space-y-2">
          <SkeletonBox className="h-4 w-3/5" />
          <SkeletonBox className="h-3 w-2/5" />
        </div>
      </div>
      <SkeletonBox className="h-3 w-full" />
      <SkeletonBox className="h-3 w-4/5" />
      <div className="flex gap-2 pt-2">
        <SkeletonBox className="h-6 w-16 rounded-full" />
        <SkeletonBox className="h-6 w-20 rounded-full" />
      </div>
    </div>
  ))
}

/* Table row skeleton */
export function TableRowSkeleton({ cols = 5, rows = 5 }) {
  return Array.from({ length: rows }, (_, r) => (
    <tr key={r} className="border-t border-navy-100/50">
      {Array.from({ length: cols }, (_, c) => (
        <td key={c} className="px-4 py-3">
          <SkeletonBox className={`h-4 ${c === 0 ? 'w-3/4' : 'w-1/2'}`} />
        </td>
      ))}
    </tr>
  ))
}

/* Stat card skeleton — mimics overview stat boxes */
export function StatSkeleton({ count = 4 }) {
  return Array.from({ length: count }, (_, i) => (
    <div key={i} className="bg-white rounded-2xl border border-navy-100/50 p-5 space-y-3">
      <div className="flex items-center justify-between">
        <SkeletonBox className="h-3 w-24" />
        <SkeletonBox className="h-8 w-8 rounded-lg" />
      </div>
      <SkeletonBox className="h-8 w-20" />
      <SkeletonBox className="h-3 w-32" />
    </div>
  ))
}

/* Full-page centered loading spinner */
export function PageLoader() {
  return (
    <div className="flex items-center justify-center py-32">
      <div className="flex flex-col items-center gap-3">
        <svg className="animate-spin h-8 w-8 text-navy-400" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <p className="text-sm text-navy-400">Loading...</p>
      </div>
    </div>
  )
}

/* Inline empty state */
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-navy-50 flex items-center justify-center mb-4">
          <Icon size={24} className="text-navy-400" strokeWidth={1.5} />
        </div>
      )}
      <h3 className="text-lg font-semibold text-navy-900">{title}</h3>
      {description && <p className="mt-1 text-sm text-navy-500 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export default SkeletonBox
