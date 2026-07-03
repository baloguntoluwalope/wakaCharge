import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { MdEmail, MdArrowForward, MdLock } from 'react-icons/md'
import { authApi } from '../../api/auth.api'
import { useToast } from '../../components/ui/Toast'
import {
  AuthShell,
  AuthField,
  AuthButton,
  SecurityNote,
  AuthFooter,
  authInput
} from '../../components/auth/AuthShell'


const schema = z.object({
  email: z.string().email('Enter a valid email address'),
})
type Form = z.infer<typeof schema>

export default function EmailEntry() {
  const navigate = useNavigate()
  const { toast } = useToast()

  const { register, handleSubmit, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
  })

  const { mutate, isPending } = useMutation({
    mutationFn: (d: Form) => authApi.sendOTP(d.email),
    onSuccess: (_, v) =>
      navigate('/verify-otp', { state: { email: v.email, type: 'registration' } }),
    onError: (err: any) =>
      toast(err.response?.data?.message || 'Something went wrong', 'error'),
  })

  return (
    <AuthShell
      step={1}
      title="Create your account"
      subtitle="Enter your email to get started. We'll send a 6-digit verification code."
    >
      <form onSubmit={handleSubmit(d => mutate(d))} className="flex flex-col gap-5">
        <AuthField
          label="Email address"
          icon={<MdEmail size={18} />}
          error={errors.email?.message}
        >
          <input
            type="email"
            autoFocus
            autoComplete="email"
            placeholder="you@lasu.edu.ng"
            className={authInput(!!errors.email)}
            {...register('email')}
          />
        </AuthField>

        <AuthButton loading={isPending}>
          Send verification code
        </AuthButton>

        <SecurityNote text="We'll send a 6-digit OTP. No spam, ever." />
      </form>

      <AuthFooter
        text="Already have an account?"
        linkText="Sign in"
        onClick={() => navigate('/login')}
      />
    </AuthShell>
  )
}