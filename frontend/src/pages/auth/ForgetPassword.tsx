import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  MdEmail,
  MdLockReset,
  MdArrowBack,
  MdShield,
  MdCheckCircle
} from 'react-icons/md'
import { authApi } from '../../api/auth.api'
import { useToast } from '../../components/ui/Toast'

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
})
type Form = z.infer<typeof schema>

export default function ForgotPassword() {
  const navigate = useNavigate()
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<Form>({
    resolver: zodResolver(schema),
  })

  const email = watch('email', '')

  const { mutate, isPending, isSuccess } = useMutation({
    mutationFn: (d: Form) => authApi.resendOTP(d.email, 'reset'),
    onSuccess: (_, variables) => {
      navigate('/reset-verify-otp', {
        state: { email: variables.email }
      })
    },
    onError: (err: any) =>
      toast(
        err.response?.data?.message || 'Could not send reset code',
        'error'
      ),
  })

  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-12 pb-4">
        <button
          onClick={() => navigate('/login')}
          className="flex items-center gap-1.5 text-slate-500 text-sm font-medium hover:text-navy-900 transition-colors"
        >
          <MdArrowBack size={18} />
          Back to login
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
          initial={{ width: 0 }}
          animate={{ width: '33%' }}
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
            Step 1 of 3
          </p>
          <h1 className="text-2xl font-black text-navy-900 leading-tight mb-2">
            Reset your password
          </h1>
          <p className="text-slate-500 text-sm leading-relaxed mb-8">
            Enter the email address on your Waka Charge account.
            We'll send a 6-digit verification code.
          </p>

          <form
            onSubmit={handleSubmit(d => mutate(d))}
            className="flex flex-col gap-5"
          >
            {/* Email field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-navy-700">
                Email address
              </label>
              <div className="relative">
                <MdEmail
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <input
                  type="email"
                  autoFocus
                  autoComplete="email"
                  placeholder="you@lasu.edu.ng"
                  className={`
                    w-full pl-10 pr-4 py-3.5 rounded-2xl text-sm font-medium
                    border-2 outline-none transition-all
                    text-navy-900 placeholder-slate-300
                    ${errors.email
                      ? 'border-red-400 bg-red-50'
                      : 'border-slate-200 bg-slate-50 focus:border-green-500 focus:bg-white'
                    }
                  `}
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-xs font-medium flex items-center gap-1">
                  <span>⚠</span> {errors.email.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={isPending}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3.5 rounded-2xl bg-green-500 text-white font-black text-sm hover:bg-green-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending code…
                </>
              ) : (
                'Send reset code'
              )}
            </motion.button>
          </form>

          {/* Info cards */}
          <div className="flex flex-col gap-3 mt-6">
            <div className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
              <MdCheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-slate-500 leading-relaxed">
                The code expires in <strong className="text-navy-700">5 minutes</strong>.
                Check your spam folder if you don't see it.
              </p>
            </div>
            <div className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
              <MdShield size={16} className="text-slate-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-slate-500 leading-relaxed">
                Never share your reset code with anyone.
                Waka Charge will never ask for it.
              </p>
            </div>
          </div>

          {/* Footer */}
          <p className="text-sm text-slate-500 text-center mt-8">
            Remembered it?{' '}
            <button
              onClick={() => navigate('/login')}
              className="font-semibold text-green-600 hover:text-green-700 transition-colors"
            >
              Back to sign in
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  )
}