import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { rentalsApi } from '../../api/rentals.api'
import { TopBar } from '../../components/shared/TopBar'
import { Card, Skeleton } from '../../components/ui/Card'
import { StatusPill } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { useToast } from '../../components/ui/Toast'
import { useCountdown } from '../../hooks/useCountdown'
import { deviceEmoji, deviceLabel, formatCurrency, formatDateTime } from '../../utils'

export default function ActiveRental() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()

  const { data, isLoading } = useQuery({
    queryKey: ['rental', id],
    queryFn: () => rentalsApi.getRental(id!),
    refetchInterval: 30000,
  })

  const rental = (data as any)?.rental

  const { timeLeft, isOverdue } = useCountdown(
    rental?.status === 'active' || rental?.status === 'overdue'
      ? rental?.expectedReturnTime
      : null
  )

  const { mutate: initiateReturn, isPending: returning } = useMutation({
    mutationFn: () => rentalsApi.initiateReturn(id!),
    onSuccess: (res: any) => {
      navigate('/return-device', { state: { rental, initiateResponse: res } })
    },
    onError: (err: any) => {
      toast(err.response?.data?.message || 'Could not initiate return', 'error')
    }
  })

  const { mutate: cancel, isPending: cancelling } = useMutation({
    mutationFn: () => rentalsApi.cancelRental(id!),
    onSuccess: () => {
      toast('Rental cancelled. Full refund processed.', 'success')
      navigate('/rentals')
    },
    onError: (err: any) => {
      toast(err.response?.data?.message || 'Could not cancel', 'error')
    }
  })

  if (isLoading) return (
    <div className="bg-slate-50 min-h-svh">
      <TopBar title="Rental" />
      <div className="px-5 py-5 flex flex-col gap-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-28" />)}
      </div>
    </div>
  )

  if (!rental) return (
    <div className="bg-slate-50 min-h-svh">
      <TopBar title="Rental" />
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-400">Rental not found</p>
      </div>
    </div>
  )

  const isActive = rental.status === 'active' || rental.status === 'overdue'
  const minutesSince = (Date.now() - new Date(rental.startTime).getTime()) / 60000

  return (
    <div className="bg-slate-50 min-h-svh">
      <TopBar title="Rental Details" />
      <div className="px-5 py-5 flex flex-col gap-4">

        {/* Device hero */}
        <div className="bg-white rounded-3xl p-6 text-center border border-slate-100">
          <span className="text-6xl block mb-3">{deviceEmoji(rental.deviceType)}</span>
          <h2 className="text-2xl font-black text-navy-900 mb-2">
            {deviceLabel(rental.deviceType)}
          </h2>
          <StatusPill status={rental.status} />
        </div>

        {/* Countdown */}
        {isActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`rounded-3xl p-5 text-center ${
              isOverdue
                ? 'bg-amber-50 border-2 border-amber-300'
                : 'bg-green-50 border-2 border-green-200'
            }`}
          >
            <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${
              isOverdue ? 'text-amber-500' : 'text-green-600'
            }`}>
              {isOverdue ? '⚠️ Overdue' : '⏱ Time remaining'}
            </p>
            <p className={`text-4xl font-black font-mono ${
              isOverdue ? 'text-amber-600' : 'text-green-600'
            }`}>
              {timeLeft}
            </p>
          </motion.div>
        )}

        {/* Details */}
        <Card>
          {[
            ['Locker', rental.lockerAssigned],
            ['Started', formatDateTime(rental.startTime)],
            ['Return by', formatDateTime(rental.expectedReturnTime)],
            ['Rental fee', formatCurrency(rental.rentalAmount)],
            ['Deposit', formatCurrency(rental.depositAmount)],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
              <p className="text-sm text-slate-400">{label}</p>
              <p className="font-semibold text-navy-900 text-sm">{value}</p>
            </div>
          ))}
          <div className="flex items-center justify-between py-3">
            <p className="text-sm text-slate-400">Confirmation code</p>
            <p className="font-mono font-black text-amber-500 text-xl tracking-widest">
              {rental.confirmationCode}
            </p>
          </div>
        </Card>

        {rental.status === 'returned' && (
          <Card className="bg-green-50 border-2 border-green-200">
            <div className="text-center">
              <p className="text-4xl mb-2">✅</p>
              <p className="font-black text-navy-900 text-lg">Returned successfully</p>
              {rental.depositRefunded > 0 && (
                <p className="text-green-600 font-semibold mt-1">
                  +{formatCurrency(rental.depositRefunded)} refunded to wallet
                </p>
              )}
              {rental.lateFee > 0 && (
                <p className="text-amber-600 text-sm mt-1">
                  -{formatCurrency(rental.lateFee)} late fee deducted
                </p>
              )}
            </div>
          </Card>
        )}

        {isActive && (
          <div className="flex flex-col gap-3">
            <Button
              variant="primary"
              size="lg"
              fullWidth
              loading={returning}
              onClick={() => initiateReturn()}
            >
              ↩️ Return device
            </Button>
            {minutesSince < 5 && (
              <Button
                variant="outline"
                fullWidth
                loading={cancelling}
                onClick={() => cancel()}
                className="border-red-200 text-red-500 hover:bg-red-50"
              >
                Cancel rental (full refund)
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}