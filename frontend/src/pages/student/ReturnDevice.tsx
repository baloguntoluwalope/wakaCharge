import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { rentalsApi } from '../../api/rentals.api'
import { TopBar } from '../../components/shared/TopBar'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { OTPInput } from '../../components/ui/Input'
import { formatCurrency } from '../../utils'

type Step = 'instructions' | 'enter-code' | 'success'

export default function ReturnDevice() {
  const navigate = useNavigate()
  const location = useLocation()
  const { rental, initiateResponse } = location.state || {}

  const [step, setStep] = useState<Step>('instructions')
  const [code, setCode] = useState('')
  const [codeError, setCodeError] = useState('')
  const [result, setResult] = useState<any>(null)

  useEffect(() => { if (!rental) navigate('/rentals') }, [rental])

  const { mutate: confirm, isPending } = useMutation({
    mutationFn: () => rentalsApi.confirmReturn(rental._id, code),
    onSuccess: (res: any) => {
      setResult(res)
      setStep('success')
    },
    onError: (err: any) => {
      setCodeError(err.response?.data?.message || 'Invalid code or operator not confirmed yet')
    }
  })

  useEffect(() => {
    if (code.length === 4) {
      setCodeError('')
      confirm()
    }
  }, [code])

  if (!rental) return null

  if (step === 'success' && result) {
    return (
      <div className="min-h-svh bg-white flex flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 15 }}
        >
          <span className="text-8xl block mb-6">💰</span>
        </motion.div>
        <h1 className="text-3xl font-black text-navy-900 mb-3">Deposit refunded!</h1>
        <Card className="w-full text-left mb-6">
          {[
            ['Deposit returned', formatCurrency(result.rental?.depositRefunded || 0), 'text-green-600'],
            result.rental?.lateFee > 0 ? ['Late fee deducted', `-${formatCurrency(result.rental.lateFee)}`, 'text-amber-600'] : null,
            ['New wallet balance', formatCurrency(result.walletBalance || 0), 'text-navy-900'],
          ].filter(Boolean).map(([label, value, color]: any) => (
            <div key={label} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
              <p className="text-sm text-slate-400">{label}</p>
              <p className={`font-black text-base ${color}`}>{value}</p>
            </div>
          ))}
        </Card>

        {result.trustScore && (
          <Card className="w-full mb-6 bg-green-50 border-green-100">
            <p className="text-green-700 font-semibold text-sm">
              {result.trustScore.rnplEnabled && !rental.rnplEnabled
                ? '🎉 RNPL unlocked! You can now rent without paying upfront.'
                : result.rental?.isEarlyReturn
                ? '⭐ +2 trust points for early return!'
                : '⭐ +1 trust point earned'
              }
            </p>
            <p className="text-green-600 text-xs mt-1">
              Score: {result.trustScore.trustScore} pts — {result.trustScore.trustLevel}
            </p>
          </Card>
        )}

        <Button variant="primary" size="lg" fullWidth onClick={() => navigate('/dashboard')}>
          Back to dashboard
        </Button>
      </div>
    )
  }

  return (
    <div className="bg-slate-50 min-h-svh">
      <TopBar title="Return Device" />
      <div className="px-5 py-5 flex flex-col gap-5">
        <AnimatePresence mode="wait">
          {step === 'instructions' && (
            <motion.div
              key="instructions"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              className="flex flex-col gap-4"
            >
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                  Return process
                </p>
                <h2 className="text-2xl font-black text-navy-900">How to return</h2>
              </div>

              {[
                { n: 1, title: 'Go to the station', body: 'Walk to your nearest Waka Charge kiosk on campus.' },
                { n: 2, title: 'Hand device to operator', body: 'Give the device to the station operator. They\'ll check it and confirm receipt.' },
                { n: 3, title: 'Enter your code', body: `Once confirmed, enter your 4-digit code: ${initiateResponse?.confirmationCode || rental?.confirmationCode}` },
                { n: 4, title: 'Get your deposit back', body: 'Your deposit lands in your wallet the moment both confirmations match.' },
              ].map(s => (
                <Card key={s.n} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-black text-sm flex-shrink-0">
                    {s.n}
                  </div>
                  <div>
                    <p className="font-bold text-navy-900 text-sm">{s.title}</p>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{s.body}</p>
                  </div>
                </Card>
              ))}

              <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-5 text-center">
                <p className="text-xs font-bold uppercase tracking-widest text-amber-600 mb-2">
                  Your confirmation code
                </p>
                <p className="font-mono text-4xl font-black text-amber-600 tracking-widest">
                  {initiateResponse?.confirmationCode || rental?.confirmationCode}
                </p>
              </div>

              <Button variant="primary" size="lg" fullWidth onClick={() => setStep('enter-code')}>
                I've handed device to operator →
              </Button>
            </motion.div>
          )}

          {step === 'enter-code' && (
            <motion.div
              key="code"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              className="flex flex-col gap-5"
            >
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                  Step 3 of 4
                </p>
                <h2 className="text-2xl font-black text-navy-900">Enter your code</h2>
                <p className="text-slate-500 text-sm mt-1">
                  Make sure the operator has confirmed receipt first.
                </p>
              </div>

              <OTPInput
                length={4}
                value={code}
                onChange={setCode}
                error={codeError}
              />

              <Button
                variant="primary"
                size="lg"
                fullWidth
                loading={isPending}
                onClick={() => confirm()}
                disabled={code.length !== 4}
              >
                Confirm return
              </Button>

              <Button variant="ghost" fullWidth onClick={() => setStep('instructions')}>
                ← Back to instructions
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}