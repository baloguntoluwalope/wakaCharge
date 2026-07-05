import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  MdAccountBalanceWallet,
  MdArrowForward,
  MdContentCopy,
  MdCheckCircle,
  MdCreditCard,
  MdBolt,
} from 'react-icons/md'
import { useState } from 'react'

interface EmptyWalletProps {
  virtualAccountNumber?: string
  virtualAccountBank?: string
  userName?: string
  compact?: boolean
}

export const EmptyWallet = ({
  virtualAccountNumber,
  virtualAccountBank,
  userName,
  compact = false,
}: EmptyWalletProps) => {
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)

  const copyAccount = () => {
    if (!virtualAccountNumber) return
    navigator.clipboard.writeText(virtualAccountNumber)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-4 text-center"
      >
        <MdAccountBalanceWallet size={24} className="text-slate-300 mx-auto mb-2" />
        <p className="text-sm font-bold text-navy-900 mb-0.5">Wallet empty</p>
        <p className="text-xs text-slate-400 mb-3">
          Fund your wallet to start renting devices
        </p>
        <button
          onClick={() => navigate('/wallet/fund')}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-500 text-white text-xs font-bold hover:bg-green-400 transition-all"
        >
          Fund wallet
          <MdArrowForward size={13} />
        </button>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl overflow-hidden border border-slate-100 bg-white shadow-sm"
    >
      {/* Top gradient strip */}
      <div
        className="relative px-6 py-7 text-center overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #0b1420 0%, #0f2318 100%)'
        }}
      >
        {/* Decorative glow */}
        <div
          className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #1db954, transparent)', transform: 'translate(30%, -30%)' }}
        />
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 14 }}
          className="relative w-16 h-16 rounded-2xl bg-green-500/15 border border-green-400/30 flex items-center justify-center mx-auto mb-4"
        >
          <MdAccountBalanceWallet size={30} className="text-green-400" />
        </motion.div>
        <h3 className="relative font-black text-white text-lg mb-1.5">
          Fund your wallet to get started
        </h3>
        <p className="relative text-white/50 text-sm leading-relaxed max-w-xs mx-auto">
          You need a balance to rent devices at any campus kiosk station.
        </p>
      </div>

      {/* Options */}
      <div className="p-5 flex flex-col gap-3">

        {/* Option 1 — Bank transfer */}
        {virtualAccountNumber && (
          <div className="rounded-2xl border-2 border-green-100 bg-green-50/40 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-[11px] font-black flex-shrink-0">
                  1
                </div>
                <p className="text-xs font-bold text-navy-900 uppercase tracking-widest">
                  Bank transfer
                </p>
              </div>
              <span className="text-xs font-bold text-green-700 bg-green-100 border border-green-200 px-2.5 py-1 rounded-full flex items-center gap-1">
                <MdBolt size={11} />
                Instant
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-3 leading-relaxed">
              Transfer any amount from any bank to your dedicated Nomba account.
              Credited immediately.
            </p>
            <div className="bg-white border-2 border-slate-200 rounded-xl p-3.5">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5">
                {virtualAccountBank || 'Nomba'} · {userName}
              </p>
              <div className="flex items-center justify-between gap-3">
                <p className="font-mono font-black text-xl text-navy-900 tracking-widest">
                  {virtualAccountNumber}
                </p>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={copyAccount}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all flex-shrink-0 ${
                    copied
                      ? 'bg-green-500 text-white'
                      : 'bg-navy-900 text-white hover:bg-navy-800'
                  }`}
                  style={!copied ? { background: '#0b1420' } : undefined}
                >
                  {copied ? (
                    <><MdCheckCircle size={14} /> Copied</>
                  ) : (
                    <><MdContentCopy size={14} /> Copy</>
                  )}
                </motion.button>
              </div>
            </div>
          </div>
        )}

        {/* Option 2 — Card payment */}
        <div className="rounded-2xl border-2 border-slate-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-slate-300 text-white flex items-center justify-center text-[11px] font-black flex-shrink-0">
                2
              </div>
              <p className="text-xs font-bold text-navy-900 uppercase tracking-widest">
                Card payment
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full">
              Nomba Checkout
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Pay with your debit or credit card via Nomba's secure checkout.
          </p>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/wallet/fund')}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white text-sm font-black transition-all shadow-md"
            style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)' }}
          >
            <MdCreditCard size={17} />
            Pay by card
            <MdArrowForward size={15} />
          </motion.button>
        </div>

        {/* Minimum info */}
        <div className="flex items-center justify-center gap-1.5 pt-1">
          <div className="w-1 h-1 rounded-full bg-slate-300" />
          <p className="text-center text-xs text-slate-400">
            Minimum <strong className="text-navy-700 font-bold">₦100</strong> ·
            Deposits fully refundable on return
          </p>
          <div className="w-1 h-1 rounded-full bg-slate-300" />
        </div>
      </div>
    </motion.div>
  )
}