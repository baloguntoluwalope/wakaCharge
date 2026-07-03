import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  MdEmail, MdRefresh, MdCheckCircle, MdArrowBack
} from 'react-icons/md'
import { authApi } from '../../api/auth.api'
import { useToast } from '../../components/ui/Toast'
import { maskEmail } from '../../utils'
// Add to top of EmailEntry, VerifyOTP, CompleteProfile:
import {
  AuthShell,
  AuthField,
  AuthButton,
  SecurityNote,
  AuthFooter,
  authInput
} from '../../components/auth/AuthShell'


export default function VerifyOTP() {
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()

  const email = location.state?.email as string
  const type = (location.state?.type || 'registration') as string

  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [cooldown, setCooldown] = useState(60)
  const [error, setError] = useState('')
  const refs = Array.from({ length: 6 }, () => useRef<HTMLInputElement>(null))

  useEffect(() => {
    if (!email) navigate('/register')
    refs[0].current?.focus()
  }, [])

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  const { mutate: verify, isPending } = useMutation({
    mutationFn: () => authApi.verifyOTP(email, otp.join('')),
    onSuccess: () => {
      if (type === 'registration') {
        navigate('/complete-profile', { state: { email } })
      }
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Invalid code. Please try again.')
      setOtp(['', '', '', '', '', ''])
      refs[0].current?.focus()
    },
  })

  const { mutate: resend, isPending: resending } = useMutation({
    mutationFn: () => authApi.resendOTP(email, type),
    onSuccess: () => {
      setCooldown(60)
      setOtp(['', '', '', '', '', ''])
      setError('')
      toast('New code sent to your email', 'success')
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
      // Auto-submit on last digit
      const code = [...next].join('')
      if (code.length === 6) setTimeout(() => verify(), 100)
    }
  }

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      refs[i - 1].current?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      const arr = pasted.split('')
      setOtp(arr)
      refs[5].current?.focus()
      setTimeout(() => verify(), 100)
    }
  }

  return (
    <AuthShell
      step={2}
      title="Check your email"
      subtitle={`We sent a 6-digit code to ${maskEmail(email || '')}`}
    >
      {/* Email pill */}
      <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 mb-6">
        <div className="w-8 h-8 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
          <MdEmail size={16} className="text-green-600" />
        </div>
        <div>
          <p className="text-xs text-slate-400 font-medium">Code sent to</p>
          <p className="text-sm font-bold text-navy-900">{email}</p>
        </div>
      </div>

      {/* OTP boxes */}
      <div className="flex gap-2.5 justify-center mb-4" onPaste={handlePaste}>
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
            whileFocus={{ scale: 1.05 }}
            className={`
              w-12 h-14 text-center text-xl font-black rounded-2xl
              border-2 transition-all duration-150 outline-none
              ${error
                ? 'border-red-400 bg-red-50 text-red-600'
                : d
                ? 'border-green-500 bg-green-50 text-navy-900'
                : 'border-slate-200 bg-white text-navy-900 focus:border-green-400 focus:bg-green-50/50'
              }
            `}
          />
        ))}
      </div>

      {/* Error */}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-500 text-sm font-medium text-center mb-4"
        >
          {error}
        </motion.p>
      )}

      {/* Verify button */}
      <AuthButton
        loading={isPending}
        disabled={otp.join('').length !== 6}
        onClick={() => verify()}
      >
        {isPending ? 'Verifying…' : 'Verify code'}
      </AuthButton>

      {/* Resend */}
      <div className="flex items-center justify-center mt-5">
        {cooldown > 0 ? (
          <p className="text-sm text-slate-400">
            Resend code in{' '}
            <span className="font-bold text-navy-700 tabular-nums">{cooldown}s</span>
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

      <SecurityNote text="Code expires in 5 minutes. Never share it with anyone." />
    </AuthShell>
  )
}

// Fix: useRef needs to be imported
import { useRef } from 'react'