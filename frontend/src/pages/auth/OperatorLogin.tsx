import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  MdEmail,
  MdLock,
  MdStore,
  MdArrowBack,
  MdHelpOutline,
  MdSecurity,
} from 'react-icons/md'
import { authApi } from '../../api/auth.api'
import { useToast } from '../../components/ui/Toast'
import { useAuth } from '../../context/AuthContext'

const schema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(1, 'Password required'),
})
type Form = z.infer<typeof schema>

export default function OperatorLogin() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { login } = useAuth()

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors }
  } = useForm<Form>({
    resolver: zodResolver(schema),
  })

  const { mutate, isPending } = useMutation({
    mutationFn: (d: Form) => authApi.operatorLogin(d.email, d.password),
    onSuccess: (res: any) => {
      login(res.token, res.user)
      navigate('/operator/dashboard')
    },
    onError: (err: any) =>
      toast(
        err.response?.data?.message || 'Invalid credentials',
        'error'
      ),
  })

  // ── Separate navigate handler — NOT inside form ──────────
  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const email = getValues('email')
    navigate('/forgot-password', {
      state: { prefillEmail: email || '' }
    })
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{
        background: 'linear-gradient(160deg, #060b12 0%, #0b1420 100%)'
      }}
    >
      <div className="w-full max-w-md">

        {/* Back */}
        <button
          type="button"
          onClick={() => navigate('/login')}
          className="flex items-center gap-1.5 text-white/40 text-sm font-medium mb-8 hover:text-white/70 transition-colors"
        >
          <MdArrowBack size={16} />
          Back to student login
        </button>

        {/* Card */}
        <div className="bg-white rounded-3xl overflow-hidden shadow-2xl">

          {/* Amber header */}
          <div className="bg-amber-500 px-8 pt-8 pb-6">
            <div className="w-12 h-12 rounded-2xl bg-white/25 flex items-center justify-center mb-4">
              <MdStore size={24} className="text-white" />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-amber-900/60 mb-1">
              Operator Portal
            </p>
            <h1 className="text-2xl font-black text-white">Station login</h1>
            <p className="text-amber-900/60 text-sm mt-1">
              Access your kiosk management dashboard
            </p>
          </div>

          {/* Form body */}
          <div className="p-8">
            <form
              onSubmit={handleSubmit(d => mutate(d))}
              className="flex flex-col gap-4"
            >
              {/* Email */}
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
                    placeholder="operator@wakacharge.com"
                    className={`
                      w-full pl-10 pr-4 py-3.5 rounded-2xl text-sm font-medium
                      border-2 outline-none transition-all
                      text-navy-900 placeholder-slate-300
                      ${errors.email
                        ? 'border-red-400 bg-red-50'
                        : 'border-slate-200 bg-slate-50 focus:border-amber-400 focus:bg-white'
                      }
                    `}
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p className="text-red-500 text-xs font-medium">
                    ⚠ {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-navy-700">
                  Password
                </label>
                <div className="relative">
                  <MdLock
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                  <input
                    type="password"
                    autoComplete="current-password"
                    placeholder="Your password"
                    className={`
                      w-full pl-10 pr-4 py-3.5 rounded-2xl text-sm font-medium
                      border-2 outline-none transition-all
                      text-navy-900 placeholder-slate-300
                      ${errors.password
                        ? 'border-red-400 bg-red-50'
                        : 'border-slate-200 bg-slate-50 focus:border-amber-400 focus:bg-white'
                      }
                    `}
                    {...register('password')}
                  />
                </div>
                {errors.password && (
                  <p className="text-red-500 text-xs font-medium">
                    ⚠ {errors.password.message}
                  </p>
                )}
              </div>

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={isPending}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3.5 rounded-2xl bg-amber-500 text-white font-black text-sm hover:bg-amber-400 transition-all disabled:opacity-40 flex items-center justify-center gap-2 mt-1"
              >
                {isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in…
                  </>
                ) : (
                  'Log in to station'
                )}
              </motion.button>
            </form>
            {/* ─── END FORM ─── */}

            {/* ── Forgot password — completely outside the form ── */}
            <div className="flex justify-center mt-4">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="flex items-center gap-1.5 text-sm font-semibold text-amber-600 hover:text-amber-700 transition-colors"
              >
                <MdHelpOutline size={15} />
                Forgot your password?
              </button>
            </div>

         
            <p className="text-center mt-4">
                          <button
                            type="button"
                            onClick={() => navigate('/operator-register')}
                            className="text-sm text-amber-600 font-semibold hover:text-amber-700 transition-colors"
                          >
                            New operator? Apply here →
                          </button>
            </p>

            {/* Info note */}
            <div className="mt-5 flex items-start gap-2.5 p-3.5 bg-amber-50 rounded-2xl border border-amber-100">
              <MdSecurity
                size={15}
                className="text-amber-500 mt-0.5 flex-shrink-0"
              />
              <p className="text-amber-700 text-xs font-medium leading-relaxed">
                Operator accounts are created by your station administrator.
                Contact your manager if you need access.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}