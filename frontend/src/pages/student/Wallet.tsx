import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { paymentsApi } from '../../api/payments.api'
import { WalletCard, Card, Skeleton } from '../../components/ui/Card'
import { useToast } from '../../components/ui/Toast'
import { TopBar } from '../../components/shared/TopBar'

export default function Wallet() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['wallet'],
    queryFn: paymentsApi.getWallet,
  })

  const wallet = data as any

  const copyAccount = () => {
    if (!wallet?.virtualAccount?.accountNumber) return
    navigator.clipboard.writeText(wallet.virtualAccount.accountNumber)
    setCopied(true)
    toast('Account number copied!', 'success')
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="bg-slate-50 min-h-svh">
      <TopBar title="Waka Wallet" onBack={false} />
      <div className="px-5 py-5 flex flex-col gap-5">
        {isLoading ? (
          <Skeleton className="h-52" />
        ) : (
          <WalletCard
            balance={wallet?.walletBalance || 0}
            accountNumber={wallet?.virtualAccount?.accountNumber}
            bankName={wallet?.virtualAccount?.bankName}
            accountName={wallet?.virtualAccount?.accountName}
            onFund={() => navigate('/wallet/fund')}
            onView={() => navigate('/transactions')}
          />
        )}

        {/* Virtual account details */}
        {wallet?.virtualAccount?.accountNumber && (
          <Card>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
              Nomba Virtual Account
            </p>
            <p className="text-sm text-slate-500 mb-4 leading-relaxed">
              Transfer money here from any bank to fund your wallet instantly — no delays.
            </p>
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Bank</p>
                  <p className="font-semibold text-navy-800">
                    {wallet.virtualAccount.bankName || 'Nomba'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400 mb-0.5">Name</p>
                  <p className="font-semibold text-navy-800">
                    {wallet.virtualAccount.accountName}
                  </p>
                </div>
              </div>
              <div className="border-t border-slate-200 pt-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Account Number</p>
                  <p className="font-mono text-2xl font-black text-navy-900 tracking-widest">
                    {wallet.virtualAccount.accountNumber}
                  </p>
                </div>
                <motion.button
                  whileTap={{ scale: 0.93 }}
                  onClick={copyAccount}
                  className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    copied
                      ? 'bg-green-500 text-white'
                      : 'bg-navy-900 text-white hover:bg-navy-800'
                  }`}
                >
                  {copied ? '✓ Copied' : 'Copy'}
                </motion.button>
              </div>
            </div>
          </Card>
        )}

        {/* Actions grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: '💳', label: 'Fund by card', desc: 'Nomba Checkout', path: '/wallet/fund' },
            { icon: '📋', label: 'Transactions', desc: 'Full history', path: '/transactions' },
          ].map(a => (
            <Card
              key={a.path}
              hoverable
              onClick={() => navigate(a.path)}
              padding="sm"
            >
              <span className="text-3xl mb-2 block">{a.icon}</span>
              <p className="font-bold text-navy-900 text-sm">{a.label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{a.desc}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}