import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MdArrowBack, MdShield } from 'react-icons/md'

interface AuthShellProps {
  step?: number
  totalSteps?: number
  title: string
  subtitle: string
  children: ReactNode
}

export const AuthShell = ({
  step,
  totalSteps = 3,
  title,
  subtitle,
  children
}: AuthShellProps) => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-12 pb-4">
        {step && step > 1 ? (
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <MdArrowBack size={18} />
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-green-500 flex items-center justify-center">
              <span className="text-white font-black text-sm">W</span>
            </div>
            <span className="font-black text-navy-900 text-base">
              Waka<span className="text-green-500">Charge</span>
            </span>
          </div>
        )}

        {/* Step indicator */}
        {step && (
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i + 1 === step ? 20 : 6,
                  height: 6,
                  background: i + 1 <= step ? '#1db954' : '#e2e8f0',
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Progress bar */}
      {step && (
        <div className="h-0.5 bg-slate-100 mx-5 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-green-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(step / totalSteps) * 100}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 px-6 pt-8 pb-8 max-w-sm mx-auto w-full flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex-1"
        >
          {step && (
            <p className="text-xs font-bold uppercase tracking-widest text-green-600 mb-2">
              Step {step} of {totalSteps}
            </p>
          )}
          <h1 className="text-2xl font-black text-navy-900 leading-tight mb-2">
            {title}
          </h1>
          <p className="text-slate-500 text-sm leading-relaxed mb-7">
            {subtitle}
          </p>
          {children}
        </motion.div>
      </div>
    </div>
  )
}

// ─── Shared field wrapper ────────────────────────────────
export const AuthField = ({
  label,
  icon,
  error,
  hint,
  children
}: {
  label: string
  icon: ReactNode
  error?: string
  hint?: string
  children: ReactNode
}) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-sm font-semibold text-navy-700">{label}</label>
    <div className="relative">
      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
        {icon}
      </div>
      <div className="[&>input]:pl-10 [&>select]:pl-10 [&>input]:w-full [&>select]:w-full">
        {children}
      </div>
    </div>
    {error && (
      <p className="text-red-500 text-xs font-medium flex items-center gap-1">
        <span>⚠</span> {error}
      </p>
    )}
    {hint && !error && (
      <p className="text-slate-400 text-xs">{hint}</p>
    )}
  </div>
)

// ─── Shared input class ──────────────────────────────────
export const authInput = (hasError = false) => `
  w-full py-3.5 pr-4 rounded-2xl text-sm font-medium
  border-2 outline-none transition-all duration-150
  text-navy-900 placeholder-slate-300
  ${hasError
    ? 'border-red-400 bg-red-50 focus:border-red-500'
    : 'border-slate-200 bg-slate-50 focus:border-green-500 focus:bg-white'
  }
`

// ─── Shared submit button ────────────────────────────────
export const AuthButton = ({
  children,
  loading = false,
  disabled = false,
  onClick,
  className = '',
  type = 'submit'
}: {
  children: ReactNode
  loading?: boolean
  disabled?: boolean
  onClick?: () => void
  className?: string
  type?: 'submit' | 'button'
}) => (
  <motion.button
    type={type}
    onClick={onClick}
    disabled={loading || disabled}
    whileTap={{ scale: 0.98 }}
    className={`
      w-full py-3.5 rounded-2xl font-black text-sm
      bg-green-500 text-white
      hover:bg-green-400 transition-all
      disabled:opacity-40 disabled:cursor-not-allowed
      flex items-center justify-center gap-2
      ${className}
    `}
  >
    {loading ? (
      <>
        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        <span>Please wait…</span>
      </>
    ) : children}
  </motion.button>
)

// ─── Security note ───────────────────────────────────────
export const SecurityNote = ({ text }: { text: string }) => (
  <div className="flex items-center gap-2 justify-center mt-4">
    <MdShield size={13} className="text-slate-300" />
    <p className="text-xs text-slate-400">{text}</p>
  </div>
)

// ─── Footer link ─────────────────────────────────────────
export const AuthFooter = ({
  text,
  linkText,
  onClick
}: {
  text: string
  linkText: string
  onClick: () => void
}) => (
  <p className="text-sm text-slate-500 text-center mt-6">
    {text}{' '}
    <button
      onClick={onClick}
      className="font-semibold text-green-600 hover:text-green-700 transition-colors"
    >
      {linkText}
    </button>
  </p>
)
