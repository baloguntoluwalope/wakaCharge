import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MdEmail,
  MdRefresh,
  MdArrowBack,
  MdLockReset,
  MdShield
} from 'react-icons/md'
import { authApi } from '../../api/auth.api'
import { useToast } from '../../components/ui/Toast'
import { maskEmail } from '../../utils'

export default function ResetVerifyOTP() {
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()

  const email = location.state?.email as string

  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [cooldown, setCooldown] = useState(60)
  const [error, setError] = useState('')

  const refs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ]

  useEffect(() => {
    if (!email) navigate('/forgot-password')
    refs[0].current?.focus()
  }, [])

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  const { mutate: verify, isPending } = useMutation({
    mutationFn: () =>
      authApi.verifyResetOTP(email, otp.join('')),
    onSuccess: () => {
      navigate('/reset-password', { state: { email } })
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Invalid code. Please try again.')
      setOtp(['', '', '', '', '', ''])
      setTimeout(() => refs[0].current?.focus(), 50)
    },
  })

  const { mutate: resend, isPending: resending } = useMutation({
    mutationFn: () => authApi.resendOTP(email, 'reset'),
    onSuccess: () => {
      setCooldown(60)
      setOtp(['', '', '', '', '', ''])
      setError('')
      toast('New reset code sent to your email', 'success')
      setTimeout(() => refs[0].current?.focus(), 50)
    },
    onError: (err: any) =>
      toast(err.response?.data?.message || 'Could not resend', 'error'),
  })

  const handleChange = (i: number, val: string) => {
    const clean = val.replace(/\D/g, '').slice(-1)
    const next = [...otp]
    next[i] = clean
    setOtp(next)
    setError('')
    if (clean && i < 5) refs[i + 1].current?.focus()
    if (i === 5 && clean) {
      const code = next.join('')
      if (code.length === 6) setTimeout(() => verify(), 100)
    }
  }

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace') {
      if (!otp[i] && i > 0) {
        const next = [...otp]
        next[i - 1] = ''
        setOtp(next)
        refs[i - 1].current?.focus()
      } else {
        const next = [...otp]
        next[i] = ''
        setOtp(next)
      }
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, 6)
    if (pasted.length === 6) {
      setOtp(pasted.split(''))
      refs[5].current?.focus()
      setTimeout(() => verify(), 100)
    }
  }

  const filled = otp.join('').length
  const allFilled = filled === 6

  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-12 pb-4">
        <button
          onClick={() => navigate('/forgot-password')}
          className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors"
        >
          <MdArrowBack size={18} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-green-500 flex items-center justify-center">
            <span className="text-white font-black text-xs">W</span>
          </div>
          <span className="font-black text-navy-900 text-sm">
            Waka<span className="text-green-500">Charge</span>
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 bg-slate-100 mx-5 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-green-500 rounded-full"
          initial={{ width: '33%' }}
          animate={{ width: '66%' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-6 pt-10 pb-8 max-w-sm mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Icon */}
          <div className="w-14 h-14 rounded-3xl bg-green-50 border border-green-100 flex items-center justify-center mb-6">
            <MdEmail size={28} className="text-green-600" />
          </div>

          <p className="text-xs font-bold uppercase tracking-widest text-green-600 mb-2">
            Step 2 of 3
          </p>
          <h1 className="text-2xl font-black text-navy-900 leading-tight mb-2">
            Enter reset code
          </h1>
          <p className="text-slate-500 text-sm leading-relaxed mb-6">
            We sent a 6-digit code to
          </p>

          {/* Email display */}
          <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 mb-6">
            <div className="w-8 h-8 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
              <MdEmail size={15} className="text-green-600" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-medium">Reset code sent to</p>
              <p className="text-sm font-bold text-navy-900">{email}</p>
            </div>
          </div>

          {/* OTP digits */}
          <div
            className="flex gap-2.5 justify-center mb-5"
            onPaste={handlePaste}
          >
            {otp.map((d, i) => (
              <motion.input
                key={i}
                ref={refs[i]}
                value={d}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                maxLength={1}
                inputMode="numeric"
                autoComplete="one-time-code"
                whileFocus={{ scale: 1.06 }}
                className={`
                  w-12 h-14 text-center text-xl font-black rounded-2xl
                  border-2 transition-all duration-150 outline-none
                  ${error
                    ? 'border-red-400 bg-red-50 text-red-600'
                    : d
                    ? 'border-green-500 bg-green-50 text-navy-900'
                    : 'border-slate-200 bg-white text-navy-900 focus:border-green-400'
                  }
                `}
              />
            ))}
          </div>

          {/* Progress dots under OTP */}
          <div className="flex justify-center gap-1.5 mb-4">
            {otp.map((d, i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full transition-all duration-200"
                style={{
                  background: d ? '#1db954' : error ? '#ef4444' : '#e2e8f0',
                  transform: d ? 'scale(1.2)' : 'scale(1)'
                }}
              />
            ))}
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 mb-4 flex items-center gap-2"
              >
                <span className="text-red-500 text-xs">⚠</span>
                <p className="text-red-600 text-sm font-medium">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Verify button */}
          <motion.button
            type="button"
            disabled={!allFilled || isPending}
            whileTap={{ scale: 0.98 }}
            onClick={() => verify()}
            className="w-full py-3.5 rounded-2xl bg-green-500 text-white font-black text-sm hover:bg-green-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-5"
          >
            {isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Verifying…
              </>
            ) : (
              `Verify code ${allFilled ? '' : `(${6 - filled} left)`}`
            )}
          </motion.button>

          {/* Resend */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {cooldown > 0 ? (
              <p className="text-sm text-slate-400">
                Resend in{' '}
                <span className="font-bold text-navy-700 tabular-nums w-6 inline-block">
                  {cooldown}s
                </span>
              </p>
            ) : (
              <button
                onClick={() => resend()}
                disabled={resending}
                className="flex items-center gap-1.5 text-sm font-semibold text-green-600 hover:text-green-700 transition-colors"
              >
                <MdRefresh size={16} className={resending ? 'animate-spin' : ''} />
                {resending ? 'Sending…' : 'Resend code'}
              </button>
            )}
          </div>

          {/* Security note */}
          <div className="flex items-center justify-center gap-1.5">
            <MdShield size={13} className="text-slate-300" />
            <p className="text-xs text-slate-400">
              Code expires in 5 minutes. Never share it.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}