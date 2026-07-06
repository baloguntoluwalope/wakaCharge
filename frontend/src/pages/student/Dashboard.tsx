import { useNavigate, useLocation } from 'react-router-dom'
import { useQueries } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { paymentsApi } from '../../api/payments.api'
import { rentalsApi } from '../../api/rentals.api'
import { notificationsApi } from '../../api/notifications.api'
import { WalletCard, Card } from '../../components/ui/Card'
import { Badge, StatusPill } from '../../components/ui/Badge'
import { EmptyWallet } from '../../components/student/EmptyWallet'
import { useCountdown } from '../../hooks/useCountdown'
import { greeting, formatCurrency, deviceEmoji, deviceLabel } from '../../utils'
import { DEVICE_CONFIG, TRUST_LEVELS } from '../../theme/tokens'
import type { Rental } from '../../types'
import {
  MdNotifications,
  MdAccountBalanceWallet,
  MdQrCodeScanner,
  MdBatteryChargingFull,
  MdHistory,
  MdLocationOn,
  MdArrowForward,
  MdBolt,
  MdTrendingUp,
} from 'react-icons/md'

// ─── Skeleton shimmer ─────────────────────────────────────
const Shimmer = ({ className = '' }: { className?: string }) => (
  <div className={`relative overflow-hidden bg-slate-100 rounded-3xl ${className}`}>
    <div
      className="absolute inset-0"
      style={{
        background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)',
        animation: 'shimmer 1.4s ease-in-out infinite',
        backgroundSize: '200% 100%',
      }}
    />
  </div>
)

