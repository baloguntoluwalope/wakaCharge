import { useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { authApi } from '../../api/auth.api'
import { Input, Select } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { useToast } from '../../components/ui/Toast'
import { useAuth } from '../../context/AuthContext'
import { CAMPUSES } from '../../theme/tokens'

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().regex(/^0[789][01]\d{8}$/, 'Enter a valid Nigerian phone number'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  campus: z.string().min(1, 'Please select your campus'),
  studentId: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function CompleteProfile() {
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()
  const { login } = useAuth()
  const email = location.state?.email as string

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema)
  })

  const { mutate, isPending } = useMutation({
    mutationFn: (data: FormData) =>
      authApi.completeRegistration({ ...data, email }),
    onSuccess: (res: any) => {
      login(res.token, res.user)
      toast('Account created! Welcome to Waka Charge ⚡', 'success')
      navigate('/dashboard', { state: { justRegistered: true } })
    },
    onError: (err: any) => {
      toast(err.response?.data?.message || 'Registration failed', 'error')
    }
  })

  return (
    <div className="min-h-svh bg-white flex flex-col">
      <div className="px-6 pt-16 pb-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-2xl bg-slate-100 flex items-center justify-center mb-8"
          >
            ←
          </button>
          <p className="text-xs font-bold uppercase tracking-widest text-green-600 mb-2">
            Step 3 of 3 — Almost there!
          </p>
          <h1 className="text-3xl font-black text-navy-900 leading-tight mb-2">
            Complete your profile
          </h1>
          <p className="text-slate-500 text-sm">
            This creates your Waka Wallet and Nomba virtual account automatically.
          </p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="flex-1 px-6 pb-8"
      >
        <form
          onSubmit={handleSubmit(data => mutate(data))}
          className="flex flex-col gap-4"
        >
          <Input
            label="Full name"
            placeholder="Toluwalope Adeleke"
            error={errors.name?.message}
            {...register('name')}
          />
          <Input
            label="Phone number"
            placeholder="08012345678"
            type="tel"
            error={errors.phone?.message}
            {...register('phone')}
          />
          <Input
            label="Password"
            type="password"
            placeholder="At least 6 characters"
            error={errors.password?.message}
            {...register('password')}
          />
          <Select
            label="Campus"
            placeholder="Select your campus"
            error={errors.campus?.message}
            options={CAMPUSES.map(c => ({ value: c, label: c }))}
            {...register('campus')}
          />
          <Input
            label="Student ID"
            placeholder="LSC/2021/001"
            hint="Optional — helps verify your enrollment"
            {...register('studentId')}
          />

          <div className="bg-green-50 rounded-2xl p-4 border border-green-100 mt-2">
            <p className="text-xs text-green-700 font-medium leading-relaxed">
              ⚡ By registering, a Nomba virtual bank account will be created for your
              Waka Wallet automatically. No extra steps needed.
            </p>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={isPending}
            className="mt-2"
          >
            Create my Waka account
          </Button>
        </form>
      </motion.div>
    </div>
  )
}