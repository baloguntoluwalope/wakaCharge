import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { rentalsApi } from '../../api/rentals.api'
import { TopBar } from '../../components/shared/TopBar'
import { Card, Skeleton } from '../../components/ui/Card'
import { StatusPill } from '../../components/ui/Badge'
import { EmptyState } from '../../components/ui/EmptyState'
import { useCountdown } from '../../hooks/useCountdown'
import { deviceEmoji, deviceLabel, formatCurrency, formatDate } from '../../utils'
import type { Rental } from '../../types'

const TABS = [
  { value: 'active', label: 'Active' },
  { value: 'returned', label: 'Returned' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'cancelled', label: 'Cancelled' },
]

export default function Rentals() {
  const [tab, setTab] = useState('active')
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['rentals', tab],
    queryFn: () => rentalsApi.getMyRentals({ status: tab }),
  })

  const rentals = (data as any)?.rentals as Rental[] || []

  return (
    <div className="bg-slate-50 min-h-svh">
      <TopBar title="My Rentals" onBack={false} />

      <div className="bg-white px-5 py-3 border-b border-slate-100 flex gap-2 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              tab === t.value
                ? 'bg-navy-900 text-white'
                : 'bg-slate-100 text-slate-500'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="px-5 py-4">
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2].map(i => <Skeleton key={i} className="h-28" />)}
          </div>
        ) : rentals.length === 0 ? (
          <EmptyState
            icon="🔋"
            title={`No ${tab} rentals`}
            description={tab === 'active' ? 'Find a station to rent a device' : undefined}
            action={tab === 'active' ? { label: 'Find station', onClick: () => navigate('/stations') } : undefined}
          />
        ) : (
          <div className="flex flex-col gap-3">
            {rentals.map((r, i) => (
              <motion.div
                key={r._id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <RentalCard rental={r} onClick={() => navigate(`/rentals/${r._id}`)} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const RentalCard = ({ rental, onClick }: { rental: Rental; onClick: () => void }) => {
  const { timeLeft, isOverdue } = useCountdown(
    rental.status === 'active' ? rental.expectedReturnTime : null
  )

  return (
    <Card hoverable onClick={onClick}>
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-2xl flex-shrink-0">
          {deviceEmoji(rental.deviceType)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="font-bold text-navy-900">{deviceLabel(rental.deviceType)}</p>
            <StatusPill status={rental.status} />
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {formatDate(rental.startTime)} · {formatCurrency(rental.totalPaid)}
          </p>
          {rental.status === 'active' && (
            <p className={`text-sm font-bold mt-1 ${isOverdue ? 'text-amber-500' : 'text-green-600'}`}>
              {timeLeft}
            </p>
          )}
          {rental.status === 'returned' && rental.depositRefunded > 0 && (
            <p className="text-xs text-green-600 font-semibold mt-1">
              +{formatCurrency(rental.depositRefunded)} refunded
            </p>
          )}
        </div>
      </div>
      {rental.status === 'active' && (
        <div className="mt-3 h-1 bg-slate-100 rounded-full overflow-hidden">
          <div className="charge-bar h-full" />
        </div>
      )}
    </Card>
  )
}