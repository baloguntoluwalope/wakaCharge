import { useState, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { FaCircleCheck, FaClock, FaCreditCard } from 'react-icons/fa6'
import { paymentsApi } from '../../api/payments.api'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Card } from '../../components/ui/Card'
import { TopBar } from '../../components/shared/TopBar'
import { useToast } from '../../components/ui/Toast'
import { formatCurrency } from '../../utils'

type Step = 'input' | 'checkout' | 'polling' | 'success' | 'timeout'
const QUICK_AMOUNTS = [500, 1000, 2000, 5000]

export default function FundWallet() {
  const [amount, setAmount] = useState('')
  const [step, setStep] = useState<Step>('input')
  const [checkoutUrl, setCheckoutUrl] = useState('')
  const [reference, setReference] = useState('')
  const navigate = useNavigate()
  const { toast } = useToast()

  const { mutate: createCheckout, isPending } = useMutation({
    mutationFn: () => paymentsApi.createCheckout(Number(amount)),
    onSuccess: (res: any) => {
      setCheckoutUrl(res.checkoutUrl)
      setReference(res.reference)
      setStep('checkout')
    },
    onError: (err: any) => {
      toast(err.response?.data?.message || 'Could not create checkout', 'error')
    }
  })

  const openCheckout = () => {
    window.open(checkoutUrl, '_blank')
    setStep('polling')
    pollStatus()
  }

  const pollStatus = () => {
    let attempts = 0
    const max = 40
    const id = setInterval(async () => {
      attempts++
      try {
        const res = await paymentsApi.pollStatus(reference) as any
        if (res.status === 'success') {
          clearInterval(id)
          setStep('success')
        }
      } catch {}
      if (attempts >= max) {
        clearInterval(id)
        setStep('timeout')
      }
    }, 3000)
  }

  if (step === 'success') return (
    <div className="min-h-svh bg-white flex flex-col items-center justify-center px-6 text-center">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
        <FaCircleCheck className="text-8xl text-green-500 mb-6" />
      </motion.div>
      <h1 className="text-3xl font-black text-navy-900 mb-3">Wallet funded!</h1>
      <p className="text-slate-500 mb-8">Your Waka Wallet has been topped up successfully.</p>
      <Button variant="primary" size="lg" fullWidth onClick={() => navigate('/dashboard')}>
        Back to dashboard
      </Button>
    </div>
  )

  if (step === 'polling') return (
    <div className="min-h-svh bg-white flex flex-col items-center justify-center px-6 text-center">
      <div className="w-16 h-16 rounded-full border-4 border-green-100 border-t-green-500 animate-spin mb-6" />
      <h2 className="text-2xl font-black text-navy-900 mb-3">Waiting for payment…</h2>
      <p className="text-slate-500 text-sm mb-8">
        Complete the payment in the tab we opened, then come back here.
      </p>
      <p className="text-xs text-slate-400 mb-6">Checking every 3 seconds</p>
      <Button variant="secondary" fullWidth onClick={() => setStep('checkout')}>
        Open payment page again
      </Button>
      <Button variant="ghost" fullWidth className="mt-3" onClick={() => navigate('/dashboard')}>
        I'll fund later
      </Button>
    </div>
  )

  if (step === 'timeout') return (
    <div className="min-h-svh bg-white flex flex-col items-center justify-center px-6 text-center">
      <FaClock className="text-6xl text-amber-500 mb-6" />
      <h2 className="text-2xl font-black text-navy-900 mb-3">Payment pending</h2>
      <p className="text-slate-500 text-sm mb-8">
        If you completed payment, your wallet will update automatically once Nomba confirms it.
      </p>
      <Button variant="primary" fullWidth onClick={() => navigate('/dashboard')}>
        Back to dashboard
      </Button>
      <Button variant="ghost" fullWidth className="mt-3" onClick={() => { setStep('input'); setAmount('') }}>
        Try again
      </Button>
    </div>
  )

  if (step === 'checkout') return (
    <div className="min-h-svh bg-white flex flex-col">
      <TopBar title="Fund Wallet" />
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-6">
        <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
          <FaCreditCard className="text-7xl text-green-600" />
        </motion.div>
        <div>
          <h2 className="text-2xl font-black text-navy-900 mb-2">Ready to pay</h2>
          <p className="text-slate-500 text-sm">
            Amount: <strong className="text-navy-900">{formatCurrency(Number(amount))}</strong>
          </p>
        </div>
        <Card className="w-full text-left">
          <p className="text-xs text-slate-400 mb-1">Payment method</p>
          <p className="font-bold text-navy-900">Nomba Secure Checkout</p>
          <p className="text-xs text-slate-400 mt-1">Opens in a new tab. Complete payment and return here.</p>
        </Card>
        <Button variant="primary" size="lg" fullWidth onClick={openCheckout}>
          Open Nomba checkout →
        </Button>
        <Button variant="ghost" fullWidth onClick={() => setStep('input')}>
          Change amount
        </Button>
      </div>
    </div>
  )

  return (
    <div className="min-h-svh bg-white">
      <TopBar title="Fund Wallet" />
      <div className="px-5 py-5 flex flex-col gap-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
            Quick amounts
          </p>
          <div className="grid grid-cols-4 gap-2">
            {QUICK_AMOUNTS.map(a => (
              <motion.button
                key={a}
                whileTap={{ scale: 0.95 }}
                onClick={() => setAmount(String(a))}
                className={`py-3 rounded-2xl text-sm font-black transition-all ${
                  Number(amount) === a
                    ? 'bg-green-500 text-white shadow-glow-green'
                    : 'bg-slate-100 text-navy-700 hover:bg-slate-200'
                }`}
              >
                ₦{a >= 1000 ? `${a / 1000}k` : a}
              </motion.button>
            ))}
          </div>
        </div>

        <Input
          label="Or enter custom amount (₦)"
          type="number"
          value={amount}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)}
          placeholder="e.g. 3000"
          hint="Minimum ₦100"
        />

        <Card className="bg-slate-50 border-slate-200">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
            Free alternative — bank transfer
          </p>
          <p className="text-sm text-slate-500 leading-relaxed">
            Transfer directly to your Nomba virtual account number. No fees, credited instantly.
          </p>
          <button
            onClick={() => navigate('/wallet')}
            className="text-green-600 text-sm font-semibold mt-2"
          >
            See my account number →
          </button>
        </Card>

        <Button
          variant="primary"
          size="lg"
          fullWidth
          loading={isPending}
          onClick={() => createCheckout()}
          disabled={!amount || Number(amount) < 100}
        >
          Pay {amount ? formatCurrency(Number(amount)) : ''} via card
        </Button>
      </div>
    </div>
  )
}