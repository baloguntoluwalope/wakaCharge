import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import {
  MdEmail, MdLock, MdAdminPanelSettings,
  MdArrowBack, MdSecurity
} from 'react-icons/md'
import { authApi } from '../../api/auth.api'
import { useToast } from '../../components/ui/Toast'
import { useAuth } from '../../context/AuthContext'
import { AuthField, authInput } from '../../components/auth/AuthShell'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})
type Form = z.infer<typeof schema>

export default function AdminLogin() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { login } = useAuth()

  const { register, handleSubmit, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
  })

  const { mutate, isPending } = useMutation({
    mutationFn: (d: Form) => authApi.adminLogin(d.email, d.password),
    onSuccess: (res: any) => {
      login(res.token, res.user)
      navigate('/admin/dashboard')
    },
    onError: (err: any) =>
      toast(err.response?.data?.message || 'Access denied', 'error'),
  })

  return (
    <div
      className="min-h-screen w-full flex"
      style={{
        background: 'linear-gradient(160deg, #060b12 0%, #0b1420 50%, #0f1a0b 100%)'
      }}
    >
      {/* ── Left info panel ─────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 xl:w-3/5 px-14 py-12">
        <div className="flex items-center gap-3">
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

        <div>
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
              { icon: <MdAdminPanelSettings size={18} />, text: 'Real-time reconciliation reports' },
              { icon: <MdSecurity size={18} />, text: 'Trust score and RNPL oversight across all campuses' },
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

        <p className="text-white/20 text-xs">
          © 2026 Waka Charge · Restricted access · Authorized personnel only
        </p>
      </div>

      {/* ── Right login panel ───────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Back */}
          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-1.5 text-white/30 text-sm font-medium mb-8 hover:text-white/60 transition-colors lg:hidden"
          >
            <MdArrowBack size={16} />
            Back
          </button>

          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            {/* Header stripe */}
            <div className="bg-navy-900 px-8 pt-8 pb-6 border-b border-white/10"
              style={{ background: 'linear-gradient(135deg, #0b1420, #1a2f45)' }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                  <MdAdminPanelSettings size={22} className="text-amber-400" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400/70 mb-0.5">
                    Admin Console
                  </p>
                  <p className="text-white font-black text-lg leading-none">Sign in</p>
                </div>
              </div>
              <p className="text-white/40 text-sm">
                Platform management access only. All actions are logged.
              </p>
            </div>

            {/* Form */}
            <div className="p-8">
              <form onSubmit={handleSubmit(d => mutate(d))} className="flex flex-col gap-4">
                <AuthField
                  label="Email address"
                  icon={<MdEmail size={18} />}
                  error={errors.email?.message}
                >
                  <input
                    type="email"
                    autoFocus
                    autoComplete="email"
                    placeholder="admin@wakacharge.com"
                    className={authInput(!!errors.email)}
                    {...register('email')}
                  />
                </AuthField>

                <AuthField
                  label="Password"
                  icon={<MdLock size={18} />}
                  error={errors.password?.message}
                >
                  <input
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className={authInput(!!errors.password)}
                    {...register('password')}
                  />
                </AuthField>

                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full py-3.5 rounded-2xl bg-navy-900 text-white font-black text-sm mt-2 hover:bg-navy-800 transition-all disabled:opacity-40"
                >
                  {isPending ? 'Verifying access…' : 'Enter console'}
                </button>
              </form>

              <div className="mt-6 flex items-start gap-2.5 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <MdSecurity size={15} className="text-slate-400 mt-0.5 flex-shrink-0" />
                <p className="text-slate-400 text-xs leading-relaxed">
                  This portal is restricted to authorized administrators.
                  All sessions are monitored and logged.
                </p>
              </div>

              <p className="text-center mt-5">
                <button
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