import { motion } from 'framer-motion'

interface PageLoaderProps {
  message?: string
  fullscreen?: boolean
}

export const PageLoader = ({
  message = 'Loading…',
  fullscreen = true
}: PageLoaderProps) => (
  <div className={`
    flex flex-col items-center justify-center gap-4
    ${fullscreen ? 'min-h-svh bg-white' : 'py-16'}
  `}>
    {/* Animated logo */}
    <div className="relative">
      <motion.div
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
        className="w-14 h-14 rounded-2xl bg-green-500 flex items-center justify-center"
      >
        <span className="text-white font-black text-xl">⚡</span>
      </motion.div>
      {/* Orbit ring */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        className="absolute -inset-2 rounded-full border-2 border-transparent"
        style={{
          borderTopColor: '#1db954',
          borderRightColor: 'rgba(29,185,84,0.3)',
        }}
      />
    </div>

    <div className="text-center">
      <p className="text-sm font-semibold text-slate-500">{message}</p>
    </div>
  </div>
)

// ─── Inline page section loader ───────────────────────────
export const SectionLoader = () => (
  <div className="flex flex-col gap-3 p-5">
    {Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="shimmer h-20 rounded-3xl" />
    ))}
  </div>
)