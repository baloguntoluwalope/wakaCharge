import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  MdStore,
  MdPerson,
  MdEmail,
  MdPhone,
  MdLock,
  MdSchool,
  MdArrowBack,
  MdCheckCircle,
} from 'react-icons/md'
import api from '../../api/client'
import { useToast } from '../../components/ui/Toast'
import { CAMPUSES } from '../../theme/tokens'

const schema = z.object({
  name: z.string().min(2, 'Full name required'),
  email: z.string().email('Valid email required'),
  phone: z.string().regex(/^0[789][01]\d{8}$/, 'Valid Nigerian number required'),
  password: z.string().min(6, 'Minimum 6 characters'),
  campus: z.string().min(1, 'Select your campus'),
})

type Form = z.infer<typeof schema>

export default function OperatorRegister() {
  const navigate = useNavigate()
  const { toast } = useToast()

  const { register, handleSubmit, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema)
  })

  const { mutate, isPending, isSuccess } = useMutation({
    mutationFn: (data: Form) =>
      api.post('/auth/operator/register', data),
    onSuccess: () => {
      // isSuccess state handles the UI
    },
    onError: (err: any) =>
      toast(err.response?.data?.message || 'Registration failed', 'error')
  })

  // Success screen
  if (isSuccess) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
        style={{ background: 'linear-gradient(160deg, #060b12 0%, #0b1420 100%)' }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-sm w-full"
        >
          <div className="w-20 h-20 rounded-full bg-amber-500 flex items-center justify-center mx-auto mb-6">
            <MdCheckCircle size={40} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-white mb-3">
            Application submitted!
          </h1>
          <p className="text-white/60 text-sm leading-relaxed mb-8">
            Your operator application is under review. You'll receive an
            email within 24 hours once approved by the Waka Charge team.
          </p>
          <button
            onClick={() => navigate('/operator-login')}
            className="w-full py-4 rounded-2xl bg-amber-500 text-white font-black hover:bg-amber-400 transition-all"
          >
            Go to login
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'linear-gradient(160deg, #060b12 0%, #0b1420 100%)' }}
    >
      <div className="w-full max-w-md">
        <button
          onClick={() => navigate('/operator-login')}
          className="flex items-center gap-1.5 text-white/40 text-sm font-medium mb-8 hover:text-white/60 transition-colors"
        >
          <MdArrowBack size={16} />
          Back to login
        </button>

        <div className="bg-white rounded-3xl overflow-hidden shadow-2xl">
          {/* Amber header */}
          <div className="bg-amber-500 px-8 pt-8 pb-6">
            <div className="w-12 h-12 rounded-2xl bg-white/25 flex items-center justify-center mb-4">
              <MdStore size={24} className="text-white" />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-amber-900/60 mb-1">
              Operator Portal
            </p>
            <h1 className="text-2xl font-black text-white">
              Apply as operator
            </h1>
            <p className="text-amber-900/60 text-sm mt-1">
              Manage a Waka Charge kiosk on your campus
            </p>
          </div>

          {/* Form */}
          <div className="p-8">
            <form
              onSubmit={handleSubmit(d => mutate(d))}
              className="flex flex-col gap-4"
            >
              {[
                {
                  label: 'Full name',
                  icon: <MdPerson size={18} />,
                  field: 'name' as const,
                  placeholder: 'John Operator',
                  type: 'text',
                },
                {
                  label: 'Email address',
                  icon: <MdEmail size={18} />,
                  field: 'email' as const,
                  placeholder: 'you@email.com',
                  type: 'email',
                },
                {
                  label: 'Phone number',
                  icon: <MdPhone size={18} />,
                  field: 'phone' as const,
                  placeholder: '08012345678',
                  type: 'tel',
                },
                {
                  label: 'Password',
                  icon: <MdLock size={18} />,
                  field: 'password' as const,
                  placeholder: 'Min 6 characters',
                  type: 'password',
                },
              ].map(f => (
                <div key={f.field}>
                  <label className="block text-sm font-semibold text-navy-700 mb-1.5">
                    {f.label}
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      {f.icon}
                    </div>
                    <input
                      type={f.type}
                      placeholder={f.placeholder}
                      className={`w-full pl-10 pr-4 py-3.5 rounded-2xl text-sm font-medium border-2 outline-none transition-all text-navy-900 placeholder-slate-300 ${
                        errors[f.field]
                          ? 'border-red-400 bg-red-50'
                          : 'border-slate-200 bg-slate-50 focus:border-amber-400 focus:bg-white'
                      }`}
                      {...register(f.field)}
                    />
                  </div>
                  {errors[f.field] && (
                    <p className="text-red-500 text-xs mt-1 font-medium">
                      ⚠ {errors[f.field]?.message}
                    </p>
                  )}
                </div>
              ))}

              {/* Campus select */}
              <div>
                <label className="block text-sm font-semibold text-navy-700 mb-1.5">
                  Campus
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <MdSchool size={18} />
                  </div>
                  <select
                    className={`w-full pl-10 pr-4 py-3.5 rounded-2xl text-sm font-medium border-2 outline-none transition-all text-navy-900 bg-slate-50 focus:border-amber-400 focus:bg-white ${
                      errors.campus ? 'border-red-400' : 'border-slate-200'
                    }`}
                    {...register('campus')}
                  >
                    <option value="">Select your campus</option>
                    {CAMPUSES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                {errors.campus && (
                  <p className="text-red-500 text-xs mt-1 font-medium">
                    ⚠ {errors.campus.message}
                  </p>
                )}
              </div>

              {/* Info note */}
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                <p className="text-amber-700 text-xs font-medium leading-relaxed">
                  ℹ️ Applications are reviewed within 24 hours. You'll receive
                  an email confirmation once approved.
                </p>
              </div>

              <motion.button
                type="submit"
                disabled={isPending}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3.5 rounded-2xl bg-amber-500 text-white font-black text-sm hover:bg-amber-400 transition-all disabled:opacity-40 flex items-center justify-center gap-2 mt-1"
              >
                {isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting…
                  </>
                ) : (
                  'Submit application'
                )}
              </motion.button>
            </form>

            <p className="text-center mt-5">
              <button
                onClick={() => navigate('/operator-login')}
                className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
              >
                Already approved? Sign in →
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}