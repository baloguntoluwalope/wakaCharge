import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  MdEmail,
  MdLock,
  MdArrowForward,
  MdStore,
  MdAdminPanelSettings,
  MdHelpOutline,
} from 'react-icons/md'
import { authApi } from '../../api/auth.api'
import { useToast } from '../../components/ui/Toast'
import { useAuth } from '../../context/AuthContext'

const schema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(1, 'Password required'),
})
type Form = z.infer<typeof schema>

export default function Login() {
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
    mutationFn: (d: Form) => authApi.login(d.email, d.password),
    onSuccess: (res: any) => {
      login(res.token, res.user)
      navigate('/dashboard')
    },
    onError: (err: any) =>
      toast(
        err.response?.data?.message || 'Invalid email or password',
        'error'
      ),
  })

  // ── Separate handler for forgot password ────────────────
  // NOT inside the form — prevents any form submission
  const handleForgotPassword = () => {
    const email = getValues('email')
    navigate('/forgot-password', {
      state: { prefillEmail: email || '' }
    })
  }

  const onSubmit = (d: Form) => mutate(d)

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row">

      {/* ── Left brand panel (desktop only) ─────── */}
      <div
        className="hidden lg:flex flex-col justify-between w-2/5 xl:w-1/2 px-12 xl:px-16 py-12"
        style={{
          background: 'linear-gradient(160deg, #060b12 0%, #0b1420 60%, #0f2318 100%)'
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-green-500 flex items-center justify-center">
            <span className="text-white font-black text-base">W</span>
          </div>
          <span className="font-black text-white text-xl tracking-tight">
            Waka<span className="text-green-400">Charge</span>
          </span>
        </div>

        <div>
          <p className="text-5xl font-black text-white leading-tight mb-6">
            Power to learn.<br />
            <span className="text-green-400">Credit to grow.</span>
          </p>
          <p className="text-white/40 text-base leading-relaxed max-w-sm mb-10">
            Every return builds your trust score. Reach 10 successful rentals
            and unlock Rent Now, Pay Later — your campus credit line.
          </p>
          <div className="grid grid-cols-3 gap-4 pt-10 border-t border-white/10">
            {[
              { n: '10+', label: 'Campuses' },
              { n: '₦300', label: 'From per session' },
              { n: '100%', label: 'Deposit refunded' },
            ].map(s => (
              <div key={s.label}>
                <p className="text-2xl font-black text-white">{s.n}</p>
                <p className="text-xs text-white/40 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-white/20 text-xs">
          © 2026 Waka Charge · Powered by Nomba
        </p>
      </div>

      {/* ── Right form panel ─────────────────────── */}
      <div className="flex-1 flex flex-col justify-center px-6 py-10 lg:px-12 xl:px-20">

        {/* Mobile logo */}
        <div className="flex items-center gap-2 mb-10 lg:hidden">
          <div className="w-9 h-9 rounded-xl bg-green-500 flex items-center justify-center">
            <span className="text-white font-black text-sm">W</span>
          </div>
          <span className="font-black text-navy-900 text-lg">
            Waka<span className="text-green-500">Charge</span>
          </span>
        </div>

        <div className="max-w-sm w-full mx-auto lg:mx-0">
          <div className="mb-8">
            <p className="text-xs font-bold uppercase tracking-widest text-green-600 mb-2">
              Student portal
            </p>
            <h1 className="text-3xl font-black text-navy-900 mb-1.5">
              Welcome back
            </h1>
            <p className="text-slate-500 text-sm">
              Sign in to your student account
            </p>
          </div>

          {/* ─── FORM ──────────────────────────────── */}
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">

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
                <p className="text-red-500 text-xs font-medium">
                  ⚠ {errors.email.message}
                </p>
              )}
            </div>

            {/* Password row with forgot link */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-navy-700">
                  Password
                </label>
              </div>
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
                      : 'border-slate-200 bg-slate-50 focus:border-green-500 focus:bg-white'
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

            {/* ── Forgot password — OUTSIDE form controls, uses navigate directly ── */}
            <div className="flex justify-end -mt-1">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleForgotPassword()
                }}
                className="flex items-center gap-1 text-xs font-semibold text-green-600 hover:text-green-700 transition-colors"
              >
                <MdHelpOutline size={13} />
                Forgot password?
              </button>
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={isPending}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3.5 rounded-2xl bg-green-500 text-white font-black text-sm hover:bg-green-400 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </>
              ) : (
                'Sign in to account'
              )}
            </motion.button>
          </form>
          {/* ─── END FORM ───────────────────────────── */}

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs text-slate-400 font-medium">
                other portals
              </span>
            </div>
          </div>

          {/* Portal links */}
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => navigate('/operator-login')}
              className="w-full flex items-center justify-between px-4 py-3 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all"
            >
              <span className="flex items-center gap-2.5">
                <MdStore size={18} className="text-amber-500" />
                Operator login
              </span>
              <MdArrowForward size={16} className="text-slate-300" />
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin-login')}
              className="w-full flex items-center justify-between px-4 py-3 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all"
            >
              <span className="flex items-center gap-2.5">
                <MdAdminPanelSettings size={18} className="text-purple-500" />
                Admin console
              </span>
              <MdArrowForward size={16} className="text-slate-300" />
            </button>
          </div>

          <p className="text-sm text-slate-500 text-center mt-6">
            New to Waka?{' '}
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="font-semibold text-green-600 hover:text-green-700 transition-colors"
            >
              Create an account
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}