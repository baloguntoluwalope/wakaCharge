import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { HiLightningBolt, HiMail, HiLockClosed } from 'react-icons/hi'
import { authApi } from '../../api/auth.api'
import { Button } from '../../components/ui/Button'
import { useToast } from '../../components/ui/Toast'
import { useAuth } from '../../context/AuthContext'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

type FormData = z.infer<typeof schema>

export default function AdminLogin() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { login } = useAuth()

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema)
  })
  const { onBlur: emailOnBlur, ...emailRegister } = register('email')
  const { onBlur: passwordOnBlur, ...passwordRegister } = register('password')
  const { mutate, isPending } = useMutation({
    mutationFn: (data: FormData) => authApi.adminLogin(data.email, data.password),
    onSuccess: (res: any) => {
      login(res.token, res.user)
      navigate('/admin/dashboard')
    },
    onError: (err: any) => {
      toast(err.response?.data?.message || 'Invalid credentials', 'error')
    }
  })

  return (
    <div
      className="min-h-svh flex"
      style={{ background: 'linear-gradient(135deg, #f0f2f5 0%, #e8edf5 100%)' }}
    >
      {/* Left panel — branding */}
      <div
        className="hidden lg:flex flex-col justify-between w-2/5 p-12"
        style={{ background: 'linear-gradient(160deg, #0b1220 0%, #0f3460 100%)' }}
      >
        <div className="flex items-center gap-2">
          <HiLightningBolt className="text-amber-400" size={24} />
          <span className="text-white font-black text-xl tracking-tight">
            Waka<span className="text-amber-400">Charge</span>
          </span>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-4">
            Admin Console
          </p>
          <h2 className="text-4xl font-black text-white leading-tight mb-4">
            Platform<br />Management<br />Dashboard
          </h2>
          <p className="text-white/40 text-sm leading-relaxed">
            Monitor rentals, manage users, track revenue and oversee all campus operations from one place.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {[
            { label: 'Real-time rental monitoring' },
            { label: 'Revenue & reconciliation reports' },
            { label: 'Full payment audit trail' },
          ].map(f => (
            <div key={f.label} className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <p className="text-white/50 text-xs">{f.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12">
        <div className="max-w-sm mx-auto w-full">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <HiLightningBolt className="text-amber-500" size={22} />
            <span className="font-black text-xl tracking-tight" style={{ color: '#0b1220' }}>
              Waka<span className="text-amber-500">Charge</span>
            </span>
          </div>

          <div className="mb-8">
            <p className="text-xs font-bold uppercase tracking-widest text-amber-500 mb-2">
              Admin Console
            </p>
            <h1 className="text-3xl font-black mb-2" style={{ color: '#0b1220' }}>
              Sign in
            </h1>
            <p className="text-sm" style={{ color: '#64748b' }}>
              Platform management access only
            </p>
          </div>

          <form onSubmit={handleSubmit(d => mutate(d))} className="flex flex-col gap-5">

            {/* Email */}
            <div>
              <label
                className="text-sm font-bold mb-1.5 block"
                style={{ color: '#1e293b' }}
              >
                Email address
              </label>
              <div className="relative">
                <HiMail
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2"
                  style={{ color: '#94a3b8' }}
                />
                <input
                  type="email"
                  placeholder="admin@wakacharge.com"
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl text-sm outline-none transition-all"
                  style={{
                    background: '#ffffff',
                    border: errors.email ? '2px solid #ef4444' : '2px solid #e2e8f0',
                    color: '#0f172a',
                  }}
                  onFocus={e => {
                    if (!errors.email) e.target.style.border = '2px solid #f59e0b'
                  }}
                  onBlur={e => {
                    emailOnBlur(e)
                    if (!errors.email) e.target.style.border = '2px solid #e2e8f0'
                  }}
                  {...emailRegister}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-500 mt-1.5 font-medium">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                className="text-sm font-bold mb-1.5 block"
                style={{ color: '#1e293b' }}
              >
                Password
              </label>
              <div className="relative">
                <HiLockClosed
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2"
                  style={{ color: '#94a3b8' }}
                />
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl text-sm outline-none transition-all"
                  style={{
                    background: '#ffffff',
                    border: errors.password ? '2px solid #ef4444' : '2px solid #e2e8f0',
                    color: '#0f172a',
                  }}
                  onFocus={e => {
                    if (!errors.password) e.target.style.border = '2px solid #f59e0b'
                  }}
                  onBlur={e => {
                    passwordOnBlur(e)
                    if (!errors.password) e.target.style.border = '2px solid #e2e8f0'
                  }}
                  {...passwordRegister}
                />
              </div>
              {errors.password && (
                <p className="text-xs text-red-500 mt-1.5 font-medium">
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              variant="amber"
              size="lg"
              fullWidth
              loading={isPending}
              className="mt-2"
            >
              Enter console
            </Button>

          </form>

          <p className="text-xs text-center mt-8" style={{ color: '#94a3b8' }}>
            Not an admin?{' '}
            <button
              onClick={() => navigate('/')}
              className="font-bold hover:underline"
              style={{ color: '#f59e0b' }}
            >
              Go to student app
            </button>
          </p>

        </div>
      </div>
    </div>
  )
}