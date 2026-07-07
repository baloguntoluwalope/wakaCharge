import { useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { FaClipboardList } from 'react-icons/fa6'
import { paymentsApi } from '../../api/payments.api'
import { TopBar } from '../../components/shared/TopBar'
import { Skeleton } from '../../components/ui/Card'
import { StatusPill } from '../../components/ui/Badge'
import { EmptyState } from '../../components/ui/EmptyState'
import { Button } from '../../components/ui/Button'
import { groupByDate, formatCurrency, formatTime, formatDate } from '../../utils'
import { TRANSACTION_META } from '../../theme/tokens'
import type { Transaction } from '../../types'
import { 
  MdClose, 
  MdReceipt, 
  MdOutlineContentCopy, 
  MdCalendarMonth, 
  MdOutlineFingerprint, 
  MdCompareArrows,
  MdDownload,
  MdBolt
} from 'react-icons/md'

const FILTERS = [
  { value: '', label: 'All' },
  { value: 'wallet_funding', label: 'Funded' },
  { value: 'rental_payment', label: 'Rentals' },
  { value: 'deposit_refund', label: 'Refunds' },
  { value: 'late_fee', label: 'Late fees' },
]

export default function Transactions() {
  const [filter, setFilter] = useState('')
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null)

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ['transactions', filter],
      queryFn: ({ pageParam = 1 }) =>
        paymentsApi.getTransactions({ type: filter || undefined, page: pageParam as number, limit: 20 }),
      getNextPageParam: (last: any, all) => {
        const total = last?.total || 0
        const loaded = all.flatMap((p: any) => p.transactions || []).length
        return loaded < total ? all.length + 1 : undefined
      },
      initialPageParam: 1,
    })

  const allTxns = data?.pages.flatMap((p: any) => p.transactions || []) as Transaction[]
  const grouped = allTxns ? groupByDate(allTxns) : {}

  const activeMeta = selectedTx ? (TRANSACTION_META[selectedTx.type] || {
    label: selectedTx.type, icon: FaClipboardList, isCredit: false
  }) : null

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert("Reference ID copied!")
  }

  const handleDownloadPDF = () => {
    window.print()
  }

  return (
    <div className="bg-slate-50 min-h-svh relative pb-12 print:bg-white print:pb-0">
      {/* Hide controls during OS print pipeline maps */}
      <div className="print:hidden">
        <TopBar title="Transactions" onBack={false} />

        {/* ── Filters ────────────────────────────────────── */}
        <div className="bg-white/80 backdrop-blur-md px-5 py-3.5 border-b border-slate-100 flex gap-2 overflow-x-auto scrollbar-none sticky top-0 z-10">
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-2 rounded-2xl text-xs font-black whitespace-nowrap transition-all duration-200 ${
                filter === f.value
                  ? 'bg-navy-900 text-white shadow-md shadow-navy-900/10 scale-[1.02]'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200/70'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main List Container ───────────────────────── */}
      <div className="px-5 py-4 print:hidden">
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}
          </div>
        ) : !allTxns?.length ? (
          <div className="pt-8">
            <EmptyState
              icon={<FaClipboardList />}
              title="No transactions yet"
              description="Fund your wallet to get started"
            />
          </div>
        ) : (
          <>
            {Object.entries(grouped).map(([date, items]) => (
              <div key={date} className="mb-6">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 pl-1">
                  {date}
                </p>
                <div className="bg-white rounded-[28px] border border-slate-100/80 shadow-sm overflow-hidden">
                  {(items as Transaction[]).map((tx, i) => {
                    const meta = TRANSACTION_META[tx.type] || {
                      label: tx.type, icon: FaClipboardList, isCredit: false
                    }
                    const Icon = meta.icon
                    return (
                      <motion.div
                        key={tx._id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        onClick={() => setSelectedTx(tx)}
                        className={`flex items-center gap-4 px-4 py-4 cursor-pointer hover:bg-slate-50/70 transition-all active:scale-[0.99] ${
                          i < items.length - 1 ? 'border-b border-slate-100/60' : ''
                        }`}
                      >
                        <div className="w-11 h-11 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-xl flex-shrink-0 shadow-inner">
                          <Icon className="text-navy-900" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-navy-900 text-sm tracking-tight truncate">
                            {meta.label}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs font-semibold text-slate-400">{formatTime(tx.createdAt)}</p>
                            <StatusPill status={tx.status} />
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 pl-2">
                          <p className={`font-black text-base tracking-tight ${
                            meta.isCredit ? 'text-emerald-600' : 'text-navy-900'
                          }`}>
                            {meta.isCredit ? '+' : '-'}{formatCurrency(tx.amount)}
                          </p>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            ))}

            {hasNextPage && (
              <div className="mt-4 mb-6">
                <Button
                  variant="secondary"
                  fullWidth
                  loading={isFetchingNextPage}
                  onClick={() => fetchNextPage()}
                  className="rounded-2xl font-black text-sm py-3.5 border-2 border-slate-200"
                >
                  Load more transactions
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Transaction Receipt Bottom Sheet Modal ── */}
      <AnimatePresence>
        {selectedTx && activeMeta && (
          <>
            {/* Backdrop layer overlay wrapper */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTx(null)}
              className="fixed inset-0 bg-navy-950/60 backdrop-blur-md z-40 print:hidden"
            />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 210 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[36px] p-6 shadow-2xl z-50 max-w-md mx-auto border-t border-slate-100 pb-10 print:static print:border-none print:shadow-none print:p-0"
            >
              {/* Top controls container block context row */}
              <div className="flex items-center justify-between mb-6 print:hidden">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-navy-50 flex items-center justify-center text-navy-900">
                    <MdReceipt size={22} />
                  </div>
                  <h3 className="text-lg font-black text-navy-900 tracking-tight">Transaction Receipt</h3>
                </div>
                <button 
                  onClick={() => setSelectedTx(null)} 
                  className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
                >
                  <MdClose size={20} />
                </button>
              </div>

              {/* ── PRINT OBJECT TARGET PORTAL CONTAINER ── */}
              <div className="print:block print:my-10">
                
                {/* Waka Charge Colorful Branding Header */}
                <div className="text-center mb-8 flex flex-col items-center justify-center">
                  <div className="w-14 h-14 bg-gradient-to-tr from-amber-400 via-orange-500 to-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-500/20 mb-2.5">
                    <MdBolt size={34} className="animate-pulse" />
                  </div>
                  <h2 className="text-2xl font-black text-navy-900 tracking-tighter uppercase">
                    Waka<span className="text-orange-500">Charge</span>
                  </h2>
                  <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mt-0.5">
                    Smart Power Network Terminal
                  </p>
                </div>

                {/* Central Amount Display */}
                <div className="text-center py-6 bg-gradient-to-b from-slate-50 to-white rounded-3xl border border-slate-100 shadow-inner mb-6 relative overflow-hidden print:bg-slate-50">
                  <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Paid</p>
                  <h2 className={`text-4xl font-black tracking-tight ${activeMeta.isCredit ? 'text-emerald-600' : 'text-navy-900'}`}>
                    {activeMeta.isCredit ? '+' : '-'}{formatCurrency(selectedTx.amount)}
                  </h2>
                  <div className="inline-block mt-3">
                    <StatusPill status={selectedTx.status} />
                  </div>
                </div>

                {/* Receipt Details Undertext Matrix Spec Sheet */}
                <div className="bg-slate-50/50 rounded-2xl p-4 flex flex-col gap-3.5 border border-slate-100/70 mb-8 print:border-slate-200">
                  <div className="flex justify-between items-start text-xs">
                    <span className="text-slate-400 font-bold flex items-center gap-2">
                      <MdCompareArrows size={16} className="text-slate-400" /> Transaction Type
                    </span>
                    <span className="font-black text-navy-900 text-right max-w-[200px] break-words">
                      {activeMeta.label}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs border-t border-slate-100 pt-3.5 print:border-slate-200">
                    <span className="text-slate-400 font-bold flex items-center gap-2">
                      <MdCalendarMonth size={16} className="text-slate-400" /> Payment Date
                    </span>
                    <span className="font-bold text-slate-600">
                      {formatDate(selectedTx.createdAt)} · {formatTime(selectedTx.createdAt)}
                    </span>
                  </div>

                  <div className="flex justify-between items-start text-xs border-t border-slate-100 pt-3.5 print:border-slate-200">
                    <span className="text-slate-400 font-bold flex items-center gap-2">
                      <MdOutlineFingerprint size={16} className="text-slate-400" /> Reference Log ID
                    </span>
                    <button 
                      onClick={() => copyToClipboard(selectedTx._id)}
                      className="font-mono font-bold text-[10px] bg-white hover:bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md text-slate-500 flex items-center gap-1 transition-all active:scale-95 print:border-none print:p-0"
                    >
                      <span>{selectedTx._id.toUpperCase()}</span>
                      <MdOutlineContentCopy size={12} className="text-slate-400 print:hidden" />
                    </button>
                  </div>
                </div>

                {/* Micro Footer Notice inside Document print output block */}
                <p className="hidden print:block text-center text-[10px] text-slate-400 font-medium tracking-wide">
                  Thank you for using WakaCharge. For support logs contact support@wakacharge.internal.
                </p>
              </div>

              {/* Action Sheet Operating Controls Bar */}
              <div className="flex gap-3 print:hidden">
                <button 
                  onClick={handleDownloadPDF}
                  className="flex-1 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-colors shadow-lg shadow-orange-500/10"
                >
                  <MdDownload size={18} />
                  Download PDF
                </button>
                <button
                  onClick={() => setSelectedTx(null)}
                  className="flex-1 py-4 bg-navy-900 hover:bg-navy-800 text-white rounded-2xl font-black text-sm transition-all"
                >
                  Dismiss Sheet
                </button>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Global Layout Print Document Styles Injection Override ── */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:block, .print\\:block * {
            visibility: visible;
          }
          .print\\:block {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            max-width: 100%;
            padding: 20px;
          }
        }
      `}</style>
    </div>
  )
}