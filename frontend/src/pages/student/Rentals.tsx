import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { rentalsApi } from '../../api/rentals.api'
import { TopBar } from '../../components/shared/TopBar'
import { Card, Skeleton } from '../../components/ui/Card'
import { StatusPill } from '../../components/ui/Badge'
import { EmptyState } from '../../components/ui/EmptyState'
import { useCountdown } from '../../hooks/useCountdown'
import { deviceEmoji, deviceLabel, formatCurrency, formatDate } from '../../utils'
import type { Rental } from '../../types'
import { 
  MdKeyboardReturn, 
  MdClose, 
  MdTimer, 
  MdConfirmationNumber, 
  MdErrorOutline, 
  MdRefresh,
  MdCheckCircleOutline,
  MdAutorenew,
  MdInfoOutline,
  MdBolt,
  MdAccountBalanceWallet
} from 'react-icons/md'

const TABS = [
  { value: 'active', label: '⚡ Active' },
  { value: 'returned', label: '✅ Returned' },
  { value: 'overdue', label: '⚠️ Overdue' },
  { value: 'cancelled', label: '❌ Cancelled' },
]

export default function Rentals() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  
  const targetRentalId = searchParams.get('id')
  const [tab, setTab] = useState('active')
  const [selectedRental, setSelectedRental] = useState<Rental | null>(null)
  const [drawerStep, setDrawerStep] = useState<'details' | 'confirming' | 'success'>('details')

  // Parallel remote query data source mapper
  const { data, isLoading, error, isError, refetch } = useQuery({
    queryKey: ['rentals', tab],
    queryFn: async () => {
      try {
        const response = await rentalsApi.getMyRentals({ status: tab })
        return response
      } catch (err: any) {
        throw new Error(err?.response?.data?.message || err?.message || "Failed to communicate with rentals client endpoint")
      }
    },
    staleTime: 1000 * 10,
  })

  const rentals = (data as any)?.rentals as Rental[] || []

  // Dynamic mutation processing sequences mapped directly to confirmReturn endpoint
  const returnMutation = useMutation({
    mutationFn: (payload: { id: string; confirmationCode: string }) => 
      rentalsApi.confirmReturn(payload.id, payload.confirmationCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rentals'] })
      queryClient.invalidateQueries({ queryKey: ['wallet'] })
      queryClient.invalidateQueries({ queryKey: ['user'] })
      setDrawerStep('success')
    },
    onError: (err: any) => {
      console.error("Return Processing Rejected:", err)
      alert(err?.response?.data?.message || "Could not complete return processing at this time.")
    }
  })

  // Deep linking sync controller
  useEffect(() => {
    if (targetRentalId && rentals.length > 0) {
      const matchingRental = rentals.find(r => r._id === targetRentalId)
      if (matchingRental) {
        setSelectedRental(matchingRental)
        setDrawerStep('details')
      }
    }
  }, [targetRentalId, rentals])

  const handleCloseDetailDrawer = () => {
    setSelectedRental(null)
    setDrawerStep('details')
    setSearchParams({}, { replace: true })
  }

  return (
    <div className="bg-slate-50 min-h-svh relative pb-12">
      <TopBar title="My Rentals" onBack={() => navigate('/')} />

      {/* ── Tabs Segmented Control Bar ──────────────────── */}
      <div className="bg-white/80 backdrop-blur-md px-5 py-3.5 border-b border-slate-100 flex gap-2 overflow-x-auto scrollbar-none sticky top-0 z-10">
        {TABS.map(t => (
          <button
            key={t.value}
            onClick={() => {
              setTab(t.value)
              if (selectedRental) handleCloseDetailDrawer()
            }}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black whitespace-nowrap transition-all duration-200 tracking-tight ${
              tab === t.value 
                ? 'bg-navy-900 text-white shadow-md shadow-navy-900/10 scale-[1.02]' 
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200/70'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Main Scroll View Panel Body ───────────── */}
      <div className="px-5 py-5">
        {isError ? (
          <div className="bg-white rounded-[32px] p-6 border border-red-100 text-center shadow-sm max-w-md mx-auto my-6">
            <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center text-red-500 mx-auto mb-4">
              <MdErrorOutline size={28} />
            </div>
            <h3 className="text-navy-900 font-black text-base mb-1">Sync Communications Fault</h3>
            <p className="text-xs text-slate-400 mb-5 bg-slate-50 p-3 rounded-2xl font-mono text-left break-all border border-slate-100">
              {(error as Error)?.message}
            </p>
            <button 
              onClick={() => refetch()} 
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-navy-900 text-white text-xs font-black tracking-wider uppercase hover:bg-navy-800 transition-colors"
            >
              <MdRefresh size={16} /> Re-establish Interface
            </button>
          </div>
        ) : isLoading ? (
          <div className="flex flex-col gap-3.5">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-[28px]" />)}
          </div>
        ) : rentals.length === 0 ? (
          <div className="pt-8">
            <EmptyState
              icon="🔋"
              title={`No ${tab} records found`}
              description={tab === 'active' ? 'You currently do not have any active hardware components rented.' : undefined}
              action={tab === 'active' ? { label: 'Explore Power Stations', onClick: () => navigate('/stations') } : undefined}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-3.5">
            {rentals.map((r, i) => (
              <motion.div
                key={r._id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, type: "spring", damping: 20 }}
              >
                <RentalCard 
                  rental={r} 
                  isSelected={selectedRental?._id === r._id}
                  onClick={() => setSelectedRental(r)} 
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ── Action Sheet Sheet Sheet Bottom Modal Context Drawer ── */}
      <AnimatePresence>
        {selectedRental && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={returnMutation.isPending ? undefined : handleCloseDetailDrawer}
              className="fixed inset-0 bg-navy-950/60 backdrop-blur-md z-40"
            />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 210 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[36px] p-6 shadow-2xl z-50 max-w-md mx-auto border-t border-slate-100 pb-10"
            >
              <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-6" />

              {/* ─ STEP 1: DETAILED SPECS BREAKDOWN ─ */}
              {drawerStep === 'details' && (
                <div>
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center justify-center text-4xl shadow-inner relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-tr from-slate-500/5 to-transparent" />
                        {deviceEmoji(selectedRental.deviceType)}
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-navy-900 leading-tight">
                          {deviceLabel(selectedRental.deviceType)}
                        </h3>
                        <div className="flex items-center gap-2 mt-1.5">
                          <StatusPill status={selectedRental.status} />
                          <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md">
                            ID: {selectedRental._id.slice(-6).toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button onClick={handleCloseDetailDrawer} className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
                      <MdClose size={20} />
                    </button>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-4 flex flex-col gap-3.5 mb-6 border border-slate-100 shadow-inner">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-400 font-bold flex items-center gap-2">
                        <MdConfirmationNumber size={18} className="text-blue-500" /> Target Locker Slot
                      </span>
                      <span className="font-black text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1 rounded-xl text-xs tracking-wide">
                        SLOT {selectedRental.lockerAssigned || '—'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm border-t border-slate-200/60 pt-3.5">
                      <span className="text-slate-400 font-bold flex items-center gap-2">
                        <MdBolt size={18} className="text-amber-500" /> Start Date Timestamp
                      </span>
                      <span className="font-black text-slate-700 text-xs">{formatDate(selectedRental.startTime)}</span>
                    </div>

                    <div className="flex justify-between items-center text-sm border-t border-slate-200/60 pt-3.5">
                      <span className="text-slate-400 font-bold flex items-center gap-2">
                        <MdAccountBalanceWallet size={18} className="text-emerald-500" /> Escrow Collateral Base
                      </span>
                      <span className="font-black text-emerald-600 text-sm">{formatCurrency(selectedRental.totalPaid)}</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button onClick={handleCloseDetailDrawer} className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black text-sm transition-colors">
                      Dismiss Panel
                    </button>
                    {selectedRental.status === 'active' && (
                      <button
                        onClick={() => setDrawerStep('confirming')}
                        className="flex-1 py-4 bg-gradient-to-r from-emerald-500 to-green-600 hover:opacity-95 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-green-200 transition-all"
                      >
                        <MdKeyboardReturn size={20} />
                        Process Return
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* ─ STEP 2: GATEWAY INTERACTIVE VALIDATION STEP ─ */}
              {drawerStep === 'confirming' && (
                <div className="text-center py-2">
                  <div className="w-16 h-16 bg-amber-50 border border-amber-200 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 animate-pulse">
                    ⚡
                  </div>
                  <h3 className="text-xl font-black text-navy-900 mb-1.5">Verify Lock Insertion</h3>
                  <p className="text-sm text-slate-500 max-w-xs mx-auto mb-5 leading-relaxed">
                    Please make sure the device is securely plugged into terminal port <span className="font-black text-navy-900 bg-slate-100 px-2 py-0.5 rounded-md">Locker {selectedRental.lockerAssigned}</span> before continuing.
                  </p>

                  {/* Token Card Output Layer Display */}
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 mb-6 text-left flex items-start gap-3">
                    <MdInfoOutline size={20} className="text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-black text-amber-800 uppercase tracking-wider mb-0.5">Authorization Token</p>
                      <p className="font-mono text-2xl font-black tracking-[0.2em] text-amber-600">{selectedRental.confirmationCode}</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      disabled={returnMutation.isPending}
                      onClick={() => setDrawerStep('details')}
                      className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black text-sm disabled:opacity-50 transition-colors"
                    >
                      Abort Route
                    </button>
                    <button
                      disabled={returnMutation.isPending}
                      onClick={() => 
                        returnMutation.mutate({ 
                          id: selectedRental._id, 
                          confirmationCode: selectedRental.confirmationCode 
                        })
                      }
                      className="flex-1 py-4 bg-navy-900 hover:bg-navy-800 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 disabled:opacity-80 transition-all shadow-lg shadow-navy-900/10"
                    >
                      {returnMutation.isPending ? (
                        <>
                          <MdAutorenew size={18} className="animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        'Confirm Dropoff'
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* ─ STEP 3: TERMINAL STATUS SUCCESS SHEET ─ */}
              {drawerStep === 'success' && (
                <div className="text-center py-4">
                  <div className="w-20 h-20 bg-emerald-50 border-2 border-emerald-200 rounded-full flex items-center justify-center text-emerald-500 mx-auto mb-5 shadow-inner shadow-emerald-100">
                    <MdCheckCircleOutline size={44} className="animate-scaleUp" />
                  </div>
                  <h3 className="text-2xl font-black text-navy-900 mb-1.5 tracking-tight">Return Confirmed!</h3>
                  <p className="text-sm text-slate-400 max-w-xs mx-auto mb-6 leading-relaxed">
                    Locker lock cycle completed successfully. Your micro-deposit refund has been cleared and disbursed directly into your virtual wallet.
                  </p>
                  <button
                    onClick={handleCloseDetailDrawer}
                    className="w-full py-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-2xl font-black text-sm transition-all shadow-lg shadow-green-200 hover:opacity-95"
                  >
                    Return to Dashboard
                  </button>
                </div>
              )}

            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Refined Sub-Card Component ─────────────────────────────
const RentalCard = ({ rental, isSelected, onClick }: { rental: Rental; isSelected: boolean; onClick: () => void }) => {
  const { timeLeft, isOverdue } = useCountdown(
    rental.status === 'active' ? rental.expectedReturnTime : null
  )

  const activeStatusColor = isOverdue
    ? { text: 'text-amber-500', bg: 'bg-amber-50 border-amber-100' }
    : { text: 'text-emerald-600', bg: 'bg-emerald-50/60 border-emerald-100/70' }

  return (
    <Card 
      hoverable 
      onClick={onClick}
      className={`transition-all duration-300 rounded-[24px] border-2 cursor-pointer p-4.5 bg-white ${
        isSelected 
          ? 'border-emerald-500 shadow-md ring-4 ring-emerald-50 bg-gradient-to-b from-white to-slate-50/40' 
          : 'border-slate-100/80 shadow-sm hover:shadow-md hover:border-slate-200'
      }`}
    >
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-3xl flex-shrink-0 shadow-sm border border-slate-100 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-500/5 rounded-2xl" />
          {deviceEmoji(rental.deviceType)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-black text-navy-900 text-base tracking-tight truncate">
              {deviceLabel(rental.deviceType)}
            </p>
            <StatusPill status={rental.status} />
          </div>
          
          <p className="text-xs text-slate-400 mt-1 font-semibold flex items-center gap-1.5">
            {formatDate(rental.startTime)}
            <span className="text-slate-300">•</span>
            <span className="font-black text-slate-700">{formatCurrency(rental.totalPaid)}</span>
          </p>

          {rental.status === 'active' && (
            <div className={`inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-xl border ${activeStatusColor.bg}`}>
              <MdTimer size={14} className={activeStatusColor.text} />
              <p className={`text-[11px] font-black tracking-tight ${activeStatusColor.text}`}>
                {timeLeft}
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}