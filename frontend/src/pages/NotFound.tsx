import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  MdHome,
  MdArrowBack,
  MdBatteryUnknown,
  MdSearchOff,
} from 'react-icons/md'
import { useAuth } from '../../context/AuthContext'

export default function NotFound() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  const homeRoute = !user
    ? '/'
    : user.role === 'admin'
    ? '/admin/dashboard'
    : user.role === 'operator'
    ? '/operator/dashboard'
    : '/dashboard'

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
      style={{
        background: 'linear-gradient(160deg, #060b12 0%, #0b1420 100%)'
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-sm w-full"
      >
        {/* Icon */}
        <div className="relative mx-auto w-28 h-28 mb-8">
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="w-28 h-28 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto"
          >
            <MdBatteryUnknown size={56} className="text-green-500/60" />
          </motion.div>
          {/* Glow */}
          <div
            className="absolute inset-0 rounded-3xl blur-xl opacity-20"
            style={{ background: '#1db954' }}
          />
        </div>

        {/* Error code */}
        <div className="mb-3">
          <p className="text-xs font-bold uppercase tracking-widest text-green-400/60 mb-2">
            Error 404
          </p>
          <h1 className="text-5xl font-black text-white mb-3">
            Page not found
          </h1>
          <p className="text-white/40 text-base leading-relaxed">
            The page at{' '}
            <span className="font-mono text-sm text-green-400/60">
              {location.pathname}
            </span>{' '}
            doesn't exist or has been moved.
          </p>
        </div>

        {/* Path display */}
        <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 mb-8 inline-flex items-center gap-2 mx-auto">
          <MdSearchOff size={16} className="text-white/30" />
          <p className="font-mono text-sm text-white/30 truncate max-w-xs">
            {location.pathname}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate(homeRoute)}
            className="w-full flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl bg-green-500 text-white font-black text-sm hover:bg-green-400 transition-all"
          >
            <MdHome size={18} />
            Go to {!user ? 'homepage' : 'dashboard'}
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate(-1)}
            className="w-full flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl border border-white/15 text-white/60 font-semibold text-sm hover:bg-white/5 hover:text-white transition-all"
          >
            <MdArrowBack size={18} />
            Go back
          </motion.button>
        </div>

        {/* Brand */}
        <p className="mt-10 text-white/20 text-xs">
          ⚡ Waka Charge · Campus Energy Rental
        </p>
      </motion.div>
    </div>
  )
}