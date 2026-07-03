import { useState } from 'react'
import { useNavigate, useLocation, Outlet } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MdDashboard, MdInventory, MdAssignment,
  MdSearch, MdLogout, MdMenu, MdClose,
  MdCheckCircle, MdWarning, MdRefresh,
  MdAccessTime, MdPerson, MdQrCodeScanner,
  MdBatteryChargingFull, MdReportProblem,
  MdSchedule, MdKeyboardArrowRight,
  MdNotifications, MdStore
} from 'react-icons/md'
import { operatorApi } from '../../api/operator.api'
import { authApi } from '../../api/auth.api'
import { useAuth } from '../../context/AuthContext'
import { Badge, StatusPill } from '../../components/ui/Badge'
import { useToast } from '../../components/ui/Toast'
import { deviceEmoji, deviceLabel, formatDateTime } from '../../utils'

// ─── Sidebar nav items ───────────────────────────────────
const NAV = [
  { id: 'dashboard',  label: 'Dashboard',   icon: <MdDashboard size={20} /> },
  { id: 'rentals',    label: 'Rentals',      icon: <MdAssignment size={20} /> },
  { id: 'inventory',  label: 'Inventory',    icon: <MdInventory size={20} /> },
  { id: 'search',     label: 'Find Student', icon: <MdSearch size={20} /> },
]

