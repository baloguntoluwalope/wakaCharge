import { ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MdWarningAmber,
  MdClose,
  MdDeleteForever,
  MdCheckCircle,
} from 'react-icons/md'

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning' | 'info'
  loading?: boolean
  detail?: string
}

export const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
  detail,
}: ConfirmDialogProps) => {
  const cfg = {
    danger: {
      icon: <MdDeleteForever size={28} />,
      iconBg: 'bg-red-100',
      iconColor: 'text-red-500',
      btnBg: 'bg-red-500 hover:bg-red-600',
      stripBg: 'bg-red-50',
      stripBorder: 'border-red-100',
    },
    warning: {
      icon: <MdWarningAmber size={28} />,
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-500',
      btnBg: 'bg-amber-500 hover:bg-amber-600',
      stripBg: 'bg-amber-50',
      stripBorder: 'border-amber-100',
    },
    info: {
      icon: <MdCheckCircle size={28} />,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      btnBg: 'bg-green-500 hover:bg-green-400',
      stripBg: 'bg-green-50',
      stripBorder: 'border-green-100',
    },
  }[variant]

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Dialog */}
          <motion.div
            key="dialog"
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: 'spring', damping: 22, stiffness: 360 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">

              {/* Header */}
              <div className="px-6 pt-6 pb-4 flex items-start justify-between">
                <div className={`w-14 h-14 rounded-2xl ${cfg.iconBg} flex items-center justify-center flex-shrink-0`}>
                  <span className={cfg.iconColor}>{cfg.icon}</span>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-colors"
                >
                  <MdClose size={16} />
                </button>
              </div>

              {/* Content */}
              <div className="px-6 pb-5">
                <h2 className="text-lg font-black text-navy-900 mb-1.5">
                  {title}
                </h2>
                <p className="text-slate-500 text-sm leading-relaxed">
                  {message}
                </p>

                {detail && (
                  <div className={`mt-4 p-3.5 rounded-2xl border ${cfg.stripBg} ${cfg.stripBorder}`}>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      {detail}
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="px-6 pb-6 flex flex-col gap-2.5">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={onConfirm}
                  disabled={loading}
                  className={`
                    w-full py-3.5 rounded-2xl text-white font-black text-sm
                    transition-all disabled:opacity-40 disabled:cursor-not-allowed
                    flex items-center justify-center gap-2
                    ${cfg.btnBg}
                  `}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing…
                    </>
                  ) : (
                    confirmLabel
                  )}
                </motion.button>

                <button
                  onClick={onClose}
                  disabled={loading}
                  className="w-full py-3.5 rounded-2xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-all disabled:opacity-40"
                >
                  {cancelLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ─── Hook for easy usage ──────────────────────────────────
import { useState, useCallback } from 'react'

interface UseConfirmOptions {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning' | 'info'
  detail?: string
}

export const useConfirm = () => {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [opts, setOpts] = useState<UseConfirmOptions>({
    title: '',
    message: '',
  })
  const [resolveFn, setResolveFn] = useState<((v: boolean) => void) | null>(null)

  const confirm = useCallback((options: UseConfirmOptions): Promise<boolean> => {
    setOpts(options)
    setOpen(true)
    return new Promise(resolve => {
      setResolveFn(() => resolve)
    })
  }, [])

  const handleConfirm = useCallback(() => {
    resolveFn?.(true)
    setOpen(false)
  }, [resolveFn])

  const handleClose = useCallback(() => {
    resolveFn?.(false)
    setOpen(false)
  }, [resolveFn])

  const Dialog = (
    <ConfirmDialog
      open={open}
      onClose={handleClose}
      onConfirm={handleConfirm}
      loading={loading}
      {...opts}
    />
  )

  return { confirm, Dialog, setLoading }
}