import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MdWarning, MdHelpOutline } from 'react-icons/md'

interface ConfirmOptions {
  title: string
  message: string
  detail?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'default'
}

export function useConfirm() {
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const resolveRef = useRef<((value: boolean) => void) | null>(null)

  const confirm = useCallback((opts: ConfirmOptions) => {
    setOptions(opts)
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve
    })
  }, [])

  const handleClose = (result: boolean) => {
    setOptions(null)
    resolveRef.current?.(result)
    resolveRef.current = null
  }

  const Dialog = (
    <AnimatePresence>
      {options && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[100]"
            onClick={() => handleClose(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6">
              <div className="flex items-start gap-3 mb-2">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                    options.variant === 'danger'
                      ? 'bg-red-50 text-red-500'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {options.variant === 'danger'
                    ? <MdWarning size={20} />
                    : <MdHelpOutline size={20} />}
                </div>
                <div className="pt-1.5">
                  <h3 className="font-black text-navy-900 text-base leading-tight">
                    {options.title}
                  </h3>
                </div>
              </div>

              <p className="text-slate-600 text-sm leading-relaxed mb-1 ml-[52px]">
                {options.message}
              </p>
              {options.detail && (
                <p className="text-slate-400 text-xs leading-relaxed ml-[52px]">
                  {options.detail}
                </p>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => handleClose(false)}
                  className="flex-1 py-3 rounded-2xl border-2 border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  {options.cancelLabel || 'Cancel'}
                </button>
                <button
                  onClick={() => handleClose(true)}
                  className={`flex-1 py-3 rounded-2xl text-sm font-black text-white transition-all ${
                    options.variant === 'danger'
                      ? 'bg-red-500 hover:bg-red-600'
                      : 'bg-green-500 hover:bg-green-400'
                  }`}
                >
                  {options.confirmLabel || 'Confirm'}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )

  return { confirm, Dialog }
}