// ─── Layout ──────────────────────────────────────────────
export default function OperatorDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [clockedIn, setClockedIn] = useState(false)
  const [clockInTime, setClockInTime] = useState<string | null>(null)

  const qc = useQueryClient()

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['operator-dashboard'],
    queryFn: operatorApi.getDashboard,
    refetchInterval: 30000,
  })

  const dash = data as any

  const { mutate: clockIn, isPending: clockingIn } = useMutation({
    mutationFn: operatorApi.clockIn,
    onSuccess: () => {
      setClockedIn(true)
      setClockInTime(new Date().toISOString())
      toast('Clocked in. Have a great shift!', 'success')
    },
    onError: () => toast('Clock in failed', 'error'),
  })

  const { mutate: clockOut, isPending: clockingOut } = useMutation({
    mutationFn: () => operatorApi.clockOut(clockInTime!),
    onSuccess: () => {
      toast('Clocked out. Shift summary saved.', 'success')
      try { authApi.logout() } catch {}
      logout()
      navigate('/')
    },
    onError: () => toast('Clock out failed', 'error'),
  })

  const handleLogout = async () => {
    try { await authApi.logout() } catch {}
    logout()
    navigate('/')
  }

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="h-full flex flex-col bg-white border-r border-slate-100">
      {/* Logo + station */}
      <div className="px-5 pt-6 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-9 h-9 rounded-xl bg-green-500 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-black text-sm">W</span>
          </div>
          <div>
            <p className="font-black text-navy-900 text-base leading-none">WakaCharge</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Operator Portal</p>
          </div>
        </div>

        {/* Station badge */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2.5">
          <div className="flex items-center gap-2">
            <MdStore size={14} className="text-slate-400" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-navy-900 truncate">
                {dash?.station?.name || 'Loading station…'}
              </p>
              <p className="text-[10px] text-slate-400">{user?.campus}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Shift status */}
      <div className="px-4 py-4 border-b border-slate-100">
        <div className={`rounded-2xl p-3 flex items-center justify-between ${
          clockedIn ? 'bg-green-50 border border-green-200' : 'bg-slate-50 border border-slate-200'
        }`}>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${clockedIn ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`} />
            <p className={`text-xs font-bold ${clockedIn ? 'text-green-700' : 'text-slate-500'}`}>
              {clockedIn ? 'On shift' : 'Off shift'}
            </p>
          </div>
          <button
            onClick={() => clockedIn ? clockOut() : clockIn()}
            disabled={clockingIn || clockingOut}
            className={`text-xs font-bold px-2.5 py-1 rounded-xl transition-all ${
              clockedIn
                ? 'bg-red-100 text-red-600 hover:bg-red-200'
                : 'bg-green-500 text-white hover:bg-green-400'
            }`}
          >
            {clockingIn || clockingOut ? '…' : clockedIn ? 'Clock out' : 'Clock in'}
          </button>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
        {NAV.map(item => {
          const active = activeTab === item.id
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id)
                if (mobile) setSidebarOpen(false)
              }}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-2xl
                text-sm font-semibold text-left w-full transition-all
                ${active
                  ? 'bg-green-500 text-white shadow-sm'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-navy-900'
                }
              `}
            >
              <span className={active ? 'text-white' : 'text-slate-400'}>
                {item.icon}
              </span>
              {item.label}
              {item.id === 'rentals' && dash?.summary?.overdueRentals > 0 && (
                <span className={`ml-auto text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                  active ? 'bg-white/20 text-white' : 'bg-red-100 text-red-600'
                }`}>
                  {dash.summary.overdueRentals}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* User + logout */}
      <div className="px-4 py-4 border-t border-slate-100">
        <div className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 transition-colors">
          <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-black text-sm flex-shrink-0">
            {user?.name?.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-navy-900 truncate">{user?.name}</p>
            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-slate-400 hover:text-red-500 transition-colors"
            title="Sign out"
          >
            <MdLogout size={18} />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">

      {/* ── Desktop sidebar ─────────────────────── */}
      <aside className="hidden lg:block w-64 xl:w-72 flex-shrink-0 h-full overflow-hidden">
        <Sidebar />
      </aside>

      {/* ── Mobile drawer ────────────────────────── */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/40 z-40"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-72 z-50"
            >
              <Sidebar mobile />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Main area ───────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-100 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center"
          >
            <MdMenu size={20} className="text-navy-700" />
          </button>
          <p className="font-bold text-navy-900">
            {NAV.find(n => n.id === activeTab)?.label}
          </p>
          <button
            onClick={() => refetch()}
            className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center"
          >
            <MdRefresh size={18} className="text-slate-500" />
          </button>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {activeTab === 'dashboard' && <DashboardTab dash={dash} loading={isLoading} refetch={refetch} />}
          {activeTab === 'rentals' && <RentalsTab />}
          {activeTab === 'inventory' && <InventoryTab dash={dash} />}
          {activeTab === 'search' && <SearchTab />}
        </main>
      </div>
    </div>
  )
}

// ─── Dashboard Tab ────────────────────────────────────────
const DashboardTab = ({
  dash,
  loading,
  refetch
}: {
  dash: any
  loading: boolean
  refetch: () => void
}) => (
  <div className="p-5 lg:p-8 max-w-4xl">
    {/* Header */}
    <div className="flex items-center justify-between mb-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-0.5">
          Today's overview
        </p>
        <h1 className="text-2xl font-black text-navy-900">Dashboard</h1>
      </div>
      <button
        onClick={refetch}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-500 hover:bg-slate-50 transition-colors"
      >
        <MdRefresh size={14} />
        Refresh
      </button>
    </div>

    {/* KPIs */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {[
        {
          label: 'Active rentals',
          value: dash?.summary?.activeRentals ?? '—',
          icon: <MdBatteryChargingFull size={20} />,
          color: '#1db954', bg: '#f0fdf4'
        },
        {
          label: 'Overdue',
          value: dash?.summary?.overdueRentals ?? '—',
          icon: <MdWarning size={20} />,
          color: '#f59e0b', bg: '#fffbeb'
        },
        {
          label: 'Returned today',
          value: dash?.summary?.returnedToday ?? '—',
          icon: <MdCheckCircle size={20} />,
          color: '#0ea5e9', bg: '#f0f9ff'
        },
        {
          label: 'Devices available',
          value: dash?.summary?.availableDevices ?? '—',
          icon: <MdInventory size={20} />,
          color: '#8b5cf6', bg: '#faf5ff'
        },
      ].map(k => (
        <div
          key={k.label}
          className="rounded-3xl p-4 flex flex-col gap-3"
          style={{ background: k.bg }}
        >
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: `${k.color}20`, color: k.color }}
          >
            {k.icon}
          </div>
          <div>
            <p className="text-2xl font-black text-navy-900">{k.value}</p>
            <p className="text-xs font-semibold mt-0.5" style={{ color: k.color }}>
              {k.label}
            </p>
          </div>
        </div>
      ))}
    </div>

    {/* Low inventory warning */}
    {dash?.lowInventory?.length > 0 && (
      <div className="bg-amber-50 border-2 border-amber-200 rounded-3xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <MdReportProblem size={20} className="text-amber-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-bold text-amber-800 text-sm">Restock needed</p>
            <p className="text-amber-600 text-xs mt-0.5">
              These devices have zero availability: {dash.lowInventory.join(', ')}
            </p>
          </div>
        </div>
      </div>
    )}

    {/* Active rentals needing attention */}
    {dash?.activeRentals?.length > 0 && (
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
          Pending returns — confirm when device handed back
        </p>
        <div className="flex flex-col gap-3">
          {dash.activeRentals.slice(0, 5).map((r: any) => (
            <QuickConfirmCard key={r._id} rental={r} />
          ))}
        </div>
      </div>
    )}

    {(!dash?.activeRentals?.length && !loading) && (
      <div className="bg-white rounded-3xl border border-slate-100 p-10 text-center">
        <MdCheckCircle size={40} className="text-green-400 mx-auto mb-3" />
        <p className="font-bold text-navy-900">All clear</p>
        <p className="text-slate-400 text-sm mt-1">No active rentals requiring action</p>
      </div>
    )}
  </div>
)

