import type { HTMLAttributes, ReactNode } from 'react'
import { motion } from 'framer-motion'
import { FaEye, FaEyeSlash } from 'react-icons/fa6'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean
  children: ReactNode
  padding?: 'none' | 'sm' | 'md' | 'lg'
  border?: boolean
}

const paddings = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5 md:p-6',
}

export const Card = ({
  hoverable = false,
  children,
  padding = 'md',
  border = true,
  className = '',
  onClick,
  ...props
}: CardProps) => {
  const base = `
    bg-white rounded-3xl
    ${border ? 'border border-slate-100' : ''}
    ${paddings[padding]}
    ${hoverable || onClick ? 'cursor-pointer' : ''}
    ${className}
  `

  if (hoverable || onClick) {
    return (
      <motion.div
        className={base}
        whileHover={{ scale: 1.01, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
        whileTap={{ scale: 0.99 }}
        onClick={onClick}
        {...props as any}
      >
        {children}
      </motion.div>
    )
  }

  return (
    <div className={base} onClick={onClick} {...props}>
      {children}
    </div>
  )
}

// ─── Wallet Card ─────────────────────────────────────────
interface WalletCardProps {
  balance: number
  accountNumber?: string
  bankName?: string
  accountName?: string
  onFund?: () => void
  onView?: () => void
  loading?: boolean
  maskedBalance?: boolean
  onToggleMask?: () => void
}

export const WalletCard = ({
  balance,
  accountNumber,
  bankName,
  accountName,
  onFund,
  onView,
  loading,
  maskedBalance = false,
  onToggleMask
}: WalletCardProps) => {
  return (
    <div className="relative rounded-3xl overflow-hidden" style={{
      background: 'linear-gradient(135deg, #0b1420 0%, #1a2f45 50%, #0f2318 100%)'
    }}>
      {/* Decorative orbs */}
      <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-10"
        style={{ background: 'radial-gradient(circle, #1db954, transparent)', transform: 'translate(30%, -30%)' }} />
      <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full opacity-10"
        style={{ background: 'radial-gradient(circle, #0ea5e9, transparent)', transform: 'translate(-30%, 30%)' }} />

      <div className="relative p-6 text-white">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-xs uppercase tracking-widest text-white/50 font-semibold mb-1">
              Waka Wallet
            </p>
            {loading ? (
              <div className="charge-bar h-8 w-32 rounded-xl" />
            ) : (
              <div className="flex items-center gap-2.5">
                <p className="text-4xl font-black tracking-tight tabular-nums">
                  {maskedBalance
                    ? '₦ ••••••'
                    : `₦${balance?.toLocaleString('en-NG') || '0'}`}
                </p>
                {onToggleMask && (
                  <button
                    onClick={onToggleMask}
                    className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-colors flex-shrink-0"
                    aria-label={maskedBalance ? 'Show balance' : 'Hide balance'}
                  >
                    {maskedBalance
                      ? <FaEyeSlash className="text-xs" />
                      : <FaEye className="text-xs" />}
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5 bg-green-500/20 px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse-slow" />
            <span className="text-green-400 text-xs font-semibold">Active</span>
          </div>
        </div>

        {accountNumber && (
          <div className="mb-6 p-3 rounded-2xl bg-white/5 border border-white/10">
            <p className="text-xs text-white/40 mb-1">{bankName || 'Nomba'}</p>
            <p className="font-mono text-lg font-bold tracking-widest text-white">
              {maskedBalance ? '•••• •••• ' + accountNumber.slice(-4) : accountNumber}
            </p>
            <p className="text-xs text-white/50 mt-0.5">{accountName}</p>
          </div>
        )}

        <div className="flex gap-3">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onFund}
            className="flex-1 bg-green-500 text-navy-950 font-bold py-3 rounded-2xl text-sm hover:bg-green-400 transition-colors"
          >
            + Fund wallet
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onView}
            className="flex-1 bg-white/10 text-white font-semibold py-3 rounded-2xl text-sm hover:bg-white/15 transition-colors border border-white/10"
          >
            History
          </motion.button>
        </div>
      </div>
    </div>
  )
}

// ─── Stats Card ───────────────────────────────────────────
interface StatsCardProps {
  label: string
  value: string | number
  icon: ReactNode
  color?: string
  change?: string
}

export const StatsCard = ({ label, value, icon, color = '#1db954', change }: StatsCardProps) => (
  <Card className="flex flex-col gap-3">
    <div className="flex items-center justify-between">
      <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
        style={{ background: `${color}15` }}>
        <span className="text-lg">{icon}</span>
      </div>
      {change && (
        <span className="text-xs font-semibold text-green-500 bg-green-50 px-2 py-0.5 rounded-full">
          {change}
        </span>
      )}
    </div>
    <div>
      <p className="text-2xl font-black text-navy-900">{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </div>
  </Card>
)

// ─── Skeleton ─────────────────────────────────────────────
export const Skeleton = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse bg-slate-200 rounded-2xl ${className}`} />
)