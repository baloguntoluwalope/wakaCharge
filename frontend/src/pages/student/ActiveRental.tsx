import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { rentalsApi } from '../../api/rentals.api'
import { useCountdown } from '../../hooks/useCountdown'
import { useToast } from '../../components/ui/Toast'
import { formatCurrency, deviceEmoji, deviceLabel } from '../../utils'
import {
  MdArrowBack,
  MdTimer,
  MdWarning,
  MdBatteryChargingFull,
  MdLock,
  MdLockOpen,
  MdKeyboardReturn,
  MdInfoOutline
} from 'react-icons/md'

export default function ActiveRental() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { toast } = useToast()
  const qc = useQueryClient()

  // Fetch single rental details
  const { data: rental, isLoading, error } = useQuery({
    queryKey: ['rental', id],
    queryFn: () => rentalsApi.getRentalById(id!),
    enabled: !!id,
    staleTime: 1000 * 30,
  })

  // Hook handles live clock ticking down or overdue state
  const { timeLeft, isOverdue } = useCountdown(rental?.expectedReturnTime || new Date().toISOString())

  const { mutate: initiateReturn, isPending: returning } = useMutation({
    mutationFn: () => rentalsApi.initiateReturn(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rentals'] })
      qc.invalidateQueries({ queryKey: ['rental', id] })
      toast('Return process initiated successfully!', 'success')
    },
    onError: (err: any) => {
      toast(err.response?.data?.message || 'Could not initiate return', 'error')
    },
  })

  if (isLoading) {
    return (
      <div className="min-h-svh bg-slate-50 flex items-center justify-center p-6">
        <div className="w-8 h-8 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !rental) {
    return (
      <div className="min-h-svh bg-slate-50 p-6 flex flex-col items-center justify-center text-center">
        <MdWarning size={40} className="text-red-500 mb-2" />
        <h2 className="text-lg font-black text-navy-900">Failed to load rental</h2>
        <p className="text-sm text-slate-500 mb-4">The rental record could not be fetched.</p>
        <button onClick={() => navigate(-1)} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl font-bold text-sm">
          Go Back
        </button>
      </div>
    )
  }

  // Calculate matching colors for context urgency
  const diff = new Date(rental.expectedReturnTime).getTime() - Date.now()
  const mins = diff / 60000
  const urgencyStr = isOverdue ? 'overdue' : mins < 30 ? 'urgent' : 'normal'

  const themeClasses = {
    overdue: { border: 'border-red-200', bg: 'bg-red-50', text: 'text-red-600', fill: 'bg-red-500' },
    urgent: { border: 'border-amber-200', bg: 'bg-amber-50', text: 'text-amber-600', fill: 'bg-amber-500' },
    normal: { border: 'border-green-200', bg: 'bg-green-50', text: 'text-green-600', fill: 'bg-green-500' },
  }[urgencyStr]

  return (
    <div className="min-h-svh bg-slate-50 pb-12">
      {/* Navbar header section */}
      <div className="bg-white border-b border-slate-100 px-5 pt-14 pb-4 flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)} 
          className="w-10 h-10 bg-slate-100 flex items-center justify-center rounded-2xl text-slate-700 hover:bg-slate-200"
        >
          <MdArrowBack size={20} />
        </button>
        <div>
          <h1 className="text-xl font-black text-navy-900 leading-tight">Rental details</h1>
          <p className="text-[10px] font-mono text-slate-400">ID: {rental._id}</p>
        </div>
      </div>

      <div className="p-5 flex flex-col gap-5">
        {/* Urgency warning header banner */}
        <div className={`rounded-3xl border-2 ${themeClasses.border} ${themeClasses.bg} p-4 flex items-center justify-between`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl ${themeClasses.fill} flex items-center justify-center text-white`}>
              {isOverdue ? <MdWarning size={16} /> : <MdTimer size={16} />}
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Remaining Time</p>
              <p className={`text-base font-black ${themeClasses.text}`}>{timeLeft}</p>
            </div>
          </div>
          <div className="text-right">
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full text-white ${themeClasses.fill}`}>
              {isOverdue ? 'Overdue' : 'Active'}
            </span>
          </div>
        </div>

        {/* Device Information Summary */}
        <div className="bg-white border border-slate-100 rounded-3xl p-5">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-3xl shadow-sm border border-slate-100">
              {deviceEmoji(rental.deviceType)}
            </div>
            <div>
              <h2 className="text-lg font-black text-navy-900">{deviceLabel(rental.deviceType)}</h2>
              <p className="text-xs text-slate-400">Deposit: {formatCurrency(rental.depositAmount)}</p>
            </div>
          </div>

          <hr className="border-slate-100 my-4" />

          {/* Grid of locker locations */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-3 rounded-2xl flex items-center gap-3">
              {rental.lockerStatus === 'locked' ? <MdLock className="text-slate-400" size={20} /> : <MdLockOpen className="text-green-500" size={20} />}
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Locker Node</p>
                <p className="text-sm font-black text-navy-900">Box #{rental.lockerAssigned}</p>
              </div>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl flex items-center gap-3">
              <MdBatteryChargingFull className="text-green-500" size={20} />
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Status</p>
                <p className="text-sm font-black text-navy-900">{rental.lockerStatus || 'Secured'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Return code action card */}
        <div className="bg-white border-2 border-amber-200 rounded-3xl p-5 text-center shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
            Your return token code
          </p>
          <p className="font-mono font-black text-4xl tracking-widest text-amber-500 my-2">
            {rental.confirmationCode}
          </p>
          <div className="bg-amber-50/60 border border-amber-100 rounded-2xl p-3 flex items-start gap-2.5 text-left mt-3">
            <MdInfoOutline size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-[11px] leading-relaxed text-amber-800 font-medium">
              Provide this confirmation signature to the dispatch hub assistant after handing over your machine tool to conclude the logging cycle safely.
            </p>
          </div>
        </div>

        {/* Trigger execution hook */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => initiateReturn()}
          disabled={returning}
          className={`w-full py-4 rounded-2xl text-white font-black text-sm flex items-center justify-center gap-2 shadow-sm ${themeClasses.fill} disabled:opacity-50`}
        >
          {returning ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <MdKeyboardReturn size={18} />
          )}
          Complete Return Cycle
        </motion.button>
      </div>
    </div>
  )
}
