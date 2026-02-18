const variantStyles = {
  default: 'bg-navy-100 text-navy-700',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  danger: 'bg-red-50 text-red-700',
  info: 'bg-ice-500/30 text-navy-700',
}

export default function Badge({ children, variant = 'default', size = 'sm' }) {
  return (
    <span
      className={`
        inline-flex items-center font-medium rounded-full
        ${variantStyles[variant]}
        ${size === 'sm' ? 'px-2.5 py-0.5 text-[11px]' : 'px-3 py-1 text-xs'}
      `}
    >
      {children}
    </span>
  )
}