// Add to index.css:
// @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const justRegistered = location.state?.justRegistered

  // ── Fire all 3 requests in PARALLEL ──────────────────
  const [walletQuery, rentalsQuery, notifQuery] = useQueries({
    queries: [
      {
        queryKey: ['wallet'],
        queryFn: paymentsApi.getWallet,
        staleTime: 1000 * 60 * 2,
      },
      {
        queryKey: ['rentals', 'active'],
        queryFn: () => rentalsApi.getMyRentals({ status: 'active', limit: 1 }),
        staleTime: 1000 * 30,
      },
      {
        queryKey: ['notifications'],
        queryFn: notificationsApi.getAll,
        staleTime: 1000 * 60,
      },
    ],
  })

  const wallet = walletQuery.data as any
  const activeRental = (rentalsQuery.data as any)?.rentals?.[0] as Rental | undefined
  const unread = (notifQuery.data as any)?.unreadCount || 0
  const balance = wallet?.walletBalance || 0
  const trustLevel = user?.trustLevel || 'basic'
  const trustConfig = TRUST_LEVELS[trustLevel as keyof typeof TRUST_LEVELS]
  const score = user?.trustScore || 0
  const nextThreshold = trustConfig?.threshold || 10
  const progress = Math.min(100, (score / nextThreshold) * 100)

  return (
    <div className="bg-slate-50 min-h-svh">

      {/* ── Header ──────────────────────────────── */}
      <div className="bg-white px-5 pt-14 pb-5 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 mb-0.5">
              Good {greeting()},
            </p>
            <h1 className="text-2xl font-black text-navy-900 leading-tight">
              {user?.name?.split(' ')[0] || 'Student'} 👋
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/notifications')}
              className="relative w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
            >
              <MdNotifications size={20} className="text-navy-700" />
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>
            <button
              onClick={() => navigate('/profile')}
              className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-navy-950 font-black text-sm hover:bg-green-400 transition-colors"
            >
              {user?.name?.charAt(0) || 'W'}
            </button>
          </div>
        </div>
      </div>

      <div className="px-5 pt-5 pb-6 flex flex-col gap-5">

        {/* ── Welcome banner (just registered) ─── */}
        {justRegistered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-3xl p-5"
            style={{ background: 'linear-gradient(135deg, #1db954, #16a34a)' }}
          >
            <p className="text-white font-black text-lg mb-1">
              Welcome to Waka! ⚡
            </p>
            <p className="text-white/70 text-sm mb-4">
              Your Nomba virtual account is ready. Fund your wallet to rent your first device.
            </p>
            <button
              onClick={() => navigate('/wallet/fund')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/20 text-white text-sm font-bold hover:bg-white/30 transition-colors"
            >
              Fund wallet now
              <MdArrowForward size={14} />
            </button>
          </motion.div>
        )}

        {/* ── Wallet card / empty wallet ───────── */}
        {walletQuery.isPending ? (
          <Shimmer className="h-52" />
        ) : balance === 0 ? (
          <EmptyWallet
            virtualAccountNumber={wallet?.virtualAccount?.accountNumber}
            virtualAccountBank={wallet?.virtualAccount?.bankName}
            userName={user?.name}
          />
        ) : (
          <WalletCard
            balance={balance}
            accountNumber={wallet?.virtualAccount?.accountNumber}
            bankName={wallet?.virtualAccount?.bankName}
            accountName={wallet?.virtualAccount?.accountName}
            loading={walletQuery.isPending}
            onFund={() => navigate('/wallet/fund')}
            onView={() => navigate('/transactions')}
          />
        )}

        {/* ── Active rental banner ─────────────── */}
        {rentalsQuery.isPending ? (
          <Shimmer className="h-24" />
        ) : activeRental ? (
          <ActiveRentalBanner
            rental={activeRental}
            onTap={() => navigate(`/rentals/${activeRental._id}`)}
          />
        ) : null}

        {/* ── Quick actions ─────────────────────── */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
            Quick actions
          </p>
          <div className="grid grid-cols-4 gap-2.5">
            {[
              {
                icon: <MdLocationOn size={22} className="text-green-600" />,
                label: 'Stations',
                path: '/stations',
                bg: '#f0fdf4',
              },
              {
                icon: <MdQrCodeScanner size={22} className="text-blue-600" />,
                label: 'Scan QR',
                path: '/scan',
                bg: '#eff6ff',
              },
              {
                icon: <MdBatteryChargingFull size={22} className="text-purple-600" />,
                label: 'Rentals',
                path: '/rentals',
                bg: '#faf5ff',
              },
              {
                icon: <MdHistory size={22} className="text-amber-600" />,
                label: 'History',
                path: '/transactions',
                bg: '#fffbeb',
              },
            ].map(a => (
              <motion.button
                key={a.path}
                whileTap={{ scale: 0.92 }}
                onClick={() => navigate(a.path)}
                className="flex flex-col items-center gap-2 py-3.5 rounded-2xl border border-slate-100 bg-white active:brightness-95 transition-all"
                style={{ background: a.bg }}
              >
                {a.icon}
                <span className="text-[10px] font-bold text-slate-600">
                  {a.label}
                </span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* ── Trust score card ──────────────────── */}
        <motion.button
          whileTap={{ scale: 0.99 }}
          onClick={() => navigate('/trust')}
          className="bg-white rounded-3xl border border-slate-100 p-5 text-left w-full"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center">
                <MdTrendingUp size={20} className="text-amber-500" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-0.5">
                  Trust Score
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black text-navy-900">{score}</span>
                  <span className="text-sm font-bold" style={{ color: trustConfig?.color }}>
                    {trustConfig?.emoji} {trustConfig?.label}
                  </span>
                </div>
              </div>
            </div>
            {user?.rnplEnabled ? (
              <Badge variant="amber" dot size="sm">RNPL Active</Badge>
            ) : (
              <p className="text-xs text-slate-400">
                {Math.max(0, 10 - score)} to RNPL
              </p>
            )}
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #1db954, #34d572)' }}
            />
          </div>
          {score < 31 && (
            <p className="text-xs text-slate-400 mt-2">
              {Math.max(0, nextThreshold - score)} more returns to{' '}
              {score >= 18 ? 'Gold tier' : score >= 10 ? 'Silver tier' : 'unlock RNPL'}
            </p>
          )}
        </motion.button>

        {/* ── Devices grid ──────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Available devices
            </p>
            <button
              onClick={() => navigate('/stations')}
              className="flex items-center gap-1 text-xs font-semibold text-green-600"
            >
              Find station
              <MdArrowForward size={12} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(DEVICE_CONFIG).map(([type, config]) => (
              <motion.button
                key={type}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/stations')}
                className="bg-white rounded-3xl border border-slate-100 p-4 text-left relative overflow-hidden hover:border-slate-200 transition-all"
              >
                <div
                  className="absolute top-0 right-0 w-16 h-16 rounded-full opacity-[0.08]"
                  style={{
                    background: config.color,
                    transform: 'translate(30%, -30%)'
                  }}
                />
                <span className="text-3xl block mb-2">{config.emoji}</span>
                <p className="font-bold text-navy-900 text-sm">{config.label}</p>
                <div className="flex items-center justify-between mt-2">
                  <span
                    className="text-base font-black"
                    style={{ color: config.color }}
                  >
                    ₦{config.price}
                  </span>
                  <Badge variant="slate" size="xs">
                    +₦{config.deposit} dep
                  </Badge>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* ── Roadmap teaser ────────────────────── */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/roadmap')}
          className="rounded-3xl p-5 text-left w-full"
          style={{ background: 'linear-gradient(135deg, #0b1420, #1a2f45)' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-green-400 mb-1">
                Coming next
              </p>
              <p className="text-white font-bold text-sm">
                Waka Wallet · Market · Transport
              </p>
              <p className="text-white/40 text-xs mt-1">
                See the full product roadmap →
              </p>
            </div>
            <MdBolt size={28} className="text-green-400/40" />
          </div>
        </motion.button>
      </div>
    </div>
  )
}

// ─── Active rental banner ─────────────────────────────────
const ActiveRentalBanner = ({
  rental,
  onTap,
}: {
  rental: Rental
  onTap: () => void
}) => {
  const { timeLeft, isOverdue } = useCountdown(rental.expectedReturnTime)

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      onClick={onTap}
      className={`w-full rounded-3xl p-5 text-left border-2 ${
        isOverdue
          ? 'bg-amber-50 border-amber-300'
          : 'bg-green-50 border-green-200'
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <StatusPill status={isOverdue ? 'overdue' : 'active'} />
            <span className="text-xs text-slate-500 font-semibold">
              Active rental
            </span>
          </div>
          <p className="font-bold text-navy-900">
            {deviceEmoji(rental.deviceType)} {deviceLabel(rental.deviceType)}
          </p>
          <p className={`text-lg font-black mt-1 ${
            isOverdue ? 'text-amber-600' : 'text-green-600'
          }`}>
            {timeLeft}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">Locker</p>
          <p className="font-black text-navy-900 text-xl">
            {rental.lockerAssigned}
          </p>
          <div className="flex items-center gap-1 mt-1 justify-end">
            <p className="text-xs text-slate-400">Tap to manage</p>
            <MdArrowForward size={12} className="text-slate-400" />
          </div>
        </div>
      </div>
    </motion.button>
  )
}