// ─── Quick confirm card ───────────────────────────────────
const QuickConfirmCard = ({ rental }: { rental: any }) => {
  const { toast } = useToast()
  const qc = useQueryClient()
  const [confirming, setConfirming] = useState(false)

  const { mutate } = useMutation({
    mutationFn: () => operatorApi.confirmReturn(rental._id),
    onSuccess: () => {
      toast(`Confirmed return for ${rental.userId?.name}`, 'success')
      qc.invalidateQueries({ queryKey: ['operator-dashboard'] })
    },
    onError: (err: any) =>
      toast(err.response?.data?.message || 'Failed', 'error'),
    onSettled: () => setConfirming(false),
  })

  return (
    <div className={`bg-white rounded-2xl border p-4 flex items-center gap-4 ${
      rental.status === 'overdue' ? 'border-amber-200' : 'border-slate-100'
    }`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">{deviceEmoji(rental.deviceType)}</span>
          <p className="font-bold text-navy-900 text-sm">{rental.userId?.name}</p>
          <StatusPill status={rental.status} />
        </div>
        <p className="text-xs text-slate-400">
          {deviceLabel(rental.deviceType)} · Code:{' '}
          <span className="font-mono font-bold text-amber-600">{rental.confirmationCode}</span>
        </p>
      </div>
      {rental.operatorConfirmed ? (
        <div className="flex items-center gap-1.5 text-green-600 text-xs font-semibold flex-shrink-0">
          <MdCheckCircle size={16} />
          Confirmed
        </div>
      ) : (
        <button
          onClick={() => { setConfirming(true); mutate() }}
          disabled={confirming}
          className="flex-shrink-0 px-3 py-2 rounded-xl bg-green-500 text-white text-xs font-bold hover:bg-green-400 transition-all disabled:opacity-40"
        >
          {confirming ? '…' : '✓ Confirm'}
        </button>
      )}
    </div>
  )
}

// ─── Rentals Tab ─────────────────────────────────────────
const RentalsTab = () => {
  const [filter, setFilter] = useState<'active' | 'overdue'>('active')

  const { data, isLoading } = useQuery({
    queryKey: ['operator-active-rentals'],
    queryFn: operatorApi.getActiveRentals,
    refetchInterval: 20000,
  })

  const all = (data as any)?.rentals || []
  const filtered = filter === 'overdue'
    ? all.filter((r: any) => r.status === 'overdue')
    : all

  return (
    <div className="p-5 lg:p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-0.5">
            Station rentals
          </p>
          <h1 className="text-2xl font-black text-navy-900">Active Rentals</h1>
        </div>
        <div className="flex gap-1 bg-slate-100 rounded-2xl p-1">
          {[
            { v: 'active', label: 'All active' },
            { v: 'overdue', label: 'Overdue' },
          ].map(t => (
            <button
              key={t.v}
              onClick={() => setFilter(t.v as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filter === t.v ? 'bg-white text-navy-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-white rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center">
          <MdCheckCircle size={36} className="text-green-300 mx-auto mb-3" />
          <p className="font-bold text-navy-900">No {filter} rentals</p>
          <p className="text-slate-400 text-sm mt-1">Everything looks good</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((r: any) => (
            <RentalRow key={r._id} rental={r} />
          ))}
        </div>
      )}
    </div>
  )
}

const RentalRow = ({ rental }: { rental: any }) => {
  const { toast } = useToast()
  const qc = useQueryClient()
  const [confirming, setConfirming] = useState(false)

  const { mutate } = useMutation({
    mutationFn: () => operatorApi.confirmReturn(rental._id),
    onSuccess: () => {
      toast('Return confirmed', 'success')
      qc.invalidateQueries({ queryKey: ['operator-active-rentals'] })
    },
    onError: (err: any) => toast(err.response?.data?.message || 'Failed', 'error'),
    onSettled: () => setConfirming(false),
  })

  const isOverdue = rental.status === 'overdue'

  return (
    <div className={`bg-white rounded-2xl border p-5 ${isOverdue ? 'border-amber-200 bg-amber-50/30' : 'border-slate-100'}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0 ${
            isOverdue ? 'bg-amber-100' : 'bg-green-100'
          }`}>
            {deviceEmoji(rental.deviceType)}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="font-bold text-navy-900">{rental.userId?.name}</p>
              <StatusPill status={rental.status} />
            </div>
            <p className="text-xs text-slate-500">{deviceLabel(rental.deviceType)}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              <MdAccessTime size={11} className="inline mr-0.5" />
              Return by {formatDateTime(rental.expectedReturnTime)}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <p className="text-xs text-slate-400">Code:</p>
              <span className="font-mono font-black text-amber-500 text-sm tracking-widest">
                {rental.confirmationCode}
              </span>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0">
          {rental.operatorConfirmed ? (
            <div className="flex items-center gap-1.5 text-green-600 text-xs font-bold bg-green-50 border border-green-200 px-3 py-2 rounded-xl">
              <MdCheckCircle size={14} />
              Confirmed
            </div>
          ) : (
            <button
              onClick={() => { setConfirming(true); mutate() }}
              disabled={confirming}
              className="px-4 py-2 rounded-xl bg-green-500 text-white text-xs font-bold hover:bg-green-400 transition-all disabled:opacity-40"
            >
              {confirming ? '…' : 'Confirm receipt'}
            </button>
          )}
        </div>
      </div>

      {/* Student contact */}
      {rental.userId?.phone && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-400">
          <MdPerson size={13} />
          {rental.userId.email} · {rental.userId.phone}
        </div>
      )}
    </div>
  )
}

// ─── Inventory Tab ────────────────────────────────────────
const InventoryTab = ({ dash }: { dash: any }) => {
  const { toast } = useToast()
  const qc = useQueryClient()

  const { data: inventoryData, isLoading } = useQuery({
    queryKey: ['operator-inventory'],
    queryFn: operatorApi.getInventory,
  })

  const devices = (inventoryData as any)?.devices || []

  const { mutate: reportDamage } = useMutation({
    mutationFn: ({ deviceId, report }: { deviceId: string; report: string }) =>
      operatorApi.reportDamage(deviceId, report),
    onSuccess: () => {
      toast('Device reported as damaged', 'success')
      qc.invalidateQueries({ queryKey: ['operator-inventory'] })
    },
    onError: () => toast('Failed to report damage', 'error'),
  })

  const grouped = devices.reduce((acc: any, d: any) => {
    if (!acc[d.deviceType]) acc[d.deviceType] = []
    acc[d.deviceType].push(d)
    return acc
  }, {})

  return (
    <div className="p-5 lg:p-8 max-w-4xl">
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-0.5">
          Kiosk inventory
        </p>
        <h1 className="text-2xl font-black text-navy-900">Inventory</h1>
      </div>

      {/* Summary by type */}
      {dash?.inventory && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {Object.entries(dash.inventory).map(([type, inv]: [string, any]) => (
            <div key={type} className="bg-white rounded-2xl border border-slate-100 p-4">
              <span className="text-2xl block mb-2">{deviceEmoji(type as any)}</span>
              <p className="font-bold text-navy-900 text-sm capitalize">{type}</p>
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                <span className="text-[10px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded-md">
                  {inv.available} avail
                </span>
                <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-md">
                  {inv.rented} out
                </span>
                {inv.damaged > 0 && (
                  <span className="text-[10px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-md">
                    {inv.damaged} dmg
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Individual devices */}
      {isLoading ? (
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map(i => <div key={i} className="h-14 bg-white rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
              All devices — {devices.length} total
            </p>
          </div>
          <div className="divide-y divide-slate-50">
            {devices.map((d: any) => (
              <DeviceRow
                key={d._id}
                device={d}
                onReportDamage={(report) => reportDamage({ deviceId: d._id, report })}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const DeviceRow = ({
  device,
  onReportDamage
}: {
  device: any
  onReportDamage: (report: string) => void
}) => {
  const [showReport, setShowReport] = useState(false)
  const [report, setReport] = useState('')

  const statusColor: Record<string, string> = {
    available: 'text-green-600 bg-green-50',
    rented:    'text-blue-600 bg-blue-50',
    damaged:   'text-red-600 bg-red-50',
    charging:  'text-amber-600 bg-amber-50',
  }

  return (
    <div>
      <div className="flex items-center gap-3 px-5 py-3">
        <span className="text-lg flex-shrink-0">{deviceEmoji(device.deviceType)}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-navy-900">{device.deviceCode}</p>
          <p className="text-xs text-slate-400 capitalize">{device.deviceType}</p>
        </div>
        <span className={`text-xs font-bold px-2 py-1 rounded-lg capitalize ${statusColor[device.status] || 'bg-slate-100 text-slate-500'}`}>
          {device.status}
        </span>
        {device.status !== 'damaged' && (
          <button
            onClick={() => setShowReport(v => !v)}
            className="text-xs font-semibold text-slate-400 hover:text-red-500 transition-colors ml-2 flex-shrink-0"
          >
            <MdReportProblem size={16} />
          </button>
        )}
      </div>

      {/* Report damage form */}
      <AnimatePresence>
        {showReport && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-4 bg-red-50 border-t border-red-100">
              <p className="text-xs font-bold text-red-700 mb-2 pt-3">
                Describe the damage
              </p>
              <div className="flex gap-2">
                <input
                  value={report}
                  onChange={e => setReport(e.target.value)}
                  placeholder="e.g. cracked screen, not charging…"
                  className="flex-1 px-3 py-2 rounded-xl text-xs border border-red-200 bg-white outline-none focus:border-red-400"
                />
                <button
                  onClick={() => {
                    if (report.trim()) {
                      onReportDamage(report)
                      setShowReport(false)
                      setReport('')
                    }
                  }}
                  className="px-3 py-2 rounded-xl bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition-colors"
                >
                  Report
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Search Tab ───────────────────────────────────────────
const SearchTab = () => {
  const [query, setQuery] = useState('')
  const [searched, setSearched] = useState(false)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['operator-search', query],
    queryFn: () => operatorApi.searchStudent(query),
    enabled: false,
  })

  const handleSearch = () => {
    if (query.trim().length >= 2) {
      setSearched(true)
      refetch()
    }
  }

  const students = (data as any)?.students || []

  return (
    <div className="p-5 lg:p-8 max-w-4xl">
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-0.5">
          Student lookup
        </p>
        <h1 className="text-2xl font-black text-navy-900">Find Student</h1>
        <p className="text-slate-400 text-sm mt-1">Search by name, email or phone number</p>
      </div>

      {/* Search box */}
      <div className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <MdSearch size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Name, email or phone…"
            className="w-full pl-10 pr-4 py-3 rounded-2xl border-2 border-slate-200 bg-white text-sm font-medium text-navy-900 placeholder-slate-300 outline-none focus:border-green-500 transition-colors"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={query.trim().length < 2 || isLoading}
          className="px-5 py-3 rounded-2xl bg-green-500 text-white text-sm font-bold hover:bg-green-400 transition-all disabled:opacity-40"
        >
          {isLoading ? '…' : 'Search'}
        </button>
      </div>

      {/* Results */}
      {searched && !isLoading && students.length === 0 && (
        <div className="bg-white rounded-3xl border border-slate-100 p-10 text-center">
          <MdSearch size={32} className="text-slate-300 mx-auto mb-3" />
          <p className="font-bold text-navy-900">No students found</p>
          <p className="text-slate-400 text-sm mt-1">Try a different name or phone number</p>
        </div>
      )}

      {students.length > 0 && (
        <div className="flex flex-col gap-3">
          {students.map((s: any) => (
            <div key={s._id} className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-4">
              <div className="w-11 h-11 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-black text-base flex-shrink-0">
                {s.name?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-navy-900">{s.name}</p>
                <p className="text-xs text-slate-400 truncate">{s.email}</p>
                <p className="text-xs text-slate-400">{s.phone} · {s.campus}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs text-slate-400 mb-0.5">Wallet</p>
                <p className="font-black text-navy-900 text-sm">
                  ₦{(s.walletBalance || 0).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}