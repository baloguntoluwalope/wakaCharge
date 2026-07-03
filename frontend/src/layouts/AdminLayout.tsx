import { useState, type ComponentType } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HiLightningBolt,
  HiMenu,
  HiLogout
} from 'react-icons/hi'
import {
  LayoutDashboard, Zap, Users, MapPin,
  Battery, TrendingUp, FileText
} from 'lucide-react'

const adminNav: { path: string; label: string; icon: ComponentType<{ size?: number; className?: string }> }[] = [
  { path: '/admin/dashboard', label: 'Dashboard',  icon: LayoutDashboard },
  { path: '/admin/rentals',   label: 'Rentals',    icon: Zap },
  { path: '/admin/users',     label: 'Users',      icon: Users },
  { path: '/admin/stations',  label: 'Stations',   icon: MapPin },
  { path: '/admin/devices',   label: 'Devices',    icon: Battery },
  { path: '/admin/revenue',   label: 'Revenue',    icon: TrendingUp },
  { path: '/admin/audit',     label: 'Audit Log',  icon: FileText },
]

export const AdminLayout = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const SidebarContent = () => (
    <>
      <div className="p-6 border-b border-white/10">
        <p className="text-xs uppercase tracking-widest text-amber-400 font-bold mb-1">
          Admin Console
        </p>
        <div className="flex items-center gap-2">
          <HiLightningBolt className="text-amber-400" size={20} />
          <p className="text-white font-black text-lg tracking-tight">
            Waka<span className="text-amber-400">Charge</span>
          </p>
        </div>
      </div>

      <nav className="flex-1 p-4 flex flex-col gap-1">
        {adminNav.map(item => {
          const Icon = item.icon
          const isActive = pathname === item.path
          return (
            <button
              key={item.path}
              onClick={() => { navigate(item.path); setSidebarOpen(false) }}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold
                transition-all text-left w-full group
                ${isActive
                  ? 'bg-amber-400 text-slate-900'
                  : 'text-white/50 hover:bg-white/8 hover:text-white'
                }
              `}
            >
              <Icon
                size={18}
                className={isActive ? 'text-slate-900' : 'text-white/40 group-hover:text-white transition-colors'}
              />
              {item.label}
            </button>
          )
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
          <div className="w-9 h-9 rounded-xl bg-amber-400 flex items-center justify-center text-slate-900 font-black text-sm flex-shrink-0">
            {user?.name?.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold truncate">{user?.name}</p>
            <p className="text-white/30 text-xs truncate">{user?.email}</p>
          </div>
          <button
            onClick={() => { logout(); navigate('/') }}
            className="text-white/30 hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-red-400/10"
            title="Logout"
          >
            <HiLogout size={16} />
          </button>
        </div>
      </div>
    </>
  )

  return (
    <div className="min-h-screen flex" style={{ background: '#f1f5f9' }}>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 min-h-screen flex-shrink-0" style={{ background: '#0b1220' }}>
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <div
        className="lg:hidden fixed top-0 left-0 right-0 z-30 px-4 py-3 flex items-center justify-between"
        style={{ background: '#0b1220' }}
      >
        <div className="flex items-center gap-2">
          <HiLightningBolt className="text-amber-400" size={18} />
          <p className="text-white font-black tracking-tight">
            Waka<span className="text-amber-400">Charge</span>
          </p>
        </div>
        <button
          onClick={() => setSidebarOpen(true)}
          className="text-white/60 hover:text-white transition-colors p-1"
        >
          <HiMenu size={22} />
        </button>
      </div>

      {/* Mobile sidebar drawer */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-40"
              style={{ background: 'rgba(0,0,0,0.6)' }}
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-64 z-50 flex flex-col"
              style={{ background: '#0b1220' }}
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="flex-1 lg:overflow-y-auto pt-14 lg:pt-0 min-w-0">
        <Outlet />
      </main>
    </div>
  )
}