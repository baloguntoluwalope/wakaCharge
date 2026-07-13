import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useQueries } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { paymentsApi } from '../../api/payments.api'
import { rentalsApi } from '../../api/rentals.api'
import { notificationsApi } from '../../api/notifications.api'
import { Badge } from '../../components/ui/Badge'
import { EmptyWallet } from '../../components/student/EmptyWallet'
import { useCountdown } from '../../hooks/useCountdown'
import { greeting, deviceLabel, formatCurrency } from '../../utils'
import { DEVICE_CONFIG, TRUST_LEVELS } from '../../theme/tokens'
import type { Rental } from '../../types'

// ─── Stable React Icons Imports ─────────────────────────────
import { 
  RiNotification3Line, 
  RiQrCodeLine, 
  RiHistoryLine, 
  RiMapPinRangeLine, 
  RiArrowRightLine, 
  RiCheckboxCircleFill,
  RiEyeLine,
  RiEyeOffLine,
  RiBattery2ChargeLine,
  RiArrowRightSLine,
  RiLightbulbLine,    // Added: Lamp representation
  RiSuitcaseLine      // Added: Survival Kit / Bag representation
} from 'react-icons/ri'
import { 
  MdOutlineWarningAmber, 
  MdOutlineAccountBalanceWallet,
  MdTrendingUp,
  MdEventSeat        // Added: Comfort / Cushion representation
} from 'react-icons/md'

// ─── Pro Fintech Curved Shimmer Skeleton ───────────────────
const Shimmer = ({ className = '' }: { className?: string }) => (
  <div className={`relative overflow-hidden bg-slate-100 rounded-[2rem] ${className}`}>
    <motion.div
      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/80 to-transparent"
      initial={{ x: '-100%' }}
      animate={{ x: '100%' }}
      transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
    />
  </div>
)

