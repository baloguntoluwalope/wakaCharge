import { useState, createContext, useContext, useCallback } from 'react'
import type { ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
}

interface ToastContextType {
  toast: (message: string, type?: Toast['type']) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }, [])

  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' }
  const colors = {
    success: 'border-l-green-500 bg-green-50',
    error: 'border-l-red-500 bg-red-50',
    warning: 'border-l-amber-500 bg-amber-50',
    info: 'border-l-sky-500 bg-sky-50',
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4 flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className={`
                flex items-start gap-3 p-4 rounded-2xl border-l-4 shadow-card
                ${colors[t.type]}
              `}
            >
              <span>{icons[t.type]}</span>
              <p className="text-sm font-medium text-navy-800 flex-1">{t.message}</p>
              <button
                onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                ×
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}