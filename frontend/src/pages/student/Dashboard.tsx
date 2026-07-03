import { useNavigate, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { FaBell, FaUser, FaLocationDot, FaCamera, FaBolt, FaClockRotateLeft, FaCompass } from 'react-icons/fa6'
import { useAuth } from '../../context/AuthContext'
import { paymentsApi } from '../../api/payments.api'
import { rentalsApi } from '../../api/rentals.api'
import { notificationsApi } from '../../api/notifications.api'
import { WalletCard, Card, Skeleton } from '../../components/ui/Card'
import { Badge, StatusPill } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { useCountdown } from '../../hooks/useCountdown'
import { greeting, deviceEmoji, deviceLabel } from '../../utils'
import { DEVICE_CONFIG, TRUST_LEVELS } from '../../theme/tokens'
import type { Rental } from '../../types'

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const justRegistered = location.state?.justRegistered

  const { data: walletData, isLoading: walletLoading } = useQuery({
    queryKey: ['wallet'],
    queryFn: paymentsApi.getWallet,
  })

  const { data: rentalsData } = useQuery({
    queryKey: ['rentals', 'active'],
    queryFn: () => rentalsApi.getMyRentals({ status: 'active', limit: 1 }),
  })

  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationsApi.getAll,
  })

  const activeRental = (rentalsData as any)?.rentals?.[0] as Rental | undefined
  const wallet = walletData as any
  const unread = (notifData as any)?.unreadCount || 0
  const trustLevel = user?.trustLevel || 'basic'
  const trustConfig = TRUST_LEVELS[trustLevel]
  const score = user?.trustScore || 0
  const nextThreshold = trustConfig.threshold || 31
  const progress = Math.min(100, (score / nextThreshold) * 100)

  return (
    <div className="bg-slate-50 min-h-svh">
      {/* Header */}
      <div className="bg-white px-5 pt-14 pb-5 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 mb-0.5">
              Good {greeting()},
            </p>
            <h1 className="text-2xl font-black text-navy-900">
              {user?.name?.split(' ')[0] || 'Student'} 👋
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/notifications')}
              className="relative w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center"
            >
              <FaBell className="text-lg text-slate-600" />
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>
            <button
              onClick={() => navigate('/profile')}
              className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-navy-950 font-black text-sm"
            >
              <FaUser className="text-sm" />
            </button>
          </div>
        </div>
      </div>

      <div className="px-5 pt-5 pb-6 flex flex-col gap-5">
        {/* Welcome banner for new users */}
        {justRegistered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-r from-green-500 to-green-400 rounded-3xl p-5"
          >
            <p className="text-navy-950 font-black text-lg mb-1 flex items-center gap-2">Welcome to Waka! <FaBolt className="text-green-700" /></p>
            <p className="text-navy-950/70 text-sm mb-4">
              Your Nomba virtual account was created. Fund your wallet to rent your first device.
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/wallet/fund')}
              className="bg-white/20 text-navy-950 hover:bg-white/30 border-0"
            >
              Fund wallet now →
            </Button>
          </motion.div>
        )}

        {/* Wallet Card */}
        {walletLoading ? (
          <Skeleton className="h-48" />
        ) : (
          <WalletCard
            balance={wallet?.walletBalance || 0}
            accountNumber={wallet?.virtualAccount?.accountNumber}
            bankName={wallet?.virtualAccount?.bankName}
            accountName={wallet?.virtualAccount?.accountName}
            onFund={() => navigate('/wallet/fund')}
            onView={() => navigate('/transactions')}
          />
        )}

        {/* Active Rental Banner */}
        {activeRental && (
          <ActiveRentalBanner
            rental={activeRental}
            onTap={() => navigate(`/rentals/${activeRental._id}`)}
          />
        )}

        {/* Quick actions */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
            Quick actions
          </p>
          <div className="grid grid-cols-4 gap-3">
            {[
              { icon: FaLocationDot, label: 'Stations', path: '/stations' },
              { icon: FaCamera, label: 'Scan', path: '/scan' },
              { icon: FaBolt, label: 'Rentals', path: '/rentals' },
              { icon: FaClockRotateLeft, label: 'History', path: '/transactions' },
            ].map(a => {
              const Icon = a.icon
              return (
              <motion.button
                key={a.path}
                whileTap={{ scale: 0.93 }}
                onClick={() => navigate(a.path)}
                className="bg-white rounded-2xl p-3 flex flex-col items-center gap-2 border border-slate-100"
              >
                <Icon className="text-xl text-green-600" />
                <span className="text-[10px] font-semibold text-slate-500">{a.label}</span>
              </motion.button>
            )})}
          </div>
        </div>

        {/* Trust Score */}
        <Card
          hoverable
          onClick={() => navigate('/trust')}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-0.5">
                Trust Score
              </p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-navy-900">{score}</span>
                <span className="flex items-center gap-1 text-sm font-bold" style={{ color: trustConfig.color }}>
                  <trustConfig.icon className="text-sm" /> {trustConfig.label}
                </span>
              </div>
            </div>
            {user?.rnplEnabled ? (
              <Badge variant="amber" dot>RNPL Active</Badge>
            ) : (
              <p className="text-xs text-slate-400">
                {Math.max(0, 10 - score)} more to RNPL
              </p>
            )}
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full rounded-full bg-gradient-to-r from-green-500 to-green-400"
            />
          </div>
          {score < 31 && (
            <p className="text-xs text-slate-400 mt-2">
              {Math.max(0, nextThreshold - score)} more successful returns to{' '}
              {score >= 18 ? 'Gold' : score >= 10 ? 'Silver' : 'unlock RNPL'}
            </p>
          )}
        </Card>

        {/* Products showcase */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Available devices
            </p>
            <button
              onClick={() => navigate('/stations')}
              className="text-xs font-semibold text-green-600"
            >
              Find station →
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(DEVICE_CONFIG).map(([type, config]) => (
              <Card key={type} padding="sm" className="relative overflow-hidden">
                <div
                  className="absolute top-0 right-0 w-16 h-16 rounded-full opacity-10"
                  style={{ background: config.color, transform: 'translate(30%,-30%)' }}
                />
                <div className="mb-2 flex items-center justify-start">
                  <config.icon className="text-2xl" style={{ color: config.color }} />
                </div>
                <p className="font-bold text-navy-900 text-sm">{config.label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{config.description}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-sm font-black" style={{ color: config.color }}>
                    ₦{config.price}
                  </span>
                  <Badge variant="slate" size="xs">+₦{config.deposit} dep.</Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Roadmap teaser */}
        <Card
          hoverable
          onClick={() => navigate('/roadmap')}
          className="bg-navy-900 border-0"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-green-400 mb-1">
                What's coming
              </p>
              <p className="text-white font-bold">Waka Wallet · Market · Transport</p>
              <p className="text-white/40 text-xs mt-1">See the full roadmap →</p>
            </div>
            <FaCompass className="text-3xl text-green-400" />
          </div>
        </Card>
      </div>
    </div>
  )
}

const ActiveRentalBanner = ({
  rental,
  onTap
}: { rental: Rental; onTap: () => void }) => {
  const { timeLeft, isOverdue } = useCountdown(rental.expectedReturnTime)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onTap}
      className={`rounded-3xl p-5 cursor-pointer border-2 ${
        isOverdue
          ? 'bg-amber-50 border-amber-300'
          : 'bg-green-50 border-green-200'
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <StatusPill status={isOverdue ? 'overdue' : 'active'} />
            <span className="text-xs text-slate-500 font-semibold">Active rental</span>
          </div>
          <p className="font-bold text-navy-900">
            {deviceEmoji(rental.deviceType)} {deviceLabel(rental.deviceType)}
          </p>
          <p className={`text-sm font-black mt-1 ${isOverdue ? 'text-amber-600' : 'text-green-600'}`}>
            {timeLeft}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">Locker</p>
          <p className="font-black text-navy-900">{rental.lockerAssigned}</p>
          <p className="text-xs text-slate-400 mt-1">Tap to manage</p>
        </div>
      </div>
    </motion.div>
  )
}