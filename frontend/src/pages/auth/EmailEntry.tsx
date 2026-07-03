import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { authApi } from '../../api/auth.api'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { useToast } from '../../components/ui/Toast'

const schema = z.object({
  email: z.string().email('Please enter a valid email address')
})

type FormData = z.infer<typeof schema>

export default function EmailEntry() {
  const navigate = useNavigate()
  const { toast } = useToast()

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema)
  })

  const { mutate, isPending } = useMutation({
    mutationFn: (data: FormData) => authApi.sendOTP(data.email),
    onSuccess: (_, variables) => {
      navigate('/verify-otp', { state: { email: variables.email, type: 'registration' } })
    },
    onError: (err: any) => {
      toast(err.response?.data?.message || 'Something went wrong', 'error')
    }
  })

  return (
    <div className="min-h-svh bg-white flex flex-col">
      {/* Header */}
      <div className="px-6 pt-16 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-2xl bg-green-500 flex items-center justify-center">
              <span className="text-lg">⚡</span>
            </div>
            <span className="font-black text-navy-900 text-xl">Waka Charge</span>
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-green-600 mb-2">
            Step 1 of 3
          </p>
          <h1 className="text-3xl font-black text-navy-900 leading-tight mb-3">
            Let's verify your email
          </h1>
          <p className="text-slate-500 text-sm leading-relaxed">
            We'll send a 6-digit code to confirm it's really you. No passwords yet.
          </p>
        </motion.div>
      </div>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex-1 px-6"
      >
        <form onSubmit={handleSubmit(data => mutate(data))} className="flex flex-col gap-5">
          <Input
            label="Your school email"
            type="email"
            placeholder="you@lasu.edu.ng"
            error={errors.email?.message}
            autoFocus
            {...register('email')}
          />

          <div className="bg-green-50 rounded-2xl p-4 border border-green-100">
            <p className="text-xs text-green-700 font-medium">
              💡 Use your university email for faster verification and campus access.
            </p>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={isPending}
          >
            Send verification code
          </Button>
        </form>
      </motion.div>

      {/* Footer */}
      <div className="px-6 py-8 text-center">
        <p className="text-sm text-slate-500">
          Already have an account?{' '}
          <button
            onClick={() => navigate('/login')}
            className="font-semibold text-green-600 hover:text-green-700"
          >
            Log in
          </button>
        </p>
      </div>
    </div>
  )
}