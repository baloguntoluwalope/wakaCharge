import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { formatCurrency, deviceEmoji, deviceLabel } from '../../utils'

type Phase = 'authorising' | 'unlocking' | 'open'

export default function LockerUnlock() {
  const navigate = useNavigate()
  const location = useLocation()
  const { rental, locker } = location.state || {}
  const [phase, setPhase] = useState<Phase>('authorising')
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!rental) { navigate('/stations'); return }

    const start = Date.now()
    const duration = 2000
    const tick = setInterval(() => {
      const pct = Math.min(100, ((Date.now() - start) / duration) * 100)
      setProgress(pct)
      if (pct >= 100) {
        clearInterval(tick)
        setPhase('unlocking')
        setTimeout(() => setPhase('open'), 600)
      }
    }, 20)
    return () => clearInterval(tick)
  }, [rental, navigate])

  if (!rental) return null

  return (
    <div className={`min-h-svh flex flex-col transition-colors duration-700 ${
      phase === 'open' ? 'bg-white' : 'bg-navy-950'
    }`}>
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <AnimatePresence mode="wait">
          {phase === 'authorising' && (
            <motion.div
              key="auth"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-xs"
            >
              <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-6">
                Processing payment
              </p>

              {/* Circular progress */}
              <div className="relative w-40 h-40 mx-auto mb-8">
                <svg className="absolute inset-0 -rotate-90" width="160" height="160">
                  <circle cx="80" cy="80" r="70" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
                  <circle
                    cx="80" cy="80" r="70"
                    fill="none"
                    stroke="#1db954"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={`${(progress / 100) * 440} 440`}
                    style={{
                      filter: 'drop-shadow(0 0 8px #1db954)',
                      transition: 'stroke-dasharray 0.05s linear'
                    }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-5xl">{deviceEmoji(rental.deviceType)}</span>
                </div>
              </div>

              <h2 className="text-2xl font-black text-white mb-2">Authorising rental</h2>
              <p className="text-white/40 text-sm">
                Deducting {formatCurrency(rental.totalPaid)} from wallet…
              </p>
            </motion.div>
          )}

          {phase === 'unlocking' && (
            <motion.div
              key="unlock"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.span
                animate={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 0.5 }}
                className="text-8xl block"
              >
                🔓
              </motion.span>
            </motion.div>
          )}

          {phase === 'open' && (
            <motion.div
              key="open"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full"
            >
              {/* Locker visual */}
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 15 }}
                className="w-40 h-40 mx-auto mb-6 rounded-3xl flex flex-col items-center justify-center border-4 border-green-500"
                style={{
                  background: 'linear-gradient(135deg, rgba(29,185,84,0.1), rgba(29,185,84,0.03))',
                  boxShadow: '0 0 40px rgba(29,185,84,0.25)'
                }}
              >
                <span className="text-5xl">{deviceEmoji(rental.deviceType)}</span>
                <p className="text-green-600 text-xs font-black mt-2">{locker?.assigned || rental.lockerAssigned}</p>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-3xl font-black text-green-600 mb-2"
              >
                UNLOCKED ✅
              </motion.h1>
              <p className="text-slate-500 text-sm mb-1">
                Locker <strong className="text-navy-900">{locker?.assigned || rental.lockerAssigned}</strong> is open.
              </p>
              <p className="text-slate-400 text-sm mb-6">
                Collect your {deviceLabel(rental.deviceType)} now.
              </p>

              <Card className="text-left mb-4">
                {[
                  ['Return by', new Date(rental.expectedReturnTime).toLocaleString()],
                  ['Deposit held', formatCurrency(rental.depositAmount)],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
                    <p className="text-sm text-slate-400">{label}</p>
                    <p className="font-semibold text-navy-900 text-sm">{value}</p>
                  </div>
                ))}
                <div className="flex items-center justify-between py-2.5">
                  <p className="text-sm text-slate-400">Confirmation code</p>
                  <p className="font-mono font-black text-amber-500 text-xl tracking-widest">
                    {rental.confirmationCode}
                  </p>
                </div>
              </Card>

              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
                <p className="text-amber-700 text-xs font-semibold leading-relaxed">
                  ⚠️ Save your code{' '}
                  <strong className="font-mono text-sm">{rental.confirmationCode}</strong>.
                  You'll need it to return the device and reclaim your{' '}
                  {formatCurrency(rental.depositAmount)} deposit.
                </p>
              </div>

              <Button variant="primary" size="lg" fullWidth onClick={() => navigate('/dashboard')}>
                Go to dashboard
              </Button>
              <Button
                variant="ghost"
                fullWidth
                className="mt-2"
                onClick={() => navigate(`/rentals/${rental._id}`)}
              >
                View rental details
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}