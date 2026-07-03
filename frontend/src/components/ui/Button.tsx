import { forwardRef } from 'react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { motion } from 'framer-motion'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'amber' | 'outline'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: ReactNode
  iconPosition?: 'left' | 'right'
  fullWidth?: boolean
}

const variants: Record<Variant, string> = {
  primary:   'bg-green-500 text-navy-950 hover:bg-green-400 active:bg-green-600 shadow-glow-green',
  secondary: 'bg-navy-100 text-navy-800 hover:bg-navy-200 border border-navy-200',
  ghost:     'bg-transparent text-green-500 hover:bg-green-50',
  danger:    'bg-red-500 text-white hover:bg-red-600',
  amber:     'bg-amber-500 text-navy-950 hover:bg-amber-400',
  outline:   'bg-transparent border border-navy-300 text-navy-700 hover:bg-navy-50',
}

const sizes: Record<Size, string> = {
  sm: 'px-3 py-2 text-sm rounded-xl',
  md: 'px-5 py-3.5 text-sm rounded-2xl',
  lg: 'px-6 py-4 text-base rounded-2xl',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  className = '',
  children,
  disabled,
  ...props
}, ref) => {
  return (
    <motion.button
      ref={ref}
      whileTap={{ scale: 0.97 }}
      whileHover={{ scale: 1.01 }}
      className={`
        inline-flex items-center justify-center gap-2
        font-semibold transition-all duration-150
        disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      disabled={disabled || loading}
      {...props as any}
    >
      {loading ? (
        <LoadingSpinner size="sm" />
      ) : (
        <>
          {icon && iconPosition === 'left' && <span>{icon}</span>}
          {children}
          {icon && iconPosition === 'right' && <span>{icon}</span>}
        </>
      )}
    </motion.button>
  )
})

Button.displayName = 'Button'

// ─── Loading Spinner ─────────────────────────────────────
interface SpinnerProps { size?: 'sm' | 'md' | 'lg'; className?: string }

export const LoadingSpinner = ({ size = 'md', className = '' }: SpinnerProps) => {
  const s = { sm: 14, md: 20, lg: 28 }[size]
  return (
    <svg
      className={`animate-spin ${className}`}
      width={s} height={s}
      viewBox="0 0 24 24" fill="none"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.2" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}