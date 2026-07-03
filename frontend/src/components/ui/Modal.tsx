import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

export const Modal = ({ open, onClose, title, children }: ModalProps) => {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 max-w-lg mx-auto"
          >
            <div className="bg-white rounded-t-3xl p-6 max-h-[85svh] overflow-y-auto">
              <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-4" />
              {title && (
                <h2 className="text-xl font-bold text-navy-900 mb-4">{title}</h2>
              )}
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}