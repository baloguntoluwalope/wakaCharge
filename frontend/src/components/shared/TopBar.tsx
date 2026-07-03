import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

interface TopBarProps {
  title?: string
  onBack?: (() => void) | false
  right?: ReactNode
  transparent?: boolean
  large?: boolean
}

export const TopBar = ({
  title,
  onBack,
  right,
  transparent = false,
  large = false
}: TopBarProps) => {
  const navigate = useNavigate()

  return (
    <div className={`
      flex items-center justify-between px-5
      ${large ? 'py-5' : 'py-4'}
      ${transparent ? '' : 'bg-white border-b border-slate-100'}
      sticky top-0 z-30
    `}>
      <div className="flex items-center gap-3">
        {onBack !== false && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => onBack ? onBack() : navigate(-1)}
            className="w-9 h-9 rounded-2xl bg-slate-100 flex items-center justify-center text-navy-700 hover:bg-slate-200 transition-colors"
          >
            ←
          </motion.button>
        )}
        {title && (
          <h1 className={`font-bold text-navy-900 ${large ? 'text-2xl' : 'text-lg'}`}>
            {title}
          </h1>
        )}
      </div>
      {right && <div className="flex items-center gap-2">{right}</div>}
    </div>
  )
}