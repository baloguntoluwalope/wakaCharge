import React, { useState } from 'react'
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
    <div className="bg-[#f5f9f6] min-h-svh text-slate-800 antialiased">
      <TopBar title="Waka Wallet" onBack={false} />
      
      <div className="px-5 py-5 flex flex-col gap-5">
        
        {/* Wallet Balance Header */}
        {isLoading ? (
          <Skeleton className="h-52 rounded-3xl" style={{ background: '#f0f7f3' }} />
        ) : (
          <WalletCard
            balance={wallet?.walletBalance || 0}
            accountNumber={wallet?.virtualAccount?.accountNumber}
            bankName={wallet?.virtualAccount?.bankName}
            accountName={wallet?.virtualAccount?.accountName}
            onFund={() => navigate('/wallet/fund')}
            onView={() => navigate('/transactions')}
            variant="mint-light" 
          />
        )}

        {/* Virtual Account Receipt Details Frame */}
        {wallet?.virtualAccount?.accountNumber && (
          <Card className="bg-white rounded-[2rem] border border-emerald-800/5 p-5 shadow-[0_4px_25px_rgba(2,44,22,0.01)]">
            <div className="flex items-center gap-1.5 mb-3">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                Nomba Virtual Account
              </span>
            </div>
            
            <div className="text-xs text-slate-500 mb-4 font-medium flex items-start gap-1.5 leading-normal">
              <svg className="w-4 h-4 text-[#00b259] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Transfer money here from any banking platform to credit your wallet instantly.</span>
            </div>
            
            <div className="bg-emerald-50/40 rounded-2xl p-4 border border-emerald-100/50">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Bank</p>
                  <p className="font-extrabold text-slate-900 text-sm">
                    {wallet.virtualAccount.bankName || 'Nomba Bank'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Account Name</p>
                  <p className="font-extrabold text-slate-900 text-sm truncate max-w-[160px]">
                    {wallet.virtualAccount.accountName}
                  </p>
                </div>
              </div>
              
              <div className="border-t border-emerald-100/40 pt-3.5 flex items-end justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Account Number</p>
                  <p className="font-mono text-2xl font-black text-slate-900 tracking-widest leading-none">
                    {wallet.virtualAccount.accountNumber}
                  </p>
                </div>
                
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={copyAccount}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm ${
                    copied
                      ? 'bg-[#00b259] text-white'
                      : 'bg-slate-950 text-white hover:bg-slate-800'
                  }`}
                >
                  {copied ? (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                      <span>Copy</span>
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </Card>
        )}

        {/* Action Navigation Matrix */}
        <div className="grid grid-cols-2 gap-3">
          <Card
            onClick={() => navigate('/wallet/fund')}
            className="bg-white rounded-[2rem] border border-emerald-800/5 p-4 text-left shadow-[0_4px_25px_rgba(2,44,22,0.01)] hover:border-emerald-200 transition-all cursor-pointer group"
          >
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-[#00b259] flex items-center justify-center mb-3 border border-emerald-100 group-hover:scale-105 transition-transform">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <p className="font-black text-slate-900 text-sm">Fund by card</p>
            <p className="text-[11px] font-medium text-slate-400 mt-0.5">Nomba Checkout</p>
          </Card>

          <Card
            onClick={() => navigate('/transactions')}
            className="bg-white rounded-[2rem] border border-emerald-800/5 p-4 text-left shadow-[0_4px_25px_rgba(2,44,22,0.01)] hover:border-emerald-200 transition-all cursor-pointer group"
          >
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-[#00b259] flex items-center justify-center mb-3 border border-emerald-100 group-hover:scale-105 transition-transform">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <p className="font-black text-slate-900 text-sm">Transactions</p>
            <p className="text-[11px] font-medium text-slate-400 mt-0.5">Full history</p>
          </Card>
        </div>
        
      </div>
    </div>
  )
}