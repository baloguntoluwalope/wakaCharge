import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  MdEmail,
  MdLock,
  MdAdminPanelSettings,
  MdArrowBack,
  MdHelpOutline,
  MdSecurity,
  MdBarChart,
  MdPeople,
  MdArrowForward,
  MdVerifiedUser,
} from 'react-icons/md'
import { authApi } from '../../api/auth.api'
import { useToast } from '../../components/ui/Toast'
import { useAuth } from '../../context/AuthContext'

const schema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(1, 'Password required'),
})
type Form = z.infer<typeof schema>

export default function AdminLogin() {
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
    mutationFn: (d: Form) => authApi.adminLogin(d.email, d.password),
    onSuccess: (res: any) => {
      login(res.token, res.user)
      navigate('/admin/dashboard')
    },
    onError: (err: any) =>
      toast(
        err.response?.data?.message || 'Access denied',
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
      className="min-h-screen w-full flex"
      style={{
        background: 'linear-gradient(160deg, #060b12 0%, #0b1420 50%, #0f1a0b 100%)'
      }}
    >

      {/* ── Left info panel (desktop) ────────────── */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 xl:w-3/5 px-14 py-12 relative overflow-hidden">
        {/* Decorative glow */}
        <div
          className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #1db954, transparent)', transform: 'translate(30%, -30%)' }}
        />
        <div
          className="absolute bottom-0 left-0 w-72 h-72 rounded-full opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #f59e0b, transparent)', transform: 'translate(-30%, 30%)' }}
        />

        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-green-500 flex items-center justify-center">
            <span className="text-white font-black text-base">W</span>
          </div>
          <span className="font-black text-white text-xl">
            Waka<span className="text-green-400">Charge</span>
          </span>
          <div className="ml-2 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/25">
            <span className="text-amber-400 text-[10px] font-bold uppercase tracking-widest">
              Admin
            </span>
          </div>
        </div>

        <div className="relative">
          <p className="text-xs font-bold uppercase tracking-widest text-green-400 mb-5">
            Platform management
          </p>
          <h1 className="text-5xl xl:text-6xl font-black text-white leading-[1.05] mb-6">
            Full platform<br />
            <span className="text-green-400">control.</span>
          </h1>
          <p className="text-white/40 text-lg leading-relaxed max-w-md mb-10">
            Revenue analytics, reconciliation reports, audit trails,
            user management and kiosk oversight — all in one console.
          </p>
          <div className="flex flex-col gap-3">
            {[
              { icon: <MdSecurity size={18} />, text: 'Full payment audit trail with HMAC verification' },
              { icon: <MdBarChart size={18} />, text: 'Real-time reconciliation and revenue reports' },
              { icon: <MdPeople size={18} />, text: 'Trust score and RNPL oversight across all campuses' },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-green-400 flex-shrink-0">
                  {f.icon}
                </div>
                <p className="text-white/50 text-sm">{f.text}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-white/20 text-xs">
          © 2026 Waka Charge · Restricted access · All sessions monitored
        </p>
      </div>

      {/* ── Right login panel ───────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">

          {/* Mobile back */}
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="flex items-center gap-1.5 text-white/40 text-sm font-medium mb-8 hover:text-white/60 transition-colors lg:hidden"
          >
            <MdArrowBack size={16} />
            Back
          </button>

          {/* Card */}
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">

            {/* Dark header */}
            <div
              className="relative px-8 pt-8 pb-7 overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #0b1420, #16283d)' }}
            >
              <div
                className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-20 pointer-events-none"
                style={{ background: 'radial-gradient(circle, #f59e0b, transparent)', transform: 'translate(30%, -40%)' }}
              />
              <div className="relative flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                  <MdAdminPanelSettings size={22} className="text-amber-400" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400/70 mb-0.5">
                    Admin Console
                  </p>
                  <p className="text-white font-black text-lg leading-none">
                    Sign in
                  </p>
                </div>
              </div>
              <div className="relative flex items-center gap-1.5">
                <MdVerifiedUser size={13} className="text-white/30" />
                <p className="text-white/40 text-xs">
                  Platform management access only. All actions are logged.
                </p>
              </div>
            </div>

            {/* Form */}
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
                      placeholder="admin@wakacharge.com"
                      className={`
                        w-full pl-10 pr-4 py-3.5 rounded-2xl text-sm font-medium
                        border-2 outline-none transition-all
                        text-navy-900 placeholder-slate-300
                        ${errors.email
                          ? 'border-red-400 bg-red-50'
                          : 'border-slate-200 bg-slate-50 focus:border-[#0b1420] focus:bg-white'
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
                      placeholder="••••••••"
                      className={`
                        w-full pl-10 pr-4 py-3.5 rounded-2xl text-sm font-medium
                        border-2 outline-none transition-all
                        text-navy-900 placeholder-slate-300
                        ${errors.password
                          ? 'border-red-400 bg-red-50'
                          : 'border-slate-200 bg-slate-50 focus:border-[#0b1420] focus:bg-white'
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

                {/* Submit — explicit gradient, guaranteed visible */}
                <motion.button
                  type="submit"
                  disabled={isPending}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3.5 rounded-2xl text-white font-black text-sm transition-all disabled:opacity-40 flex items-center justify-center gap-2 mt-1 shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #0b1420, #1a2f45)' }}
                >
                  {isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Verifying access…
                    </>
                  ) : (
                    <>
                      Enter console
                      <MdArrowForward size={16} />
                    </>
                  )}
                </motion.button>
              </form>
              {/* ─── END FORM ─── */}

              {/* ── Forgot password — completely outside the form ── */}
              <div className="flex justify-center mt-4">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-navy-700 transition-colors"
                >
                  <MdHelpOutline size={15} />
                  Forgot your password?
                </button>
              </div>

              {/* Security note */}
              <div className="mt-5 flex items-start gap-2.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <MdSecurity
                  size={15}
                  className="text-slate-400 mt-0.5 flex-shrink-0"
                />
                <p className="text-slate-400 text-xs leading-relaxed">
                  This portal is restricted to authorized administrators.
                  All login attempts and actions are monitored and logged.
                </p>
              </div>

              <p className="text-center mt-5">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
                >
                  ← Go to student app
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}