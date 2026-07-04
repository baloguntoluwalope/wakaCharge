import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MdCheckCircle,
  MdCancel,
  MdHourglassEmpty,
  MdRefresh,
  MdArrowBack,
  MdHome,
  MdAccountBalanceWallet,
  MdReceipt,
  MdContentCopy,
  MdErrorOutline,
  MdSecurity,
  MdArrowForward,
} from 'react-icons/md'
import { paymentsApi } from '../../api/payments.api'
import { useAuth } from '../../context/AuthContext'
import { formatCurrency, formatDateTime } from '../../utils'

// ─── Types ────────────────────────────────────────────────
type PaymentStatus = 'pending' | 'success' | 'failed' | 'not_found'

interface PaymentData {
  reference: string
  status: PaymentStatus
  amount: number
  walletBalance?: number
  message?: string
}

// ─── Main component ───────────────────────────────────────
export default function PaymentVerify() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const reference =
    searchParams.get('reference') ||
    searchParams.get('orderReference') ||
    searchParams.get('ref') ||
    ''

  const orderId =
    searchParams.get('orderId') ||
    searchParams.get('order_id') ||
    ''

  const [paymentData, setPaymentData] = useState<PaymentData | null>(null)
  const [pollCount, setPollCount] = useState(0)
  const [copied, setCopied] = useState(false)
  const [isPolling, setIsPolling] = useState(false)
  const MAX_POLLS = 20

  // Guards against setState after unmount / stale intervals
  const isMounted = useRef(true)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Poll status from our backend ──────────────────────
  const { refetch: pollStatus } = useQuery({
    queryKey: ['payment-status', reference],
    queryFn: () => paymentsApi.pollStatus(reference),
    enabled: false,
  })

  // ── Manual verify (calls Nomba) ───────────────────────
  const { mutate: verifyNow, isPending: verifying } = useMutation({
    mutationFn: () => paymentsApi.verifyPayment(reference),
    onSuccess: (res: any) => {
      if (!isMounted.current) return
      const status: PaymentStatus = res.success ? 'success' : 'pending'
      setPaymentData(prev => ({
        ...prev!,
        status,
        walletBalance: res.walletBalance,
        message: res.message,
      }))
      setIsPolling(false)
    },
    onError: () => {
      if (!isMounted.current) return
      setPaymentData(prev => (prev ? { ...prev, status: 'pending' } : null))
    },
  })

  // ── Start polling on mount ────────────────────────────
  useEffect(() => {
    isMounted.current = true

    if (!reference) {
      setPaymentData({ reference: '', status: 'not_found', amount: 0 })
      return
    }

    setIsPolling(true)
    setPaymentData({
      reference,
      status: 'pending',
      amount: 0,
      message: 'Confirming payment with Nomba…'
    })
    setPollCount(0)

    let count = 0
    intervalRef.current = setInterval(async () => {
      count++
      if (isMounted.current) setPollCount(count)

      try {
        const result = await pollStatus()
        const data = result.data as any
        if (!isMounted.current) return

        if (data?.status === 'success') {
          clearInterval(intervalRef.current!)
          setIsPolling(false)
          setPaymentData({
            reference,
            status: 'success',
            amount: data.amount || 0,
            walletBalance: data.walletBalance,
            message: data.message || 'Payment confirmed',
          })
          return
        }

        if (data?.status === 'failed') {
          clearInterval(intervalRef.current!)
          setIsPolling(false)
          setPaymentData({
            reference,
            status: 'failed',
            amount: data.amount || 0,
            message: 'Payment was not completed',
          })
          return
        }

        setPaymentData(prev => ({
          ...prev!,
          status: 'pending',
          amount: data?.amount || prev?.amount || 0,
        }))
      } catch {
        // Swallow polling errors — keep trying
      }

      if (count >= MAX_POLLS) {
        clearInterval(intervalRef.current!)
        if (isMounted.current) setIsPolling(false)
        verifyNow()
      }
    }, 3000)

    return () => {
      isMounted.current = false
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [reference])

  // ── Copy reference ────────────────────────────────────
  const copyRef = () => {
    navigator.clipboard.writeText(reference)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  if (!paymentData) {
    return <LoadingScreen />
  }

  const { status, amount, walletBalance } = paymentData

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      {/* ── Top bar ─────────────────────────────── */}
      <div className="bg-white border-b border-slate-100 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <MdArrowBack size={18} />
          </button>
          <div>
            <p className="font-black text-navy-900 text-base">Payment Status</p>
            <p className="text-xs text-slate-400">Waka Wallet · Powered by Nomba</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <MdSecurity size={14} className="text-green-500" />
          <span className="text-xs font-semibold text-green-600">Secured</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col max-w-lg mx-auto w-full px-5 py-6 gap-4">

        {/* ── Status hero card ─────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-slate-100 overflow-hidden"
        >
          <AnimatePresence mode="wait">
            {status === 'pending' && (
              <PendingState
                key="pending"
                orderId={orderId}
                pollCount={pollCount}
                maxPolls={MAX_POLLS}
                isPolling={isPolling}
                onManualVerify={() => verifyNow()}
                verifying={verifying}
              />
            )}
            {status === 'success' && (
              <SuccessState
                key="success"
                orderId={orderId}
                amount={amount}
                walletBalance={walletBalance}
                userName={user?.name || ''}
              />
            )}
            {status === 'failed' && (
              <FailedState key="failed" />
            )}
            {status === 'not_found' && (
              <NotFoundState key="not_found" />
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── Reference & receipt card ─────────── */}
        {reference && status !== 'not_found' && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-3xl border border-slate-100 p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <MdReceipt size={18} className="text-slate-400" />
              <p className="text-sm font-bold text-navy-900">Transaction details</p>
            </div>

            <div className="flex flex-col gap-3">
              {/* Reference */}
              <div className="flex items-center justify-between py-2.5 border-b border-slate-50">
                <p className="text-xs text-slate-400 font-medium">Reference</p>
                <div className="flex items-center gap-2">
                  <p className="font-mono text-xs font-bold text-navy-900">
                    {reference.slice(0, 20)}{reference.length > 20 ? '…' : ''}
                  </p>
                  <button
                    onClick={copyRef}
                    className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
                  >
                    {copied
                      ? <MdCheckCircle size={14} className="text-green-500" />
                      : <MdContentCopy size={14} />
                    }
                  </button>
                </div>
              </div>

              {/* Order ID */}
              {orderId && (
                <div className="flex items-center justify-between py-2.5 border-b border-slate-50">
                  <p className="text-xs text-slate-400 font-medium">Order ID</p>
                  <p className="font-mono text-xs font-bold text-navy-700">
                    {orderId.slice(0, 20)}{orderId.length > 20 ? '…' : ''}
                  </p>
                </div>
              )}

              {/* Provider */}
              <div className="flex items-center justify-between py-2.5 border-b border-slate-50">
                <p className="text-xs text-slate-400 font-medium">Payment provider</p>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-sm bg-green-500 flex items-center justify-center">
                    <span className="text-white text-[8px] font-black">N</span>
                  </div>
                  <p className="text-xs font-bold text-navy-900">Nomba</p>
                </div>
              </div>

              {/* Account */}
              <div className="flex items-center justify-between py-2.5 border-b border-slate-50">
                <p className="text-xs text-slate-400 font-medium">Destination</p>
                <p className="text-xs font-bold text-navy-900">Waka Wallet</p>
              </div>

              {/* Timestamp */}
              <div className="flex items-center justify-between py-2.5">
                <p className="text-xs text-slate-400 font-medium">Date & time</p>
                <p className="text-xs font-bold text-navy-900">
                  {formatDateTime(new Date().toISOString())}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Action buttons ────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="flex flex-col gap-3"
        >
          {status === 'success' && (
            <>
              <button
                onClick={() => navigate('/wallet')}
                className="w-full flex items-center justify-between px-5 py-4 rounded-2xl bg-green-500 text-white font-bold text-sm hover:bg-green-400 transition-all group"
              >
                <span className="flex items-center gap-2.5">
                  <MdAccountBalanceWallet size={18} />
                  View Waka Wallet
                </span>
                <MdArrowForward
                  size={16}
                  className="group-hover:translate-x-0.5 transition-transform"
                />
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full flex items-center justify-between px-5 py-4 rounded-2xl bg-white border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-all"
              >
                <span className="flex items-center gap-2.5">
                  <MdHome size={18} />
                  Back to dashboard
                </span>
                <MdArrowForward size={16} className="text-slate-300" />
              </button>
            </>
          )}

          {status === 'pending' && (
            <>
              <button
                onClick={() => verifyNow()}
                disabled={verifying}
                className="w-full flex items-center justify-center gap-2 px-5 py-4 rounded-2xl bg-navy-900 text-white font-bold text-sm hover:bg-navy-800 transition-all disabled:opacity-40"
              >
                {verifying ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Checking with Nomba…
                  </>
                ) : (
                  <>
                    <MdRefresh size={18} />
                    Check payment status
                  </>
                )}
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full flex items-center justify-center gap-2 px-5 py-4 rounded-2xl bg-white border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-all"
              >
                <MdHome size={18} />
                Go to dashboard
              </button>
            </>
          )}

          {status === 'failed' && (
            <>
              <button
                onClick={() => navigate('/wallet/fund')}
                className="w-full flex items-center justify-center gap-2 px-5 py-4 rounded-2xl bg-green-500 text-white font-bold text-sm hover:bg-green-400 transition-all"
              >
                Try again
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full flex items-center justify-center gap-2 px-5 py-4 rounded-2xl bg-white border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-all"
              >
                <MdHome size={18} />
                Go to dashboard
              </button>
            </>
          )}
        </motion.div>

        {/* ── Help note ─────────────────────────── */}
        <div className="flex items-start gap-2.5 p-4 bg-white rounded-2xl border border-slate-100">
          <MdErrorOutline size={15} className="text-slate-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-slate-400 leading-relaxed">
            {status === 'pending' &&
              'Payment confirmation can take up to 2 minutes after Nomba processes it. If your wallet is not credited after 5 minutes, contact support with your reference number.'}
            {status === 'success' &&
              'Your Waka Wallet has been credited. All transactions are secured and verified by Nomba.'}
            {status === 'failed' &&
              'Your payment was not completed. No money was deducted from your bank account. Try again or use a different card.'}
            {status === 'not_found' &&
              'Cannot locate this payment reference. It may have expired or the link may be incorrect.'}
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Pending state ────────────────────────────────────────
const PendingState = ({
  orderId,
  pollCount,
  maxPolls,
  isPolling,
}: {
  orderId?: string
  pollCount: number
  maxPolls: number
  isPolling: boolean
  onManualVerify: () => void
  verifying: boolean
}) => {
  const progress = Math.min(100, (pollCount / maxPolls) * 100)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-8 text-center"
    >
      {/* Animated waiting indicator */}
      <div className="relative w-24 h-24 mx-auto mb-6">
        <svg className="absolute inset-0 -rotate-90" width="96" height="96">
          <circle
            cx="48" cy="48" r="42"
            fill="none"
            stroke="#f1f5f9"
            strokeWidth="5"
          />
          <motion.circle
            cx="48" cy="48" r="42"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={264}
            strokeDashoffset={264 - (264 * progress / 100)}
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          >
            <MdHourglassEmpty size={28} className="text-amber-500" />
          </motion.div>
        </div>
      </div>

      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 border border-amber-200 mb-4">
        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
        <span className="text-amber-700 text-xs font-bold uppercase tracking-widest">
          Awaiting confirmation
        </span>
      </div>

      <h2 className="text-2xl font-black text-navy-900 mb-2">
        Processing payment
      </h2>
      <p className="text-slate-500 text-sm leading-relaxed mb-6 max-w-xs mx-auto">
        Waiting for Nomba to confirm your transaction.
        This usually takes 30–60 seconds.
      </p>

      {orderId && (
        <p className="text-xs text-slate-400 mb-4">
          Order ID: <span className="font-mono font-semibold text-slate-500">{orderId}</span>
        </p>
      )}

      {/* Polling indicator */}
      {isPolling && (
        <div className="mb-5">
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden max-w-xs mx-auto">
            <motion.div
              className="h-full bg-amber-400 rounded-full"
              style={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-2 font-medium">
            Checking automatically… ({pollCount}/{maxPolls})
          </p>
        </div>
      )}

      {/* What to do */}
      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-left">
        <p className="text-xs font-bold text-amber-700 uppercase tracking-widest mb-2">
          If you completed payment
        </p>
        <ul className="flex flex-col gap-1.5">
          {[
            'Stay on this page — it updates automatically',
            'Or tap "Check payment status" to force verify',
            'Keep your reference number safe',
          ].map((tip, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-amber-700">
              <span className="mt-0.5 text-amber-400 flex-shrink-0">•</span>
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  )
}

// ─── Success state ────────────────────────────────────────
const SuccessState = ({
  orderId,
  amount,
  walletBalance,
  userName,
}: {
  orderId?: string
  amount: number
  walletBalance?: number
  userName: string
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.97 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0 }}
    className="overflow-hidden"
  >
    {/* Green success header */}
    <div
      className="px-8 pt-10 pb-8 text-center"
      style={{
        background: 'linear-gradient(160deg, #064e24 0%, #0f2318 100%)'
      }}
    >
      {/* Animated checkmark */}
      <div className="relative w-24 h-24 mx-auto mb-5">
        {[1, 2].map(i => (
          <motion.div
            key={i}
            className="absolute inset-0 rounded-full border-2 border-green-400"
            initial={{ scale: 1, opacity: 0.6 }}
            animate={{ scale: 1.6 + i * 0.5, opacity: 0 }}
            transition={{
              duration: 2,
              delay: i * 0.4,
              repeat: Infinity,
              repeatDelay: 0.6,
            }}
          />
        ))}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 14, delay: 0.1 }}
          className="w-24 h-24 rounded-full bg-green-500 flex items-center justify-center"
        >
          <MdCheckCircle size={52} className="text-white" />
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <p className="text-green-400 text-xs font-bold uppercase tracking-widest mb-2">
          Payment successful
        </p>
        <p className="text-white font-black text-4xl mb-1">
          {amount > 0 ? formatCurrency(amount) : 'Confirmed'}
        </p>
        <p className="text-green-400/70 text-sm">
          Credited to Waka Wallet
        </p>
        {orderId && (
          <p className="text-green-400/50 text-xs mt-2 font-mono">
            Order {orderId}
          </p>
        )}
      </motion.div>
    </div>

    {/* Wallet balance strip */}
    {walletBalance !== undefined && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="bg-green-50 border-b border-green-100 px-8 py-4 flex items-center justify-between"
      >
        <div className="flex items-center gap-2.5">
          <MdAccountBalanceWallet size={18} className="text-green-600" />
          <p className="text-sm font-semibold text-green-700">New wallet balance</p>
        </div>
        <p className="text-lg font-black text-green-700">
          {formatCurrency(walletBalance)}
        </p>
      </motion.div>
    )}

    {/* Confirmation body */}
    <div className="px-8 py-6">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-bold text-navy-900">
          Hi {userName?.split(' ')[0] || 'there'} 👋
        </p>
        <div className="flex items-center gap-1.5">
          <MdSecurity size={13} className="text-green-500" />
          <span className="text-xs text-green-600 font-semibold">Verified</span>
        </div>
      </div>
      <p className="text-slate-500 text-sm leading-relaxed">
        Your Waka Wallet has been funded successfully.
        You can now rent devices at any campus kiosk station.
      </p>
    </div>
  </motion.div>
)

// ─── Failed state ─────────────────────────────────────────
const FailedState = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="overflow-hidden"
  >
    {/* Red failed header */}
    <div
      className="px-8 pt-10 pb-8 text-center"
      style={{
        background: 'linear-gradient(160deg, #450a0a 0%, #1c0505 100%)'
      }}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', damping: 14 }}
        className="w-24 h-24 rounded-full bg-red-500 flex items-center justify-center mx-auto mb-5"
      >
        <MdCancel size={52} className="text-white" />
      </motion.div>

      <p className="text-red-400 text-xs font-bold uppercase tracking-widest mb-2">
        Payment failed
      </p>
      <p className="text-white font-black text-2xl mb-1">
        Transaction not completed
      </p>
      <p className="text-red-400/70 text-sm">
        No money was deducted from your account
      </p>
    </div>

    <div className="px-8 py-6">
      <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-4">
        <p className="text-xs font-bold text-red-700 mb-2 uppercase tracking-widest">
          What happened
        </p>
        <ul className="flex flex-col gap-1.5">
          {[
            'The payment was declined or cancelled by your bank',
            'Your card may have insufficient funds',
            'The session may have expired',
          ].map((r, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-red-600">
              <span className="mt-0.5 flex-shrink-0">•</span>
              {r}
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
        <p className="text-xs font-bold text-slate-600 mb-2 uppercase tracking-widest">
          What to do next
        </p>
        <ul className="flex flex-col gap-1.5">
          {[
            'Try again with a different card',
            'Transfer directly to your Nomba virtual account instead',
            'Contact your bank if the problem persists',
          ].map((s, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-slate-500">
              <span className="mt-0.5 flex-shrink-0">•</span>
              {s}
            </li>
          ))}
        </ul>
      </div>
    </div>
  </motion.div>
)

// ─── Not found state ──────────────────────────────────────
const NotFoundState = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="p-10 text-center"
  >
    <MdErrorOutline size={52} className="text-slate-300 mx-auto mb-4" />
    <h2 className="text-xl font-black text-navy-900 mb-2">
      Reference not found
    </h2>
    <p className="text-slate-500 text-sm leading-relaxed max-w-xs mx-auto">
      No payment found with this reference. The link may have expired or the reference is incorrect.
    </p>
  </motion.div>
)

// ─── Loading screen ───────────────────────────────────────
const LoadingScreen = () => (
  <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
    <div className="w-12 h-12 border-3 border-slate-100 border-t-green-500 rounded-full animate-spin" />
    <p className="text-slate-400 text-sm font-medium">Loading payment details…</p>
  </div>
)