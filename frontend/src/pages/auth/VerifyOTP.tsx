import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { authApi } from '../../api/auth.api'
import { OTPInput } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { useToast } from '../../components/ui/Toast'
import { maskEmail } from '../../utils'

export default function VerifyOTP() {
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()

  const email = location.state?.email as string
  const type = (location.state?.type || 'registration') as string

  const [otp, setOtp] = useState('')
  const [cooldown, setCooldown] = useState(60)
  const [otpError, setOtpError] = useState('')

  useEffect(() => {
    if (!email) navigate('/register')
  }, [email, navigate])

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  const { mutate: verify, isPending } = useMutation({
    mutationFn: () => {
      if (type === 'registration') return authApi.verifyOTP(email, otp)
      return authApi.verifyOTP(email, otp)
    },
    onSuccess: () => {
      if (type === 'registration') {
        navigate('/complete-profile', { state: { email } })
      } else {
        // For login OTP (if implemented)
        navigate('/complete-profile', { state: { email } })
      }
    },
    onError: (err: any) => {
      setOtpError(err.response?.data?.message || 'Invalid code')
    }
  })

  const { mutate: resend, isPending: resending } = useMutation({
    mutationFn: () => authApi.resendOTP(email, type),
    onSuccess: () => {
      setCooldown(60)
      setOtp('')
      setOtpError('')
      toast('New code sent to your email', 'success')
    },
    onError: (err: any) => {
      toast(err.response?.data?.message || 'Could not resend', 'error')
    }
  })

  const handleVerify = () => {
    if (otp.length !== 6) { setOtpError('Enter all 6 digits'); return }
    setOtpError('')
    verify()
  }

  useEffect(() => {
    if (otp.length === 6) {
      setOtpError('')
      verify()
    }
  }, [otp])

  return (
    <div className="min-h-svh bg-white flex flex-col">
      <div className="px-6 pt-16 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-2xl bg-slate-100 flex items-center justify-center text-navy-700 mb-8"
          >
            ←
          </button>
          <p className="text-xs font-bold uppercase tracking-widest text-green-600 mb-2">
            Step 2 of 3
          </p>
          <h1 className="text-3xl font-black text-navy-900 leading-tight mb-3">
            Enter your code
          </h1>
          <p className="text-slate-500 text-sm">
            Sent to <strong className="text-navy-800">{maskEmail(email || '')}</strong>
          </p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="flex-1 px-6 flex flex-col gap-8"
      >
        <OTPInput
          length={6}
          value={otp}
          onChange={setOtp}
          error={otpError}
        />

        <Button
          variant="primary"
          size="lg"
          fullWidth
          loading={isPending}
          onClick={handleVerify}
        >
          Verify code
        </Button>

        <div className="text-center">
          {cooldown > 0 ? (
            <p className="text-sm text-slate-400">
              Resend code in <span className="font-semibold text-navy-700">{cooldown}s</span>
            </p>
          ) : (
            <button
              onClick={() => resend()}
              disabled={resending}
              className="text-sm font-semibold text-green-600 hover:text-green-700"
            >
              {resending ? 'Sending…' : 'Resend code'}
            </button>
          )}
        </div>

        <div className="bg-slate-50 rounded-2xl p-4">
          <p className="text-xs text-slate-400 text-center">
            Check your spam folder if you don't see it within a minute.
            The code expires in 5 minutes.
          </p>
        </div>
      </motion.div>
    </div>
  )
}