import { useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import {
  MdPerson, MdPhone, MdLock, MdSchool,
  MdBadge, MdCheckCircle
} from 'react-icons/md'
import { authApi } from '../../api/auth.api'
import { useToast } from '../../components/ui/Toast'
import { useAuth } from '../../context/AuthContext'
import { CAMPUSES } from '../../theme/tokens'
// Add to top of EmailEntry, VerifyOTP, CompleteProfile:
import {
  AuthShell,
  AuthField,
  AuthButton,
  SecurityNote,
  AuthFooter,
  authInput
} from '../../components/auth/AuthShell'


const schema = z.object({
  name: z.string().min(2, 'Full name required'),
  phone: z.string().regex(/^0[789][01]\d{8}$/, 'Enter a valid Nigerian number e.g. 08012345678'),
  password: z.string()
    .min(6, 'At least 6 characters')
    .regex(/[A-Z]/, 'Include at least one uppercase letter')
    .regex(/[0-9]/, 'Include at least one number'),
  campus: z.string().min(1, 'Select your campus'),
  studentId: z.string().optional(),
})
type Form = z.infer<typeof schema>

export default function CompleteProfile() {
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()
  const { login } = useAuth()
  const email = location.state?.email as string

  const { register, handleSubmit, watch, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
  })

  const password = watch('password', '')
  const strength = getPasswordStrength(password)

  const { mutate, isPending } = useMutation({
    mutationFn: (d: Form) =>
      authApi.completeRegistration({ ...d, email }),
    onSuccess: (res: any) => {
      login(res.token, res.user)
      toast('Account created! Welcome to Waka Charge ⚡', 'success')
      navigate('/dashboard', { state: { justRegistered: true } })
    },
    onError: (err: any) =>
      toast(err.response?.data?.message || 'Registration failed', 'error'),
  })

  return (
    <AuthShell
      step={3}
      title="Complete your profile"
      subtitle="One last step. This creates your Waka Wallet and Nomba virtual account."
    >
      <form onSubmit={handleSubmit(d => mutate(d))} className="flex flex-col gap-4">

        <AuthField label="Full name" icon={<MdPerson size={18} />} error={errors.name?.message}>
          <input
            className={authInput(!!errors.name)}
            placeholder="e.g. Toluwalope Adeleke"
            autoFocus
            {...register('name')}
          />
        </AuthField>

        <AuthField label="Phone number" icon={<MdPhone size={18} />} error={errors.phone?.message}>
          <input
            className={authInput(!!errors.phone)}
            placeholder="08012345678"
            type="tel"
            {...register('phone')}
          />
        </AuthField>

        <div>
          <AuthField label="Password" icon={<MdLock size={18} />} error={errors.password?.message}>
            <input
              type="password"
              className={authInput(!!errors.password)}
              placeholder="Min 6 chars, 1 uppercase, 1 number"
              {...register('password')}
            />
          </AuthField>
          {password && (
            <div className="mt-2">
              <div className="flex gap-1 mb-1">
                {[1, 2, 3, 4].map(i => (
                  <div
                    key={i}
                    className="flex-1 h-1 rounded-full transition-all duration-300"
                    style={{
                      background: i <= strength.score
                        ? strength.color
                        : '#e2e8f0'
                    }}
                  />
                ))}
              </div>
              <p className="text-xs font-medium" style={{ color: strength.color }}>
                {strength.label}
              </p>
            </div>
          )}
        </div>

        <AuthField label="Campus" icon={<MdSchool size={18} />} error={errors.campus?.message}>
          <select className={authInput(!!errors.campus)} {...register('campus')}>
            <option value="">Select your university</option>
            {CAMPUSES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </AuthField>

        <AuthField
          label="Student ID"
          icon={<MdBadge size={18} />}
          hint="Optional — helps verify your enrollment"
        >
          <input
            className={authInput()}
            placeholder="e.g. LSC/2021/001"
            {...register('studentId')}
          />
        </AuthField>

        {/* What you get */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-2xl p-4 mt-1">
          <p className="text-xs font-bold text-green-700 uppercase tracking-widest mb-3">
            What you get instantly
          </p>
          <div className="flex flex-col gap-2">
            {[
              'Waka Wallet with zero balance (fund anytime)',
              'Nomba virtual bank account for instant transfers',
              'Access to all campus kiosk stations',
            ].map(item => (
              <div key={item} className="flex items-start gap-2">
                <MdCheckCircle size={15} className="text-green-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-green-700">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <AuthButton loading={isPending} className="mt-1">
          Create my Waka account
        </AuthButton>
      </form>
    </AuthShell>
  )
}

function getPasswordStrength(pw: string) {
  let score = 0
  if (pw.length >= 6) score++
  if (pw.length >= 10) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw) && /[^a-zA-Z0-9]/.test(pw)) score++
  const map: Record<number, { label: string; color: string }> = {
    0: { label: 'Too weak', color: '#ef4444' },
    1: { label: 'Weak', color: '#f97316' },
    2: { label: 'Fair', color: '#f59e0b' },
    3: { label: 'Good', color: '#22c55e' },
    4: { label: 'Strong', color: '#16a34a' },
  }
  return { score, ...map[score] }
}