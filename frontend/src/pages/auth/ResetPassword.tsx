import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MdLock,
  MdVisibility,
  MdVisibilityOff,
  MdCheckCircle,
  MdArrowBack,
  MdLockReset,
  MdShield,
  MdArrowForward
} from 'react-icons/md'
import { authApi } from '../../api/auth.api'
import { useToast } from '../../components/ui/Toast'

const schema = z.object({
  password: z
    .string()
    .min(6, 'At least 6 characters required')
    .regex(/[A-Z]/, 'Must include at least one uppercase letter')
    .regex(/[0-9]/, 'Must include at least one number'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

type Form = z.infer<typeof schema>

// ─── Password strength ───────────────────────────────────
const getStrength = (pw: string) => {
  const checks = {
    length:    pw.length >= 8,
    uppercase: /[A-Z]/.test(pw),
    number:    /[0-9]/.test(pw),
    special:   /[^a-zA-Z0-9]/.test(pw),
  }
  const score = Object.values(checks).filter(Boolean).length
  const levels = [
    { label: 'Too weak',  color: '#ef4444', bg: '#fef2f2' },
    { label: 'Weak',      color: '#f97316', bg: '#fff7ed' },
    { label: 'Fair',      color: '#f59e0b', bg: '#fffbeb' },
    { label: 'Good',      color: '#22c55e', bg: '#f0fdf4' },
    { label: 'Strong',    color: '#16a34a', bg: '#dcfce7' },
  ]
  return { score, checks, ...levels[score] }
}

export default function ResetPassword() {
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()

  const email = location.state?.email as string

  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [done, setDone] = useState(false)
  const [countdown, setCountdown] = useState(5)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<Form>({
    resolver: zodResolver(schema),
  })

  const password = watch('password', '')
  const confirmPassword = watch('confirmPassword', '')
  const strength = password ? getStrength(password) : null
  const passwordsMatch = password && confirmPassword && password === confirmPassword

  useEffect(() => {
    if (!email) navigate('/forgot-password')
  }, [])

  // Auto redirect countdown after success
  useEffect(() => {
    if (!done) return
    if (countdown <= 0) {
      navigate('/login')
      return
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [done, countdown])

  const { mutate, isPending } = useMutation({
    mutationFn: (d: Form) => authApi.resetPassword(email, d.password),
    onSuccess: () => {
      setDone(true)
    },
    onError: (err: any) =>
      toast(
        err.response?.data?.message || 'Could not reset password. Try again.',
        'error'
      ),
  })

  // ── Success screen ──────────────────────────────────────
  if (done) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 16 }}
          className="max-w-xs w-full"
        >
          {/* Success icon */}
          <div className="relative mx-auto w-24 h-24 mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', damping: 14 }}
              className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mx-auto"
            >
              <MdCheckCircle size={52} className="text-green-500" />
            </motion.div>
            {/* Ripple */}
            {[1, 2].map(i => (
              <motion.div
                key={i}
                className="absolute inset-0 rounded-full border-2 border-green-400"
                initial={{ scale: 1, opacity: 0.6 }}
                animate={{ scale: 1.8 + i * 0.4, opacity: 0 }}
                transition={{
                  duration: 1.5,
                  delay: i * 0.3,
                  repeat: Infinity,
                  repeatDelay: 0.5
                }}
              />
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-3xl font-black text-navy-900 mb-3">
              Password reset!
            </h1>
            <p className="text-slate-500 text-sm leading-relaxed mb-8">
              Your password has been changed successfully.
              You can now sign in with your new password.
            </p>

            {/* Countdown ring */}
            <div className="relative w-16 h-16 mx-auto mb-6">
              <svg className="absolute inset-0 -rotate-90" width="64" height="64">
                <circle
                  cx="32" cy="32" r="28"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="4"
                />
                <motion.circle
                  cx="32" cy="32" r="28"
                  fill="none"
                  stroke="#1db954"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={176}
                  initial={{ strokeDashoffset: 0 }}
                  animate={{ strokeDashoffset: 176 }}
                  transition={{ duration: 5, ease: 'linear' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-black text-navy-900 tabular-nums">
                  {countdown}
                </span>
              </div>
            </div>

            <p className="text-slate-400 text-sm mb-6">
              Redirecting to login in {countdown}s
            </p>

            <button
              onClick={() => navigate('/login')}
              className="w-full py-3.5 rounded-2xl bg-green-500 text-white font-black text-sm hover:bg-green-400 transition-all flex items-center justify-center gap-2 group"
            >
              Sign in now
              <MdArrowForward
                size={16}
                className="group-hover:translate-x-0.5 transition-transform"
              />
            </button>
          </motion.div>
        </motion.div>
      </div>
    )
  }

  // ── Form screen ─────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-12 pb-4">
        <button
          onClick={() => navigate('/reset-verify-otp', { state: { email } })}
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
          initial={{ width: '66%' }}
          animate={{ width: '100%' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-6 pt-10 pb-8 max-w-sm mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex-1"
        >
          {/* Icon */}
          <div className="w-14 h-14 rounded-3xl bg-green-50 border border-green-100 flex items-center justify-center mb-6">
            <MdLockReset size={28} className="text-green-600" />
          </div>

          <p className="text-xs font-bold uppercase tracking-widest text-green-600 mb-2">
            Step 3 of 3
          </p>
          <h1 className="text-2xl font-black text-navy-900 leading-tight mb-2">
            Create new password
          </h1>
          <p className="text-slate-500 text-sm leading-relaxed mb-7">
            Choose a strong password for your account.
            You'll use this to sign in going forward.
          </p>

          <form
            onSubmit={handleSubmit(d => mutate(d))}
            className="flex flex-col gap-5"
          >

            {/* New password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-navy-700">
                New password
              </label>
              <div className="relative">
                <MdLock
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <input
                  type={showPw ? 'text' : 'password'}
                  autoFocus
                  autoComplete="new-password"
                  placeholder="Min 6 chars, 1 uppercase, 1 number"
                  className={`
                    w-full pl-10 pr-12 py-3.5 rounded-2xl text-sm font-medium
                    border-2 outline-none transition-all
                    text-navy-900 placeholder-slate-300
                    ${errors.password
                      ? 'border-red-400 bg-red-50'
                      : password
                      ? 'border-green-400 bg-green-50/50'
                      : 'border-slate-200 bg-slate-50 focus:border-green-500 focus:bg-white'
                    }
                  `}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPw
                    ? <MdVisibilityOff size={18} />
                    : <MdVisibility size={18} />
                  }
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs font-medium flex items-center gap-1">
                  <span>⚠</span> {errors.password.message}
                </p>
              )}

              {/* Strength bar */}
              <AnimatePresence>
                {strength && password && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    {/* Bar */}
                    <div className="flex gap-1 mt-1 mb-2">
                      {[1, 2, 3, 4].map(i => (
                        <div
                          key={i}
                          className="flex-1 h-1.5 rounded-full transition-all duration-300"
                          style={{
                            background: i <= strength.score
                              ? strength.color
                              : '#e2e8f0'
                          }}
                        />
                      ))}
                    </div>

                    {/* Label */}
                    <div className="flex items-center justify-between mb-2">
                      <p
                        className="text-xs font-bold"
                        style={{ color: strength.color }}
                      >
                        {strength.label}
                      </p>
                      <p className="text-xs text-slate-400">
                        {strength.score}/4
                      </p>
                    </div>

                    {/* Checklist */}
                    <div
                      className="rounded-2xl p-3 grid grid-cols-2 gap-1.5"
                      style={{ background: strength.bg }}
                    >
                      {Object.entries({
                        '8+ characters': strength.checks.length,
                        'Uppercase letter': strength.checks.uppercase,
                        'Number (0–9)': strength.checks.number,
                        'Special character': strength.checks.special,
                      }).map(([label, passed]) => (
                        <div
                          key={label}
                          className="flex items-center gap-1.5"
                        >
                          <MdCheckCircle
                            size={12}
                            className="flex-shrink-0 transition-colors"
                            style={{ color: passed ? strength.color : '#d1d5db' }}
                          />
                          <p
                            className="text-[11px] font-medium transition-colors"
                            style={{ color: passed ? strength.color : '#9ca3af' }}
                          >
                            {label}
                          </p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Confirm password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-navy-700">
                Confirm new password
              </label>
              <div className="relative">
                <MdLock
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                  className={`
                    w-full pl-10 pr-12 py-3.5 rounded-2xl text-sm font-medium
                    border-2 outline-none transition-all
                    text-navy-900 placeholder-slate-300
                    ${errors.confirmPassword
                      ? 'border-red-400 bg-red-50'
                      : passwordsMatch
                      ? 'border-green-400 bg-green-50/50'
                      : 'border-slate-200 bg-slate-50 focus:border-green-500 focus:bg-white'
                    }
                  `}
                  {...register('confirmPassword')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showConfirm
                    ? <MdVisibilityOff size={18} />
                    : <MdVisibility size={18} />
                  }
                </button>

                {/* Match indicator */}
                <AnimatePresence>
                  {confirmPassword && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute right-10 top-1/2 -translate-y-1/2"
                    >
                      <MdCheckCircle
                        size={16}
                        className="transition-colors"
                        style={{
                          color: passwordsMatch ? '#22c55e' : '#d1d5db'
                        }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-xs font-medium flex items-center gap-1">
                  <span>⚠</span> {errors.confirmPassword.message}
                </p>
              )}
              {passwordsMatch && !errors.confirmPassword && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-green-600 text-xs font-medium flex items-center gap-1"
                >
                  <MdCheckCircle size={13} />
                  Passwords match
                </motion.p>
              )}
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={isPending || !passwordsMatch}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3.5 rounded-2xl bg-green-500 text-white font-black text-sm hover:bg-green-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-1"
            >
              {isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Resetting password…
                </>
              ) : (
                <>
                  <MdLockReset size={16} />
                  Reset password
                </>
              )}
            </motion.button>
          </form>

          {/* Security note */}
          <div className="flex items-start gap-2.5 mt-6 p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
            <MdShield size={15} className="text-slate-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-slate-400 leading-relaxed">
              After resetting, you'll be redirected to sign in with your new password.
              All active sessions will remain valid.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}