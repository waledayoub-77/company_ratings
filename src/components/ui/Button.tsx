import { type ReactNode, type ButtonHTMLAttributes } from 'react'
import { Link } from 'react-router-dom'

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  href?: string
  children: ReactNode
  icon?: ReactNode
  iconRight?: ReactNode
  loading?: boolean
  fullWidth?: boolean
}

const variantStyles: Record<Variant, string> = {
  primary:
    'bg-navy-900 text-white hover:bg-navy-800 active:bg-navy-950 shadow-sm shadow-navy-900/20',
  secondary:
    'bg-navy-50 text-navy-900 hover:bg-navy-100 active:bg-navy-200',
  outline:
    'border border-navy-200 text-navy-700 hover:bg-navy-50 hover:border-navy-300 active:bg-navy-100',
  ghost:
    'text-navy-700 hover:bg-navy-50 active:bg-navy-100',
  danger:
    'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm shadow-red-600/20',
}

const sizeStyles: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-[13px] rounded-lg gap-1.5',
  md: 'h-11 px-5 text-sm rounded-xl gap-2',
  lg: 'h-[52px] px-7 text-[15px] rounded-xl gap-2.5',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  href,
  children,
  icon,
  iconRight,
  loading,
  fullWidth,
  className = '',
  disabled,
  ...props
}: ButtonProps & { className?: string }) {
  const classes = `
    inline-flex items-center justify-center font-medium 
    transition-all duration-200 select-none
    disabled:opacity-50 disabled:pointer-events-none
    ${variantStyles[variant]}
    ${sizeStyles[size]}
    ${fullWidth ? 'w-full' : ''}
    ${className}
  `.trim()

  if (href) {
    return (
      <Link to={href} className={classes}>
        {icon}
        {children}
        {iconRight}
      </Link>
    )
  }

  return (
    <button className={classes} disabled={disabled || loading} {...props}>
      {loading ? (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : (
        icon
      )}
      {children}
      {iconRight}
    </button>
  )
}
