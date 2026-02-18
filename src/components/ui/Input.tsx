import { type InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className = '', ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-[13px] font-medium text-navy-700">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`
              w-full h-11 rounded-xl border bg-white px-4 text-sm text-navy-900
              placeholder:text-navy-300
              focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500
              transition-all duration-200
              ${icon ? 'pl-10' : ''}
              ${error ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-navy-200'}
              ${className}
            `}
            {...props}
          />
        </div>
        {error && (
          <p className="text-xs text-red-500 mt-1">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
export default Input