// Helper mapping for hardware tariff icons based on your custom requirements
const getDeviceIcon = (type: string) => {
  switch (type?.toLowerCase()) {
    case 'lamp': 
      return RiLightbulbLine
    case 'survivalkit': 
    case 'bag':
      return RiSuitcaseLine
    case 'comfort': 
    case 'cushion':
      return MdEventSeat
    default: 
      return RiBattery2ChargeLine
  }
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const justRegistered = (location.state as any)?.justRegistered
  
  const [showBalance, setShowBalance] = useState<boolean>(true)

  const [walletQuery, rentalsQuery, notifQuery] = useQueries({
    queries: [
      {
        queryKey: ['wallet'],
        queryFn: paymentsApi.getWallet,
        staleTime: 1000 * 60 * 2,
      },
      {
        queryKey: ['rentals', 'active'],
        queryFn: () => rentalsApi.getMyRentals({ status: 'active', limit: 3 }),
        staleTime: 1000 * 30,
        refetchInterval: 30000, 
      },
      {
        queryKey: ['notifications'],
        queryFn: notificationsApi.getAll,
        staleTime: 1000 * 60,
      },
    ],
  })

  const wallet = walletQuery.data as any
  const activeRentals = ((rentalsQuery.data as any)?.rentals as Rental[]) || []
  const unread = (notifQuery.data as any)?.unreadCount || 0
  const balance = wallet?.walletBalance || 0
  const trustLevel = user?.trustLevel || 'basic'
  const trustConfig = TRUST_LEVELS[trustLevel as keyof typeof TRUST_LEVELS]
  const score = user?.trustScore || 0
  const nextThreshold = trustConfig?.threshold || 10
  const progress = Math.min(100, (score / (nextThreshold || 31)) * 100)

  return (
    <div className="bg-slate-50 min-h-svh antialiased text-slate-900 pb-16 selection:bg-green-100">
      
      {/* ── Curved Dynamic Top Nav Bar ────────────────────────── */}
      <div className="bg-white/90 backdrop-blur-md px-5 pt-12 pb-5 border-b border-slate-100 sticky top-0 z-40 rounded-b-[2rem] shadow-sm shadow-slate-100/40">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => navigate('/profile')}
              className="w-11 h-11 rounded-full bg-green-500 flex items-center justify-center text-slate-950 font-black text-sm border-2 border-white shadow-md ring-1 ring-slate-200/50 hover:bg-green-400 transition-colors"
            >
              {user?.name?.charAt(0) || 'W'}
            </motion.button>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 leading-none">
                {greeting()}
              </p>
              <h1 className="text-base font-black text-slate-900 tracking-tight mt-1 flex items-center gap-1">
                {user?.name || 'Waka User'}
                <RiCheckboxCircleFill size={15} className="text-green-600" />
              </h1>
            </div>
          </div>
          
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => navigate('/notifications')}
            className="relative w-10 h-10 rounded-full bg-slate-50 border border-slate-200/60 flex items-center justify-center hover:bg-slate-100 text-slate-700 transition-all shadow-inner"
          >
            <RiNotification3Line size={18} />
            {unread > 0 && (
              <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center border-2 border-white animate-pulse">
                {unread > 9 ? '9' : unread}
              </span>
            )}
          </motion.button>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-5 flex flex-col gap-4">
        
        {/* ── Fluid Notification Banner ──────────────────────── */}
        {justRegistered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-[2rem] p-5 bg-gradient-to-br from-green-600 to-green-700 shadow-lg shadow-green-600/10 relative overflow-hidden"
          >
            <div className="absolute right-[-10%] top-[-20%] w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="relative z-10">
              <p className="text-white font-black text-sm">Account Activation Successful ⚡</p>
              <p className="text-white/80 text-xs mt-1 font-medium leading-relaxed">
                Your Nomba virtual clearing account is live. Securely fund your personal wallet ledger below.
              </p>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => navigate('/wallet/fund')}
                className="flex items-center gap-1 px-4 py-2 mt-3 rounded-xl bg-white text-green-700 text-xs font-bold hover:bg-slate-50 transition-colors shadow-md"
              >
                Deposit Funds
                <RiArrowRightLine size={14} />
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* ── Premium Curved Wallet Deck ── */}
        <div className="bg-white rounded-[2rem] border border-slate-200/80 shadow-md shadow-slate-100 p-5 relative overflow-hidden ring-1 ring-black/[0.02]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5 text-slate-500">
              <div className="w-6 h-6 rounded-lg bg-green-50 flex items-center justify-center">
                <MdOutlineAccountBalanceWallet size={15} className="text-green-600" />
              </div>
              <span className="text-xs font-bold tracking-tight text-slate-400">Available Balance</span>
              <button 
                onClick={() => setShowBalance(!showBalance)}
                className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showBalance ? <RiEyeOffLine size={15} /> : <RiEyeLine size={15} />}
              </button>
            </div>
            <span className="text-[9px] font-black tracking-wider uppercase text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100">
              Tier 1 Student
            </span>
          </div>
          
          {walletQuery.isPending ? (
            <Shimmer className="h-28" />
          ) : balance === 0 ? (
            <EmptyWallet
              virtualAccountNumber={wallet?.virtualAccount?.accountNumber}
              virtualAccountBank={wallet?.virtualAccount?.bankName}
              userName={user?.name}
            />
          ) : (
            <div>
              <div className="mb-5 pl-1">
                <span className="text-3xl font-black tracking-tight text-slate-900">
                  {showBalance ? formatCurrency(balance) : "••••••"}
                </span>
              </div>
              <div className="flex gap-2.5">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate('/wallet/fund')}
                  className="flex-1 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-black text-xs transition-colors shadow-md shadow-green-600/10 text-center"
                >
                  Add Money
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate('/transactions')}
                  className="flex-1 py-3 rounded-xl bg-slate-50 border border-slate-200/80 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-all text-center"
                >
                  History 
                </motion.button>
              </div>
            </div>
          )}
        </div>

        {/* ── Active Rentals Queue ────────────────── */}
        {rentalsQuery.isPending ? (
          <Shimmer className="h-32" />
        ) : activeRentals.length > 0 ? (
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between px-1.5">
              <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                Active Operations ({activeRentals.length})
              </h2>
              <button
                onClick={() => navigate('/rentals')}
                className="flex items-center text-xs font-bold text-green-600 hover:text-green-700"
              >
                See All
                <RiArrowRightSLine size={16} />
              </button>
            </div>
            {activeRentals.map(rental => (
              <ActiveRentalCard
                key={rental._id}
                rental={rental}
                onManage={() => navigate(`/rentals?id=${rental._id}`)}
              />
            ))}
          </div>
        ) : null}

        {/* ── OPay Rounded Service Matrix ─────────────────── */}
        <div className="bg-white rounded-[2rem] border border-slate-200/80 shadow-md shadow-slate-100/60 p-5">
          <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-4 pl-0.5">
            Quick Services
          </h2>
          <div className="grid grid-cols-4 gap-2">
            {[
              { icon: RiMapPinRangeLine, label: 'Stations', path: '/stations', color: 'text-green-600', bg: 'bg-green-50' },
              { icon: RiQrCodeLine, label: 'Scan QR', path: '/scan', color: 'text-blue-600', bg: 'bg-blue-50' },
              { icon: RiBattery2ChargeLine, label: 'Rentals', path: '/rentals', color: 'text-purple-600', bg: 'bg-purple-50' },
              { icon: RiHistoryLine, label: 'History', path: '/transactions', color: 'text-amber-600', bg: 'bg-amber-50' },
            ].map((a, idx) => {
              const ActionIcon = a.icon
              return (
                <button
                  key={idx}
                  onClick={() => navigate(a.path)}
                  className="flex flex-col items-center gap-2 py-1 group"
                >
                  <div className={`w-13 h-13 rounded-2xl ${a.bg} ${a.color} flex items-center justify-center shadow-sm transition-all group-active:scale-90 group-hover:shadow-md group-hover:-translate-y-0.5`}>
                    <ActionIcon size={22} />
                  </div>
                  <span className="text-xs font-bold text-slate-600 tracking-tight text-center">
                    {a.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Trust Credit Hub ──────────────────── */}
        <div
          onClick={() => navigate('/trust')}
          className="bg-white rounded-[2rem] border border-slate-200/80 p-5 shadow-md shadow-slate-100/60 hover:border-slate-300 cursor-pointer transition-all flex items-center justify-between group"
        >
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="p-1 rounded-lg bg-amber-50 border border-amber-100 text-amber-500 flex items-center justify-center">
                <MdTrendingUp size={16} />
              </span>
              <p className="text-xs font-bold tracking-tight text-slate-400">Waka Trust Overdraft Profile</p>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 tracking-tight">{score}</span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-50 border border-slate-200/60" style={{ color: trustConfig?.color }}>
                {trustConfig?.label || 'Verified Tier'}
              </span>
            </div>
            
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden mt-3 max-w-[85%] border border-slate-200/10 shadow-inner">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #1db954, #34d572)' }}
              />
            </div>
          </div>
          
          <div className="text-right flex flex-col items-end gap-2">
            {user?.rnplEnabled ? (
              <Badge variant="amber" dot size="sm">RNPL Active</Badge>
            ) : (
              <span className="text-[10px] font-black tracking-wide text-green-600 bg-green-50 border border-green-100 px-2.5 py-1 rounded-full">
                +{Math.max(0, 10 - score)} Overdraft
              </span>
            )}
            <RiArrowRightSLine size={18} className="text-slate-400 mt-0.5 transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>

        {/* ── Curved Terminal Grid ─────────────────── */}
        <div>
          <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3 px-1.5">
            Hardware Tariffs
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(DEVICE_CONFIG).map(([type, config]) => {
              const DeviceUtilityIcon = getDeviceIcon(type)
              return (
                <div
                  key={type}
                  onClick={() => navigate('/stations')}
                  className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-sm relative overflow-hidden cursor-pointer hover:border-slate-300 hover:shadow-md transition-all group"
                >
                  <div
                    className="absolute top-0 right-0 w-16 h-16 rounded-full opacity-[0.05] transition-transform duration-500 group-hover:scale-125"
                    style={{ background: config.color, transform: 'translate(15%, -15%)' }}
                  />
                  <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 mb-3 group-hover:-translate-y-0.5 transition-transform">
                    <DeviceUtilityIcon size={18} style={{ color: config.color }} />
                  </div>
                  <p className="font-black text-slate-800 text-xs tracking-tight">{config.label}</p>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-base font-black" style={{ color: config.color }}>
                      ₦{config.price}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400">
                      +₦{config.deposit} dep
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

      
        <div
          onClick={() => navigate('/roadmap')}
          className="rounded-[2rem] p-5 cursor-pointer bg-slate-900 relative overflow-hidden shadow-lg hover:shadow-xl transition-all group"
        >
          <div className="flex items-center justify-between relative z-10">
            <div>
              <span className="text-[9px] font-black uppercase tracking-widest text-green-400 bg-green-500/10 px-2.5 py-1 rounded-full border border-green-500/20">
                Roadmap
              </span>
              <p className="text-white font-black text-sm tracking-tight mt-2.5">
                Savings · Marketplace · Transport
              </p>
            </div>
            <RiArrowRightSLine size={20} className="text-white/40 transition-transform group-hover:translate-x-0.5" />
          </div>
          <div className="absolute right-[-5%] bottom-[-10%] w-24 h-24 bg-gradient-to-tr from-green-500/20 to-transparent rounded-full blur-xl pointer-events-none" />
        </div>
      </div>
    </div>
  )
}

// ─── Styled Active Rental Component Module ───────────────────
const ActiveRentalCard = ({
  rental,
  onManage,
}: {
  rental: Rental
  onManage: () => void
}) => {
  const { timeLeft, isOverdue } = useCountdown(rental.expectedReturnTime)

  const urgencyLevel = isOverdue
    ? 'overdue'
    : (() => {
        const diff = new Date(rental.expectedReturnTime).getTime() - Date.now()
        return diff / 60000 < 30 ? 'urgent' : 'normal'
      })()

  const colors = {
    overdue: { border: 'border-red-200', bar: 'bg-red-500', btn: 'bg-red-500 hover:bg-red-600 text-white', text: 'text-red-500' },
    urgent:  { border: 'border-amber-200', bar: 'bg-amber-500', btn: 'bg-amber-500 hover:bg-amber-600 text-white', text: 'text-amber-600' },
    normal:  { border: 'border-green-200', bar: 'bg-green-600', btn: 'bg-green-600 hover:bg-green-700 text-white', text: 'text-green-600' },
  }[urgencyLevel]

  const DeviceDynamicIcon = getDeviceIcon(rental.deviceType)

  return (
    <div className={`rounded-[2rem] border bg-white shadow-sm overflow-hidden ${colors.border} ring-1 ring-black/[0.01]`}>
      <div className={`${colors.bar} px-4 py-1.5 flex items-center justify-between`}>
        <span className="text-white text-[9px] font-black uppercase tracking-wider">
          {urgencyLevel === 'overdue' ? 'Liability Overdue' : urgencyLevel === 'urgent' ? 'Expiring Soon' : 'Active Operation'}
        </span>
        <span className="text-white text-[10px] font-black opacity-90">
          Locker {rental.lockerAssigned || 'N/A'}
        </span>
      </div>

      <div className="p-4 bg-slate-50/20">
        <div className="flex items-center gap-3.5 mb-4">
          <div className="w-11 h-11 rounded-xl bg-white border border-slate-200/60 flex items-center justify-center text-slate-700 flex-shrink-0 shadow-xs">
            <DeviceDynamicIcon size={20} />
          </div>
          <div className="flex-1">
            <h4 className="font-black text-slate-900 text-xs">
              {deviceLabel(rental.deviceType)}
            </h4>
            <p className={`text-base font-black tracking-tight mt-0.5 ${colors.text}`}>
              {timeLeft}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl px-4 py-3 mb-4 border border-slate-200/50 flex items-center justify-between shadow-inner">
          <div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
              Clearance Token
            </span>
            <span className="font-mono font-black text-lg text-slate-800 tracking-wider block mt-0.5">
              {rental.confirmationCode}
            </span>
          </div>
          <span className="text-[10px] font-bold text-slate-400 bg-slate-50 border border-slate-100 px-2 py-1 rounded-md">
            Deposit: {formatCurrency(rental.depositAmount)}
          </span>
        </div>

        <div className="flex gap-2">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onManage}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl font-black text-xs transition-colors shadow-sm ${colors.btn}`}
          >
            Terminate & Return
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onManage}
            className="px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors shadow-sm"
          >
            Details
          </motion.button>
        </div>

        {urgencyLevel === 'overdue' && (
          <div className="mt-3 bg-red-50 border border-red-100/60 rounded-xl p-3 flex items-start gap-2 animate-pulse">
            <MdOutlineWarningAmber size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-red-600 text-[11px] leading-tight font-semibold">
              Daily compounding penalties active. Terminate session immediately.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}