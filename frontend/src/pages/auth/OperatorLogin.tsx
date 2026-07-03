import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { MdEmail, MdLock, MdStore, MdArrowBack } from 'react-icons/md'
import { authApi } from '../../api/auth.api'
import { useToast } from '../../components/ui/Toast'
import { useAuth } from '../../context/AuthContext'
import { AuthField, authInput } from '../../components/auth/AuthShell'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})
type Form = z.infer<typeof schema>

export default function OperatorLogin() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { login } = useAuth()

  const { register, handleSubmit, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
  })

  const { mutate, isPending } = useMutation({
    mutationFn: (d: Form) => authApi.operatorLogin(d.email, d.password),
    onSuccess: (res: any) => {
      login(res.token, res.user)
      navigate('/operator/dashboard')
    },
    onError: (err: any) =>
      toast(err.response?.data?.message || 'Invalid credentials', 'error'),
  })

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'linear-gradient(160deg, #060b12 0%, #0b1420 100%)' }}
    >
      <div className="w-full max-w-md">
        {/* Back */}
        <button
          onClick={() => navigate('/login')}
          className="flex items-center gap-1.5 text-white/40 text-sm font-medium mb-8 hover:text-white/70 transition-colors"
        >
          <MdArrowBack size={16} />
          Back to student login
        </button>

        {/* Card */}
        <div className="bg-white rounded-3xl overflow-hidden shadow-2xl">
          {/* Card header */}
          <div className="bg-amber-500 px-8 pt-8 pb-6">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mb-4">
              <MdStore size={24} className="text-white" />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-amber-900/70 mb-1">
              Operator Portal
            </p>
            <h1 className="text-2xl font-black text-white">Station login</h1>
            <p className="text-amber-900/60 text-sm mt-1">
              Access your kiosk management dashboard
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
                  placeholder="operator@wakacharge.com"
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
                  placeholder="Your password"
                  className={authInput(!!errors.password)}
                  {...register('password')}
                />
              </AuthField>

              <button
                type="submit"
                disabled={isPending}
                className="w-full py-3.5 rounded-2xl bg-amber-500 text-white font-black text-sm mt-2 hover:bg-amber-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isPending ? 'Signing in…' : 'Log in to station'}
              </button>
            </form>

            <div className="mt-6 p-4 bg-amber-50 rounded-2xl border border-amber-100">
              <p className="text-amber-700 text-xs font-semibold leading-relaxed">
                🔐 Operator accounts are created by your station administrator.
                Contact your manager if you need access.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
