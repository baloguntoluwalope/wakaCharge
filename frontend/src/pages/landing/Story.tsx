import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
// import { useNavigate } from 'react-router-motion'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HiLightningBolt,
  HiAcademicCap,
  HiSparkles,
  HiGlobe,
  HiArrowRight,
  HiUserAdd
} from 'react-icons/hi'
import { Button } from '../../components/ui/Button'

const slides = [
  {
    eyebrow: 'The Problem',
    title: 'NEPA took the light again.',
    body: 'Your phone is at 4%. The library closes in an hour. You have no power bank, and the nearest shop wants ₦15,000 for one you\'ll only need tonight.',
    gradient: ['#0b1220', '#1a1a2e'],
    accent: '#f59e0b',
    icon: HiLightningBolt,
    iconBg: 'rgba(245,158,11,0.12)',
    iconColor: '#f59e0b'
  },
  {
    eyebrow: 'Every Campus. Every Day.',
    title: '1.8 million students. Same blackout.',
    body: 'Across LASU, UI, UNILAG and 170+ Nigerian campuses, power cuts hit the same way every day — and no one had built anything to fix it. Until now.',
    gradient: ['#0f1f12', '#0b1a10'],
    accent: '#22c55e',
    icon: HiAcademicCap,
    iconBg: 'rgba(34,197,94,0.12)',
    iconColor: '#22c55e'
  },
  {
    eyebrow: 'The Name',
    title: 'Waka.',
    body: 'In Yoruba — to move forward. In Pidgin — to hustle. We chose it because every student using this app is already in motion. We just remove the obstacles.',
    gradient: ['#0a0f1e', '#0d1b2a'],
    accent: '#38bdf8',
    icon: HiSparkles,
    iconBg: 'rgba(56,189,248,0.12)',
    iconColor: '#38bdf8'
  },
  {
    eyebrow: 'What It Stands For',
    title: 'W·A·K·A',
    body: 'Wallet. Access. Kiosk. Alliance. One wallet for campus payments, energy access on demand, a kiosk network at every block, and an alliance between students, vendors, and Nomba.',
    gradient: ['#13071e', '#1a0a2e'],
    accent: '#a78bfa',
    icon: HiGlobe,
    iconBg: 'rgba(167,139,250,0.12)',
    iconColor: '#a78bfa'
  },
]

export default function Story() {
  const [index, setIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const navigate = useNavigate()
  const slide = slides[index]
  const isLast = index === slides.length - 1
  const Icon = slide.icon

  useEffect(() => {
    setProgress(0)
    const duration = 4500
    const start = Date.now()
    const tick = setInterval(() => {
      const pct = Math.min(100, ((Date.now() - start) / duration) * 100)
      setProgress(pct)
      if (pct >= 100) {
        clearInterval(tick)
        if (!isLast) setIndex(i => i + 1)
      }
    }, 30)
    return () => clearInterval(tick)
  }, [index, isLast])

  return (
    <div
      className="min-h-svh flex flex-col transition-all duration-700 relative overflow-hidden"
      style={{ background: `linear-gradient(160deg, ${slide.gradient[0]} 0%, ${slide.gradient[1]} 100%)` }}
    >
      {/* Ambient glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl opacity-10 pointer-events-none transition-all duration-700"
        style={{ background: slide.accent, marginTop: '-80px' }}
      />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-14 pb-4">
        <div className="flex items-center gap-1.5">
          <HiLightningBolt size={16} style={{ color: slide.accent }} />
          <span className="text-white/40 text-xs font-bold tracking-widest uppercase">
            Waka Charge
          </span>
        </div>
        <button
          onClick={() => navigate('/login')}
          className="text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
          style={{ color: slide.accent, background: `${slide.accent}18` }}
        >
          Sign in
        </button>
      </div>

      {/* Progress bars */}
      <div className="relative z-10 flex gap-1.5 px-5 pb-2">
        {slides.map((s, i) => (
          <div key={i} className="flex-1 h-0.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.12)' }}>
            <div
              className="h-full rounded-full"
              style={{
                width: i < index ? '100%' : i === index ? `${progress}%` : '0%',
                background: s.accent,
                transition: i === index ? 'width 0.05s linear' : 'none'
              }}
            />
          </div>
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex flex-col justify-between px-6 pt-10 pb-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
          >
            {/* Icon badge */}
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-8"
              style={{ background: slide.iconBg, border: `1px solid ${slide.accent}30` }}
            >
              <Icon size={32} style={{ color: slide.iconColor }} />
            </motion.div>

            {/* Eyebrow */}
            <motion.p
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className="text-xs font-bold uppercase tracking-widest mb-3"
              style={{ color: slide.accent }}
            >
              {slide.eyebrow}
            </motion.p>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-4xl font-black text-white leading-tight tracking-tight mb-5"
            >
              {slide.title}
            </motion.h1>

            {/* Divider */}
            <div
              className="w-10 h-0.5 rounded-full mb-5"
              style={{ background: slide.accent }}
            />

            {/* Body */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="text-base leading-relaxed"
              style={{ color: 'rgba(255,255,255,0.55)' }}
            >
              {slide.body}
            </motion.p>
          </motion.div>
        </AnimatePresence>

        {/* Slide counter */}
        <div className="flex items-center gap-2 mt-8 mb-6">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === index ? 20 : 6,
                height: 6,
                background: i === index ? slide.accent : 'rgba(255,255,255,0.2)'
              }}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          {isLast ? (
            <>
              <button
                onClick={() => navigate('/register')}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm transition-all active:scale-95"
                style={{ background: slide.accent, color: '#0b1220' }}
              >
                <HiUserAdd size={18} />
                Create my Waka account
              </button>
              <button
                onClick={() => navigate('/login')}
                className="w-full py-4 rounded-2xl font-bold text-sm transition-all"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)' }}
              >
                I already have an account
              </button>
            </>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/login')}
                className="flex-1 py-4 rounded-2xl font-bold text-sm transition-all"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}
              >
                Skip
              </button>
              <button
                onClick={() => setIndex(i => Math.min(i + 1, slides.length - 1))}
                className="flex items-center justify-center gap-2 py-4 px-6 rounded-2xl font-bold text-sm transition-all active:scale-95"
                style={{ flex: 2, background: slide.accent, color: '#0b1220' }}
              >
                Next
                <HiArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}