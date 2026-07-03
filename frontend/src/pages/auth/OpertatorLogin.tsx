import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '../../api/auth.api'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { useToast } from '../../components/ui/Toast'
import { useAuth } from '../../context/AuthContext'
import { TopBar } from '../../components/shared/TopBar'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

type FormData = z.infer<typeof schema>

export default function OperatorLogin() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { login } = useAuth()

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema)
  })

  const { mutate, isPending } = useMutation({
    mutationFn: (data: FormData) =>
      authApi.operatorLogin(data.email, data.password),
    onSuccess: (res: any) => {
      login(res.token, res.user)
      navigate('/operator/dashboard')
    },
    onError: (err: any) => {
      toast(err.response?.data?.message || 'Invalid credentials', 'error')
    }
  })

  return (
    <div className="min-h-svh bg-white">
      <TopBar title="Operator Login" />
      <div className="px-6 pt-6">
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-6">
          <p className="text-xs text-amber-700 font-semibold">
            🏪 Operator accounts are created by admin. Contact your manager for credentials.
          </p>
        </div>
        <form onSubmit={handleSubmit(d => mutate(d))} className="flex flex-col gap-4">
          <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
          <Input label="Password" type="password" error={errors.password?.message} {...register('password')} />
          <Button type="submit" variant="amber" size="lg" fullWidth loading={isPending}>
            Log in to station
          </Button>
        </form>
      </div>
    </div>
  )
}