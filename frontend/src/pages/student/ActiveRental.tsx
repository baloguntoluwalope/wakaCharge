import { useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MdArrowBack,
  MdKeyboardReturn,
  MdTimer,
  MdWarning,
  MdCheckCircle,
  MdLock,
  MdLockOpen,
  MdBolt,
  MdClose,
  MdReceipt,
  MdContentCopy,
} from 'react-icons/md'
import { rentalsApi } from '../../api/rentals.api'
import { useToast } from '../../components/ui/Toast'
import { useCountdown } from '../../hooks/useCountdown'
import {
  deviceEmoji,
  deviceLabel,
  formatCurrency,
  formatDateTime,
} from '../../utils'
import type { Rental } from '../../types'

export default function ActiveRental() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()
  const qc = useQueryClient()

  const [codeCopied, setCodeCopied] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  // ── Try to use data passed from dashboard first ───────
  // This prevents a refetch when navigating from dashboard
  const passedRental = location.state?.rental as Rental | undefined

  const { data, isLoading, error } = useQuery({
    queryKey: ['rental', id],
    queryFn: () => rentalsApi.getRental(id!),
    enabled: !!id,
    // Use passed rental as initial data — instant display
    initialData: passedRental
      ? { success: true, rental: passedRental }
      : undefined,
    staleTime: 1000 * 30,
    retry: 2,
  })

  const rental = (data as any)?.rental as Rental | undefined

  const { timeLeft, isOverdue } = useCountdown(
    rental?.status === 'active' || rental?.status === 'overdue'
      ? rental?.expectedReturnTime
      : null
  )

  // ── Initiate return ───────────────────────────────────
  const { mutate: initiateReturn, isPending: initiating } = useMutation({
    mutationFn: () => rentalsApi.initiateReturn(id!),
    onSuccess: (res: any) => {
      navigate('/return-device', {
        state: {
          rental,
          initiateResponse: res,
        },
      })
    },
    onError: (err: any) => {
      toast(
        err.response?.data?.message || 'Could not initiate return. Try again.',
        'error'
      )
    },
  })

  // ── Cancel rental ─────────────────────────────────────
  const { mutate: cancelRental, isPending: cancelling } = useMutation({
    mutationFn: () => rentalsApi.cancelRental(id!),
    onSuccess: () => {
      toast('Rental cancelled. Full refund processed.', 'success')
      qc.invalidateQueries({ queryKey: ['rentals'] })
      qc.invalidateQueries({ queryKey: ['wallet'] })
      navigate('/rentals')
    },
    onError: (err: any) => {
      toast(
        err.response?.data?.message || 'Could not cancel rental.',
        'error'
      )
      setShowCancelConfirm(false)
    },
  })

  const copyCode = () => {
    if (rental?.confirmationCode) {
      navigator.clipboard.writeText(rental.confirmationCode)
      setCodeCopied(true)
      setTimeout(() => setCodeCopied(false), 2500)
    }
  }

  const minutesSinceStart = rental?.startTime
    ? (Date.now() - new Date(rental.startTime).getTime()) / 60000
    : Infinity

  const canCancel = minutesSinceStart < 5 && rental?.status === 'active'

  // ── Loading state ─────────────────────────────────────
  if (isLoading && !passedRental) {
    return (
      <div className="min-h-svh bg-slate-50 flex flex-col">
        <Header onBack={() => navigate(-1)} />
        <div className="flex-1 px-5 py-5 flex flex-col gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-28 bg-white rounded-3xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  // ── Error / not found state ───────────────────────────
  if (error || !rental) {
    return (
      <div className="min-h-svh bg-slate-50 flex flex-col">
        <Header onBack={() => navigate('/rentals')} />
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
            <MdWarning size={32} className="text-red-400" />
          </div>
          <h2 className="text-xl font-black text-navy-900 mb-2">
            Rental not found
          </h2>
          <p className="text-slate-500 text-sm leading-relaxed mb-6">
            We couldn't load this rental. It may have been cancelled or the link is incorrect.
          </p>
          <button
            onClick={() => navigate('/rentals')}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-green-500 text-white font-bold text-sm hover:bg-green-400 transition-all"
          >
            View all rentals
          </button>
        </div>
      </div>
    )
  }

  const isActive = rental.status === 'active' || rental.status === 'overdue'
  const isReturned = rental.status === 'returned'
  const isCancelled = rental.status === 'cancelled'

  // ── Status color config ───────────────────────────────
  const statusConfig = {
    active: { color: '#1db954', bg: '#f0fdf4', border: '#bbf7d0', label: 'Active' },
    overdue: { color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', label: 'Overdue' },
    returned: { color: '#64748b', bg: '#f8fafc', border: '#e2e8f0', label: 'Returned' },
    cancelled: { color: '#94a3b8', bg: '#f8fafc', border: '#e2e8f0', label: 'Cancelled' },
  }[rental.status] || { color: '#64748b', bg: '#f8fafc', border: '#e2e8f0', label: rental.status }

  return (
    <div className="bg-slate-50 min-h-svh">
      <Header onBack={() => navigate('/rentals')} />

      <div className="px-5 py-5 flex flex-col gap-4 pb-10">

        {/* ── Device hero ───────────────────────── */}
        <div
          className="rounded-3xl overflow-hidden"
          style={{ border: `2px solid ${statusConfig.border}` }}
        >
          {/* Status bar */}
          <div
            className="px-5 py-2.5 flex items-center justify-between"
            style={{ background: statusConfig.color }}
          >
            <p className="text-white text-xs font-bold uppercase tracking-widest">
              {statusConfig.label}
            </p>
            <div className="flex items-center gap-1.5">
              {rental.lockerStatus === 'locked'
                ? <MdLock size={14} className="text-white/70" />
                : <MdLockOpen size={14} className="text-white" />
              }
              <p className="text-white/80 text-xs font-bold">
                Locker {rental.lockerAssigned || '—'}
              </p>
            </div>
          </div>

          {/* Device info */}
          <div
            className="p-5 flex items-center gap-4"
            style={{ background: statusConfig.bg }}
          >
            <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center text-3xl flex-shrink-0 shadow-sm">
              {deviceEmoji(rental.deviceType)}
            </div>
            <div className="flex-1">
              <p className="font-black text-navy-900 text-xl">
                {deviceLabel(rental.deviceType)}
              </p>
              {isActive && (
                <div className="flex items-center gap-1.5 mt-1">
                  <MdTimer
                    size={15}
                    style={{ color: statusConfig.color }}
                  />
                  <p
                    className="text-lg font-black"
                    style={{ color: statusConfig.color }}
                  >
                    {timeLeft}
                  </p>
                </div>
              )}
              {isReturned && (
                <div className="flex items-center gap-1.5 mt-1">
                  <MdCheckCircle size={15} className="text-green-500" />
                  <p className="text-sm font-semibold text-green-600">
                    Returned successfully
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Return success card ───────────────── */}
        {isReturned && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 border-2 border-green-200 rounded-3xl p-5"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-2xl bg-green-500 flex items-center justify-center">
                <MdCheckCircle size={24} className="text-white" />
              </div>
              <div>
                <p className="font-black text-navy-900 text-base">
                  Returned successfully
                </p>
                <p className="text-green-600 text-xs font-semibold">
                  {formatDateTime(rental.actualReturnTime || '')}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {rental.depositRefunded > 0 && (
                <div className="flex items-center justify-between py-2 border-t border-green-200">
                  <p className="text-sm text-green-700">Deposit refunded</p>
                  <p className="font-black text-green-700">
                    +{formatCurrency(rental.depositRefunded)}
                  </p>
                </div>
              )}
              {rental.lateFee > 0 && (
                <div className="flex items-center justify-between py-2 border-t border-green-200">
                  <p className="text-sm text-amber-600">Late fee charged</p>
                  <p className="font-black text-amber-600">
                    -{formatCurrency(rental.lateFee)}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── Confirmation code ─────────────────── */}
        {isActive && (
          <div className="bg-white rounded-3xl border border-slate-100 p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
              Your return code — keep this safe
            </p>
            <div className="flex items-center justify-between bg-amber-50 border-2 border-amber-200 rounded-2xl px-5 py-4">
              <div>
                <p className="text-[10px] text-amber-600 font-bold uppercase tracking-widest mb-1">
                  4-digit code
                </p>
                <p className="font-mono font-black text-4xl tracking-[0.3em] text-amber-500">
                  {rental.confirmationCode}
                </p>
              </div>
              <button
                onClick={copyCode}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  codeCopied
                    ? 'bg-green-500 text-white'
                    : 'bg-amber-200 text-amber-700 hover:bg-amber-300'
                }`}
              >
                {codeCopied ? (
                  <><MdCheckCircle size={13} /> Copied!</>
                ) : (
                  <><MdContentCopy size={13} /> Copy</>
                )}
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">
              Hand the device to the kiosk operator, then enter this code
              to confirm return and reclaim your deposit.
            </p>
          </div>
        )}

        {/* ── Rental details ────────────────────── */}
        <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-50 flex items-center gap-2">
            <MdReceipt size={16} className="text-slate-400" />
            <p className="text-sm font-bold text-navy-900">Rental details</p>
          </div>
          <div className="divide-y divide-slate-50">
            {[
              {
                label: 'Started',
                value: formatDateTime(rental.startTime),
              },
              {
                label: 'Return by',
                value: formatDateTime(rental.expectedReturnTime),
                highlight: isOverdue,
              },
              rental.actualReturnTime
                ? {
                    label: 'Returned at',
                    value: formatDateTime(rental.actualReturnTime),
                  }
                : null,
              {
                label: 'Rental fee',
                value: formatCurrency(rental.rentalAmount),
              },
              {
                label: 'Deposit held',
                value: formatCurrency(rental.depositAmount),
              },
              {
                label: 'Total paid',
                value: formatCurrency(rental.totalPaid),
                bold: true,
              },
              rental.paymentType === 'RNPL'
                ? { label: 'Payment', value: 'Rent Now, Pay Later' }
                : null,
            ]
              .filter(Boolean)
              .map((row: any) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between px-5 py-3.5"
                >
                  <p className="text-sm text-slate-400">{row.label}</p>
                  <p
                    className={`text-sm ${
                      row.bold
                        ? 'font-black text-navy-900'
                        : row.highlight
                        ? 'font-bold text-amber-600'
                        : 'font-semibold text-navy-900'
                    }`}
                  >
                    {row.value}
                  </p>
                </div>
              ))}
          </div>
        </div>

        {/* ── Overdue warning ───────────────────── */}
        {isOverdue && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-5 flex items-start gap-3"
          >
            <MdWarning size={20} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-800 text-sm mb-1">
                Your rental is overdue
              </p>
              <p className="text-amber-700 text-xs leading-relaxed">
                Late fees are accumulating. Return the device immediately
                at any Waka Charge kiosk to stop the charges.
              </p>
            </div>
          </motion.div>
        )}

        {/* ── Action buttons ────────────────────── */}
        {isActive && (
          <div className="flex flex-col gap-3">
            {/* Primary — Return device */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => initiateReturn()}
              disabled={initiating}
              className={`
                w-full flex items-center justify-center gap-2.5
                py-4 rounded-2xl font-black text-base transition-all
                disabled:opacity-50
                ${isOverdue
                  ? 'bg-amber-500 text-white hover:bg-amber-400'
                  : 'bg-green-500 text-white hover:bg-green-400'
                }
              `}
            >
              {initiating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Preparing return…
                </>
              ) : (
                <>
                  <MdKeyboardReturn size={22} />
                  Return device
                </>
              )}
            </motion.button>

            {/* Cancel rental — only within 5 minutes */}
            {canCancel && (
              <button
                onClick={() => setShowCancelConfirm(true)}
                className="w-full py-3.5 rounded-2xl border-2 border-red-200 text-red-500 font-semibold text-sm hover:bg-red-50 transition-all"
              >
                Cancel rental (full refund within 5 min)
              </button>
            )}
          </div>
        )}

        {/* Navigate back if returned/cancelled */}
        {(isReturned || isCancelled) && (
          <button
            onClick={() => navigate('/rentals')}
            className="w-full py-4 rounded-2xl bg-navy-900 text-white font-bold text-sm hover:bg-navy-800 transition-all"
          >
            View all rentals
          </button>
        )}
      </div>

      {/* ── Cancel confirmation modal ─────────── */}
      <AnimatePresence>
        {showCancelConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setShowCancelConfirm(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl p-6 max-w-lg mx-auto"
            >
              <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5" />
              <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
                <MdClose size={28} className="text-red-500" />
              </div>
              <h2 className="text-xl font-black text-navy-900 text-center mb-2">
                Cancel this rental?
              </h2>
              <p className="text-slate-500 text-sm text-center leading-relaxed mb-6">
                You'll receive a full refund of{' '}
                <strong>{formatCurrency(rental.totalPaid)}</strong> back
                to your Waka Wallet. Cancellation is only allowed within
                5 minutes of starting.
              </p>
              <div className="flex flex-col gap-2.5">
                <button
                  onClick={() => cancelRental()}
                  disabled={cancelling}
                  className="w-full py-4 rounded-2xl bg-red-500 text-white font-black text-sm hover:bg-red-600 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {cancelling ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Cancelling…
                    </>
                  ) : (
                    'Yes, cancel rental'
                  )}
                </button>
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="w-full py-4 rounded-2xl border border-slate-200 text-slate-600 font-semibold text-sm"
                >
                  Keep rental
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Shared header ────────────────────────────────────────
const Header = ({ onBack }: { onBack: () => void }) => (
  <div className="bg-white px-5 py-4 border-b border-slate-100 sticky top-0 z-30">
    <div className="flex items-center gap-3">
      <button
        onClick={onBack}
        className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors"
      >
        <MdArrowBack size={18} />
      </button>
      <h1 className="font-black text-navy-900 text-lg">Rental Details</h1>
    </div>
  </div>
)