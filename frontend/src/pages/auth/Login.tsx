import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { MdEmail, MdLock, MdArrowForward } from 'react-icons/md'
import { authApi } from '../../api/auth.api'
import { useToast } from '../../components/ui/Toast'
import { useAuth } from '../../context/AuthContext'
import { AuthField, AuthButton, authInput } from '../../components/auth/AuthShell'

const schema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(1, 'Password required'),
})
type Form = z.infer<typeof schema>

export default function Login() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { login } = useAuth()

  const { register, handleSubmit, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
  })

  const { mutate, isPending } = useMutation({
    mutationFn: (d: Form) => authApi.login(d.email, d.password),
    onSuccess: (res: any) => {
      login(res.token, res.user)
      navigate('/dashboard')
    },
    onError: (err: any) =>
      toast(err.response?.data?.message || 'Invalid email or password', 'error'),
  })

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row">

      {/* ── Left panel (desktop) ─────────────────── */}
      <div
        className="hidden lg:flex flex-col justify-between w-2/5 xl:w-1/2 p-12 xl:p-16"
        style={{ background: 'linear-gradient(160deg, #060b12 0%, #0b1420 60%, #0f2318 100%)' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-green-500 flex items-center justify-center">
            <span className="text-white text-lg font-black">W</span>
          </div>
          <span className="font-black text-white text-xl tracking-tight">
            Waka<span className="text-green-400">Charge</span>
          </span>
        </div>

        {/* Quote */}
        <div>
          <p className="text-5xl font-black text-white leading-tight mb-6">
            Power to learn.<br />
            <span className="text-green-400">Credit to grow.</span>
          </p>
          <p className="text-white/40 text-base leading-relaxed max-w-sm">
            Every return builds your trust score. Reach 10 successful rentals
            and unlock Rent Now, Pay Later — your campus credit line.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-10 pt-10 border-t border-white/10">
            {[
              { n: '10+', label: 'Campuses' },
              { n: '₦300', label: 'From per session' },
              { n: '100%', label: 'Deposit refunded' },
            ].map(s => (
              <div key={s.label}>
                <p className="text-2xl font-black text-white">{s.n}</p>
                <p className="text-xs text-white/40 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-white/20 text-xs">© 2026 Waka Charge · Powered by Nomba</p>
      </div>

      {/* ── Right panel ──────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center px-6 py-10 lg:px-12 xl:px-20">

        {/* Mobile logo */}
        <div className="flex items-center gap-2 mb-10 lg:hidden">
          <div className="w-9 h-9 rounded-xl bg-green-500 flex items-center justify-center">
            <span className="text-white font-black text-sm">W</span>
          </div>
          <span className="font-black text-navy-900 text-lg">
            Waka<span className="text-green-500">Charge</span>
          </span>
        </div>

        <div className="max-w-sm w-full mx-auto lg:mx-0">
          <div className="mb-8">
            <p className="text-xs font-bold uppercase tracking-widest text-green-600 mb-2">
              Student portal
            </p>
            <h1 className="text-3xl font-black text-navy-900 mb-2">Welcome back</h1>
            <p className="text-slate-500 text-sm">Sign in to your student account</p>
          </div>

          <form onSubmit={handleSubmit(d => mutate(d))} className="flex flex-col gap-4">
            <AuthField label="Email address" icon={<MdEmail size={18} />} error={errors.email?.message}>
              <input
                type="email"
                autoFocus
                autoComplete="email"
                placeholder="you@lasu.edu.ng"
                className={authInput(!!errors.email)}
                {...register('email')}
              />
            </AuthField>

            <AuthField label="Password" icon={<MdLock size={18} />} error={errors.password?.message}>
              <input
                type="password"
                autoComplete="current-password"
                placeholder="Your password"
                className={authInput(!!errors.password)}
                {...register('password')}
              />
            </AuthField>

            <AuthButton loading={isPending} className="mt-2">
              Sign in to account
            </AuthButton>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs text-slate-400 font-medium">
                other portals
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => navigate('/operator-login')}
              className="w-full flex items-center justify-between px-4 py-3 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all"
            >
              <span className="flex items-center gap-2">
                <span className="text-lg">🏪</span>
                Operator login
              </span>
              <MdArrowForward size={16} className="text-slate-400" />
            </button>
            <button
              onClick={() => navigate('/admin-login')}
              className="w-full flex items-center justify-between px-4 py-3 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all"
            >
              <span className="flex items-center gap-2">
                <span className="text-lg">⚙️</span>
                Admin console
              </span>
              <MdArrowForward size={16} className="text-slate-400" />
            </button>
          </div>

          <p className="text-sm text-slate-500 text-center mt-6">
            New to Waka?{' '}
            <button
              onClick={() => navigate('/register')}
              className="font-semibold text-green-600 hover:text-green-700"
            >
              Create an account
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}


// import { useNavigate } from 'react-router-dom'
// import { useForm } from 'react-hook-form'
// import { z } from 'zod'
// import { zodResolver } from '@hookform/resolvers/zod'
// import { useMutation } from '@tanstack/react-query'
// import { motion } from 'framer-motion'
// import { authApi } from '../../api/auth.api'
// import { Input } from '../../components/ui/Input'
// import { Button } from '../../components/ui/Button'
// import { useToast } from '../../components/ui/Toast'
// import { useAuth } from '../../context/AuthContext'

// const schema = z.object({
//   email: z.string().email('Valid email required'),
//   password: z.string().min(1, 'Password required'),
// })

// type FormData = z.infer<typeof schema>

// export default function Login() {
//   const navigate = useNavigate()
//   const { toast } = useToast()
//   const { login } = useAuth()

//   const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
//     resolver: zodResolver(schema)
//   })

//   const { mutate, isPending } = useMutation({
//     mutationFn: (data: FormData) => authApi.login(data.email, data.password),
//     onSuccess: (res: any) => {
//       login(res.token, res.user)
//       navigate('/dashboard')
//     },
//     onError: (err: any) => {
//       toast(err.response?.data?.message || 'Invalid credentials', 'error')
//     }
//   })

//   return (
//     <div className="min-h-svh bg-white flex flex-col">
//       <div className="px-6 pt-16 pb-8">
//         <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
//           <div className="flex items-center gap-2 mb-10">
//             <div className="w-10 h-10 rounded-2xl bg-green-500 flex items-center justify-center">
//               <span>⚡</span>
//             </div>
//             <span className="font-black text-navy-900 text-xl">Waka Charge</span>
//           </div>
//           <h1 className="text-3xl font-black text-navy-900 mb-2">Welcome back</h1>
//           <p className="text-slate-500 text-sm">Sign in to your student account</p>
//         </motion.div>
//       </div>

//       <motion.div
//         initial={{ opacity: 0, y: 16 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ delay: 0.15 }}
//         className="flex-1 px-6"
//       >
//         <form
//           onSubmit={handleSubmit(data => mutate(data))}
//           className="flex flex-col gap-4"
//         >
//           <Input
//             label="Email"
//             type="email"
//             placeholder="you@lasu.edu.ng"
//             error={errors.email?.message}
//             autoFocus
//             {...register('email')}
//           />
//           <Input
//             label="Password"
//             type="password"
//             placeholder="Your password"
//             error={errors.password?.message}
//             {...register('password')}
//           />
//           <Button
//             type="submit"
//             variant="primary"
//             size="lg"
//             fullWidth
//             loading={isPending}
//             className="mt-2"
//           >
//             Sign in
//           </Button>
//         </form>

//         <div className="my-6 flex items-center gap-3">
//           <div className="flex-1 h-px bg-slate-100" />
//           <span className="text-xs text-slate-400 font-medium">Other logins</span>
//           <div className="flex-1 h-px bg-slate-100" />
//         </div>

//         <div className="flex flex-col gap-3">
//           <Button
//             variant="outline"
//             fullWidth
//             onClick={() => navigate('/operator-login')}
//           >
//             Operator login
//           </Button>
//           <Button
//             variant="ghost"
//             fullWidth
//             onClick={() => navigate('/admin-login')}
//           >
//             Admin login
//           </Button>
//         </div>
//       </motion.div>

//       <div className="px-6 py-8 text-center">
//         <p className="text-sm text-slate-500">
//           New to Waka?{' '}
//           <button
//             onClick={() => navigate('/register')}
//             className="font-semibold text-green-600"
//           >
//             Create an account
//           </button>
//         </p>
//       </div>
//     </div>
//   )
// }