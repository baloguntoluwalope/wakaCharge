import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FaBolt, FaCamera, FaHouse, FaUser, FaWallet } from 'react-icons/fa6'

const navItems = [
  { path: '/dashboard', label: 'Home', icon: FaHouse },
  { path: '/wallet', label: 'Wallet', icon: FaWallet },
  { path: '/scan', label: '', icon: FaCamera, isCenter: true },
  { path: '/rentals', label: 'Rentals', icon: FaBolt },
  { path: '/profile', label: 'Profile', icon: FaUser },
]

export const BottomNav = () => {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const isActive = (path: string) => {
    if (path === '/dashboard') return pathname === '/dashboard' || pathname === '/'
    if (path === '/wallet') return pathname === '/wallet' || pathname.startsWith('/wallet')
    if (path === '/rentals') return pathname === '/rentals' || pathname.startsWith('/rentals')
    if (path === '/profile') return pathname === '/profile' || pathname.startsWith('/profile')
    return pathname === path
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto z-40">
      <div className="glass border-t border-white/50 px-2 py-2 safe-bottom">
        <div className="flex items-center justify-around">
          {navItems.map(item => {
            const active = isActive(item.path)
            const Icon = item.icon
            if (item.isCenter) {
              return (
                <motion.button
                  key={item.path}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => navigate(item.path)}
                  className="w-14 h-14 -mt-6 rounded-full bg-green-500 text-white shadow-glow-green flex items-center justify-center"
                >
                  <Icon className="text-xl" />
                </motion.button>
              )
            }
            return (
              <motion.button
                key={item.path}
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate(item.path)}
                className="flex flex-col items-center gap-1 px-3 py-1 rounded-2xl transition-all"
              >
                <span className={`text-xl transition-all ${active ? 'scale-110 text-green-600' : 'text-slate-400 opacity-60'}`}>
                  <Icon />
                </span>
                <span className={`text-[10px] font-semibold transition-colors ${active ? 'text-green-600' : 'text-slate-400'}`}>
                  {item.label}
                </span>
                {active && (
                  <motion.div
                    layoutId="nav-dot"
                    className="w-1 h-1 rounded-full bg-green-500"
                  />
                )}
              </motion.button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}