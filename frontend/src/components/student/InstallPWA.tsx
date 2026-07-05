import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MdDownload, MdClose, MdSmartphone } from 'react-icons/md'
import { promptInstall, isPWAInstalled, isPWAInstallable } from '../../utils/pwa'

export const InstallPWABanner = () => {
  const [show, setShow] = useState(false)
  const [installing, setInstalling] = useState(false)
  const [dismissed, setDismissed] = useState(() =>
    localStorage.getItem('waka_pwa_dismissed') === '1'
  )

  useEffect(() => {
    if (dismissed || isPWAInstalled()) return

    const check = () => {
      if (isPWAInstallable()) setShow(true)
    }

    check()
    window.addEventListener('pwa-installable', check)
    return () => window.removeEventListener('pwa-installable', check)
  }, [dismissed])

  const handleInstall = async () => {
    setInstalling(true)
    const accepted = await promptInstall()
    if (accepted) {
      setShow(false)
    }
    setInstalling(false)
  }

  const handleDismiss = () => {
    setShow(false)
    setDismissed(true)
    localStorage.setItem('waka_pwa_dismissed', '1')
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 64 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 64 }}
          transition={{ type: 'spring', damping: 22 }}
          className="fixed bottom-24 left-4 right-4 max-w-sm mx-auto z-40"
        >
          <div className="bg-navy-900 rounded-3xl border border-white/10 shadow-2xl px-5 py-4 flex items-center gap-4">
            {/* Icon */}
            <div className="w-11 h-11 rounded-2xl bg-green-500 flex items-center justify-center flex-shrink-0">
              <MdSmartphone size={22} className="text-white" />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm">
                Add to home screen
              </p>
              <p className="text-white/50 text-xs mt-0.5 truncate">
                Fast access · Works offline
              </p>
            </div>

            {/* Install button */}
            <button
              onClick={handleInstall}
              disabled={installing}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-green-500 text-white text-xs font-bold hover:bg-green-400 transition-all disabled:opacity-50 flex-shrink-0"
            >
              {installing ? (
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <MdDownload size={14} />
              )}
              Install
            </button>

            {/* Dismiss */}
            <button
              onClick={handleDismiss}
              className="w-7 h-7 rounded-xl bg-white/10 flex items-center justify-center text-white/50 hover:bg-white/20 transition-colors flex-shrink-0"
            >
              <MdClose size={14} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}