import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { HiMail, HiLockClosed, HiArrowRight, HiLightningBolt } from 'react-icons/hi'
import { authApi } from '../../api/auth.api'
import { useToast } from '../../components/ui/Toast'
import { useAuth } from '../../context/AuthContext'
import wakaLogo from '../../assets/waka-logo.png'

const schema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(1, 'Password required'),
})

type FormData = z.infer<typeof schema>

const inputStyle = (hasError: boolean): React.CSSProperties => ({
  width: '100%',
  padding: '13px 14px 13px 40px',
  borderRadius: 12,
  border: `1.5px solid ${hasError ? '#ef4444' : '#e2e8f0'}`,
  fontSize: 14,
  color: '#0f172a',
  background: '#f8fafc',
  outline: 'none',
  transition: 'border-color 0.15s, box-shadow 0.15s',
  fontFamily: 'inherit'
})

export default function Login() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { login } = useAuth()
  const [loginError, setLoginError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema)
  })

  const { onBlur: emailOnBlur, ...emailRegister } = register('email')
  const { onBlur: passwordOnBlur, ...passwordRegister } = register('password')

  const { mutate, isPending } = useMutation({
    mutationFn: (data: FormData) => authApi.login(data.email, data.password),
    onSuccess: (res: any) => {
      setLoginError(null)
      login(res.token, res.user)
      navigate('/dashboard')
    },
    onError: (err: any) => {
      const errorMessage = err.response?.data?.message || 'Invalid credentials'
      setLoginError(errorMessage)
      toast(errorMessage, 'error')
    }
  })

  return (
    <div
      className="min-h-svh flex flex-col"
      style={{ background: 'linear-gradient(160deg, #f0fdf4 0%, #f8fafc 50%, #f0fdf4 100%)' }}
    >
      {/* Background pattern */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(34,197,94,0.06) 1px, transparent 1px)',
          backgroundSize: '28px 28px'
        }}
      />

      {/* Top accent */}
      <div
        className="fixed top-0 left-0 right-0 h-1 pointer-events-none"
        style={{ background: 'linear-gradient(90deg, #16a34a, #22c55e, #4ade80, #22c55e, #16a34a)' }}
      />

      <div className="relative flex-1 flex flex-col px-6 pt-14 pb-8 max-w-sm mx-auto w-full">

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center mb-8"
        >
          <div
            className="rounded-3xl overflow-hidden mb-4 flex items-center justify-center"
            style={{
              width: 90,
              height: 90,
              background: '#fff',
              boxShadow: '0 8px 32px rgba(34,197,94,0.2), 0 2px 8px rgba(0,0,0,0.08)',
              padding: 10
            }}
          >
            <img
              src={wakaLogo}
              alt="Waka Logo"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>
          <div className="text-center">
            <p
              className="font-black tracking-tight"
              style={{ fontSize: 22, color: '#14532d', letterSpacing: '-0.02em' }}
            >
              WAKA<span style={{ color: '#22c55e' }}>Charge</span>
            </p>
            <p style={{ fontSize: 11, color: '#86efac', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 2 }}>
              Wallet · Access · Kiosk · Alliance
            </p>
          </div>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{
            background: '#fff',
            borderRadius: 24,
            padding: '32px 28px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)',
            border: '1px solid rgba(34,197,94,0.12)'
          }}
        >
          {/* Heading */}
          <div className="mb-7">
            <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', marginBottom: 4, lineHeight: 1.2 }}>
              Welcome back 👋
            </h1>
            <p style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>
              Sign in to your student account
            </p>
            {loginError && (
              <div style={{ marginTop: 16, padding: '12px 14px', borderRadius: 14, background: '#fee2e2', color: '#991b1b', fontSize: 13, fontWeight: 600 }}>
                {loginError}
              </div>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(data => mutate(data))} className="flex flex-col gap-4">

            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6, letterSpacing: '0.02em' }}>
                Email address
              </label>
              <div style={{ position: 'relative' }}>
                <HiMail
                  size={15}
                  style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }}
                />
                <input
                  type="email"
                  placeholder="you@lasu.edu.ng"
                  style={inputStyle(!!errors.email)}
                  onFocus={e => {
                    setLoginError(null)
                    if (!errors.email) {
                      e.target.style.borderColor = '#22c55e'
                      e.target.style.boxShadow = '0 0 0 3px rgba(34,197,94,0.1)'
                    }
                  }}
                  onBlur={e => {
                    emailOnBlur(e)
                    if (!errors.email) {
                      e.target.style.borderColor = '#e2e8f0'
                      e.target.style.boxShadow = 'none'
                    }
                  }}
                  autoFocus
                  {...emailRegister}
                />
              </div>
              {errors.email && (
                <p style={{ fontSize: 11, color: '#ef4444', marginTop: 5, fontWeight: 600 }}>
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', letterSpacing: '0.02em' }}>
                  Password
                </label>
                <button
                  type="button"
                  style={{ fontSize: 11, color: '#22c55e', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  Forgot password?
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <HiLockClosed
                  size={15}
                  style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }}
                />
                <input
                  type="password"
                  placeholder="••••••••"
                  style={inputStyle(!!errors.password)}
                  onFocus={e => {
                    setLoginError(null)
                    if (!errors.password) {
                      e.target.style.borderColor = '#22c55e'
                      e.target.style.boxShadow = '0 0 0 3px rgba(34,197,94,0.1)'
                    }
                  }}
                  onBlur={e => {
                    passwordOnBlur(e)
                    if (!errors.password) {
                      e.target.style.borderColor = '#e2e8f0'
                      e.target.style.boxShadow = 'none'
                    }
                  }}
                  {...passwordRegister}
                />
              </div>
              {errors.password && (
                <p style={{ fontSize: 11, color: '#ef4444', marginTop: 5, fontWeight: 600 }}>
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center justify-center gap-2 font-bold transition-all group"
              style={{
                marginTop: 4,
                padding: '14px',
                borderRadius: 12,
                background: isPending ? '#86efac' : '#22c55e',
                color: '#fff',
                fontSize: 14,
                border: 'none',
                cursor: isPending ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 16px rgba(34,197,94,0.3)',
                transition: 'all 0.15s'
              }}
              onMouseEnter={e => { if (!isPending) e.currentTarget.style.background = '#16a34a' }}
              onMouseLeave={e => { if (!isPending) e.currentTarget.style.background = '#22c55e' }}
            >
              {isPending ? (
                <>
                  <div
                    className="animate-spin rounded-full border-2 border-white border-t-transparent"
                    style={{ width: 16, height: 16 }}
                  />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <HiArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div style={{ flex: 1, height: 1, background: '#f1f5f9' }} />
            <span style={{ fontSize: 11, color: '#cbd5e1', fontWeight: 600 }}>Other portals</span>
            <div style={{ flex: 1, height: 1, background: '#f1f5f9' }} />
          </div>

          {/* Other logins */}
          <div className="flex flex-col gap-2.5">
            <button
              onClick={() => navigate('/operator-login')}
              className="flex items-center justify-center gap-2 font-semibold transition-all"
              style={{
                padding: '12px',
                borderRadius: 12,
                border: '1.5px solid #e2e8f0',
                background: '#fff',
                color: '#475569',
                fontSize: 13,
                cursor: 'pointer'
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#22c55e'; e.currentTarget.style.color = '#16a34a' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#475569' }}
            >
              <HiLightningBolt size={14} style={{ color: '#f59e0b' }} />
              Operator login
            </button>
            <button
              onClick={() => navigate('/admin-login')}
              className="flex items-center justify-center gap-2 font-semibold transition-all"
              style={{
                padding: '12px',
                borderRadius: 12,
                border: '1.5px solid #e2e8f0',
                background: '#fff',
                color: '#475569',
                fontSize: 13,
                cursor: 'pointer'
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#8b5cf6'; e.currentTarget.style.color = '#7c3aed' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#475569' }}
            >
              <HiLightningBolt size={14} style={{ color: '#8b5cf6' }} />
              Admin console
            </button>
          </div>
        </motion.div>

        {/* Register link */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="text-center mt-6"
          style={{ fontSize: 13, color: '#94a3b8' }}
        >
          New to Waka?{' '}
          <button
            onClick={() => navigate('/register')}
            style={{ color: '#16a34a', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            Create an account
          </button>
        </motion.p>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center mt-auto pt-8"
          style={{ fontSize: 11, color: '#cbd5e1', fontWeight: 500 }}
        >
          Powered by{' '}
          <span style={{ color: '#86efac', fontWeight: 700 }}>Nomba</span>
          {' '}· Built for Nigeria 🇳🇬
        </motion.p>
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