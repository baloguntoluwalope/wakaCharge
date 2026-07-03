import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import {
  Zap, Menu, X, ArrowRight, Battery, Lamp,
  Package, Sofa, Shield, Star, MapPin, Clock,
  ChevronDown, Mail, Phone, CheckCircle,
  TrendingUp, Users, Building2, Smartphone,
  CreditCard, RotateCcw, Lock, Sun,
  BarChart3
} from 'lucide-react'
import { FiInstagram, FiTwitter } from 'react-icons/fi'

// ─── Utilities ────────────────────────────────────────────────────────────────

const FadeIn = ({
  children, delay = 0, className = '', direction = 'up'
}: {
  children: React.ReactNode
  delay?: number
  className?: string
  direction?: 'up' | 'left' | 'right' | 'none'
}) => {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const initial = {
    up:    { opacity: 0, y: 28 },
    left:  { opacity: 0, x: -28 },
    right: { opacity: 0, x: 28 },
    none:  { opacity: 0 }
  }[direction]

  return (
    <motion.div
      ref={ref}
      initial={initial}
      animate={inView ? { opacity: 1, y: 0, x: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

const CountUp = ({ target, suffix = '' }: { target: number; suffix?: string }) => {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })

  useEffect(() => {
    if (!inView) return
    let start = 0
    const duration = 1800
    const step = target / (duration / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= target) { setCount(target); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, 16)
    return () => clearInterval(timer)
  }, [inView, target])

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>
}

// ─── Nav ──────────────────────────────────────────────────────────────────────

const Nav = () => {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const links = [
    { label: 'How it works', href: '#how' },
    { label: 'Devices', href: '#devices' },
    { label: 'Trust Score', href: '#trust' },
    { label: 'Roadmap', href: '#roadmap' },
  ]

  const scrollTo = (href: string) => {
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' })
    setOpen(false)
  }

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
      style={{
        background: scrolled ? 'rgba(255,255,255,0.95)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(0,0,0,0.06)' : 'none',
        boxShadow: scrolled ? '0 1px 20px rgba(0,0,0,0.06)' : 'none'
      }}
    >
      <div className="max-w-6xl mx-auto px-5 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-green-500 flex items-center justify-center">
              <Zap size={16} className="text-white fill-white" />
            </div>
            <span className={`font-black text-lg tracking-tight transition-colors ${scrolled ? 'text-slate-900' : 'text-white'}`}>
              Waka<span className="text-green-400">Charge</span>
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-8">
            {links.map(l => (
              <button
                key={l.href}
                onClick={() => scrollTo(l.href)}
                className={`text-sm font-medium transition-colors hover:text-green-500 ${scrolled ? 'text-slate-500' : 'text-white/60'}`}
              >
                {l.label}
              </button>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-2">
            <button
              onClick={() => navigate('/login')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${scrolled ? 'text-slate-600 hover:bg-slate-100' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
            >
              Sign in
            </button>
            <button
              onClick={() => navigate('/register')}
              className="px-4 py-2 rounded-xl bg-green-500 text-white text-sm font-bold hover:bg-green-400 transition-all shadow-sm"
            >
              Get started
            </button>
          </div>

          <button
            onClick={() => setOpen(v => !v)}
            className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center transition-all"
            style={{ background: scrolled ? '#f1f5f9' : 'rgba(255,255,255,0.12)' }}
          >
            {open
              ? <X size={17} className={scrolled ? 'text-slate-900' : 'text-white'} />
              : <Menu size={17} className={scrolled ? 'text-slate-900' : 'text-white'} />
            }
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden overflow-hidden"
            style={{ background: '#fff', borderTop: '1px solid #f1f5f9' }}
          >
            <div className="px-5 py-4 flex flex-col gap-1">
              {links.map(l => (
                <button
                  key={l.href}
                  onClick={() => scrollTo(l.href)}
                  className="text-left px-4 py-3 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  {l.label}
                </button>
              ))}
              <div className="flex flex-col gap-2 pt-3 mt-2" style={{ borderTop: '1px solid #f1f5f9' }}>
                <button onClick={() => navigate('/login')} className="px-4 py-3 rounded-xl text-sm font-semibold text-slate-600 border border-slate-200">
                  Sign in
                </button>
                <button onClick={() => navigate('/register')} className="px-4 py-3 rounded-xl bg-green-500 text-white text-sm font-bold">
                  Create account
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}

// ─── Mock Phone ───────────────────────────────────────────────────────────────

const MockPhone = () => (
  <div className="relative">
    <div className="absolute inset-[-40px] rounded-full opacity-20 blur-3xl" style={{ background: 'radial-gradient(#22c55e, transparent 70%)' }} />
    <motion.div
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      className="relative"
      style={{
        width: 260,
        borderRadius: 36,
        background: '#0b1220',
        border: '1px solid rgba(255,255,255,0.1)',
        padding: 2,
        boxShadow: '0 40px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)'
      }}
    >
      <div style={{ borderRadius: 34, overflow: 'hidden', background: '#f8fafc' }}>
        {/* Status */}
        <div style={{ background: '#060f1a', padding: '16px 20px 20px' }}>
          <div className="flex justify-between items-center mb-5">
            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>9:41</span>
            <div style={{ width: 14, height: 7, borderRadius: 3, border: '1px solid rgba(255,255,255,0.3)', position: 'relative' }}>
              <div style={{ position: 'absolute', inset: 2, right: 4, background: '#22c55e', borderRadius: 2 }} />
            </div>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
            Waka Wallet
          </p>
          <p style={{ color: '#fff', fontSize: 30, fontWeight: 900, lineHeight: 1 }}>₦2,500</p>
          <div className="flex gap-2 mt-4">
            <div style={{ flex: 1, padding: '8px 0', background: '#22c55e', borderRadius: 10, textAlign: 'center' }}>
              <span style={{ color: '#060f1a', fontSize: 11, fontWeight: 800 }}>+ Fund</span>
            </div>
            <div style={{ flex: 1, padding: '8px 0', background: 'rgba(255,255,255,0.08)', borderRadius: 10, textAlign: 'center' }}>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 600 }}>History</span>
            </div>
          </div>
        </div>

        {/* Active rental */}
        <div style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 14, padding: '10px 12px' }}>
            <div className="flex justify-between">
              <div>
                <p style={{ fontSize: 9, fontWeight: 800, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Active rental</p>
                <p style={{ fontSize: 13, fontWeight: 900, color: '#0f172a', marginTop: 2 }}>🔋 Power Bank</p>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#f59e0b', marginTop: 1 }}>3h 22m remaining</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 9, color: '#94a3b8' }}>Locker</p>
                <p style={{ fontSize: 16, fontWeight: 900, color: '#0f172a' }}>PB-4</p>
              </div>
            </div>
          </div>
        </div>

        {/* Trust score */}
        <div style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9' }}>
          <div className="flex justify-between items-center mb-2">
            <span style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Trust Score</span>
            <span style={{ fontSize: 9, fontWeight: 800, color: '#f59e0b' }}>🟡 Trusted</span>
          </div>
          <div className="flex items-center gap-2">
            <div style={{ flex: 1, height: 5, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '65%' }}
                transition={{ delay: 0.8, duration: 1.2, ease: 'easeOut' }}
                style={{ height: '100%', background: '#22c55e', borderRadius: 99 }}
              />
            </div>
            <span style={{ fontSize: 10, fontWeight: 900, color: '#0f172a' }}>12 pts</span>
          </div>
        </div>

        {/* Quick actions */}
        <div style={{ padding: '10px 14px' }}>
          <div className="grid grid-cols-4 gap-2">
            {[
              { icon: <MapPin size={13} />, label: 'Station' },
              { icon: <Battery size={13} />, label: 'Rent' },
              { icon: <CreditCard size={13} />, label: 'Wallet' },
              { icon: <Star size={13} />, label: 'Trust' },
            ].map(a => (
              <div key={a.label} className="flex flex-col items-center gap-1">
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                  {a.icon}
                </div>
                <span style={{ fontSize: 8, color: '#94a3b8', fontWeight: 600 }}>{a.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom nav */}
        <div style={{ padding: '10px 20px 14px', background: '#fff', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-around' }}>
          {[
            { icon: <Zap size={15} />, active: true },
            { icon: <CreditCard size={15} />, active: false },
            { icon: <MapPin size={15} />, active: false },
            { icon: <Users size={15} />, active: false },
          ].map((n, i) => (
            <div key={i} className="flex flex-col items-center gap-1" style={{ color: n.active ? '#22c55e' : '#cbd5e1' }}>
              {n.icon}
              {n.active && <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#22c55e' }} />}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  </div>
)

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div style={{ background: '#fff', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <Nav />

      {/* ── HERO ── */}
      <section
        className="relative min-h-screen flex flex-col justify-center overflow-hidden"
        style={{ background: 'linear-gradient(150deg, #060d18 0%, #0b1420 40%, #091a10 100%)' }}
      >
        {/* Subtle grid */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'linear-gradient(rgba(34,197,94,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(34,197,94,0.04) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
            opacity: 1
          }}
        />

        {/* Radial glow */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: '-20%', left: '50%', transform: 'translateX(-50%)',
            width: 800, height: 800,
            background: 'radial-gradient(circle, rgba(34,197,94,0.08) 0%, transparent 65%)'
          }}
        />

        <div className="relative max-w-6xl mx-auto px-5 lg:px-8 pt-28 pb-20">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">
            <div>
              <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
                <div
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-8"
                  style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400" style={{ boxShadow: '0 0 6px #22c55e' }} />
                  <span style={{ color: '#4ade80', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    Live on 10+ Nigerian campuses
                  </span>
                </div>

                <h1
                  className="font-black leading-none tracking-tight mb-6"
                  style={{ fontSize: 'clamp(40px, 6vw, 68px)', color: '#fff', lineHeight: 1.05 }}
                >
                  Power to study<br />
                  through{' '}
                  <span style={{ color: '#4ade80' }}>any outage.</span>
                </h1>

                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 17, lineHeight: 1.7, maxWidth: 420, marginBottom: 36 }}>
                  Rent power banks, study lamps and energy kits at campus
                  kiosks. Pay with your Waka Wallet. Deposit refunded the moment you return.
                </p>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => navigate('/register')}
                    className="inline-flex items-center gap-2 font-bold text-sm transition-all group"
                    style={{ padding: '14px 24px', borderRadius: 14, background: '#22c55e', color: '#fff' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#16a34a'}
                    onMouseLeave={e => e.currentTarget.style.background = '#22c55e'}
                  >
                    Create free account
                    <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                  </button>
                  <button
                    onClick={() => navigate('/login')}
                    className="inline-flex items-center gap-2 font-semibold text-sm transition-all"
                    style={{ padding: '14px 24px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#fff' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)' }}
                  >
                    Sign in
                  </button>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-8 mt-12 pt-10" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  {[
                    { n: 10, suffix: '+', label: 'Campuses' },
                    { n: 4, suffix: '', label: 'Device types' },
                    { n: 300, suffix: '₦', prefix: true, label: 'From per rental' },
                  ].map(s => (
                    <div key={s.label}>
                      <p style={{ fontSize: 26, fontWeight: 900, color: '#fff', lineHeight: 1 }}>
                        {s.prefix ? `₦${s.n}` : <><CountUp target={s.n} suffix={s.suffix} /></>}
                      </p>
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>{s.label}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="hidden lg:flex justify-center"
            >
              <MockPhone />
            </motion.div>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2" style={{ opacity: 0.3 }}>
          <span style={{ color: '#fff', fontSize: 11 }}>Scroll to explore</span>
          <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 1.6, repeat: Infinity }}>
            <ChevronDown size={14} className="text-white" />
          </motion.div>
        </div>
      </section>

      {/* ── TRUST BAR ── */}
      <section style={{ background: '#f8fafc', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', padding: '20px 0' }}>
        <div className="max-w-6xl mx-auto px-5 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-8 lg:gap-14">
            {[
              { icon: <Shield size={14} />, text: 'Nomba-secured payments' },
              { icon: <RotateCcw size={14} />, text: 'Deposit refunded on return' },
              { icon: <Lock size={14} />, text: 'OTP-verified accounts' },
              { icon: <CheckCircle size={14} />, text: 'Zero upfront device cost' },
              { icon: <Sun size={14} />, text: 'Solar-powered kiosks' },
            ].map(t => (
              <div key={t.text} className="flex items-center gap-2" style={{ color: '#64748b', fontSize: 13, fontWeight: 500 }}>
                <span style={{ color: '#22c55e' }}>{t.icon}</span>
                {t.text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{ padding: '80px 0', background: '#fff' }}>
        <div className="max-w-6xl mx-auto px-5 lg:px-8">
          <FadeIn>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { n: 1800, suffix: '+', label: 'Students powered', color: '#22c55e' },
                { n: 4200, suffix: '+', label: 'Successful rentals', color: '#0ea5e9' },
                { n: 98, suffix: '%', label: 'On-time return rate', color: '#8b5cf6' },
                { n: 10, suffix: '+', label: 'Campuses live', color: '#f59e0b' },
              ].map((s, i) => (
                <FadeIn key={s.label} delay={i * 0.08}>
                  <div
                    className="rounded-2xl p-6 text-center"
                    style={{ background: '#f8fafc', border: '1px solid #f1f5f9' }}
                  >
                    <p style={{ fontSize: 36, fontWeight: 900, color: s.color, lineHeight: 1 }}>
                      <CountUp target={s.n} suffix={s.suffix} />
                    </p>
                    <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 8, fontWeight: 500 }}>{s.label}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" style={{ padding: '100px 0', background: '#f8fafc' }}>
        <div className="max-w-6xl mx-auto px-5 lg:px-8">
          <FadeIn className="text-center mb-16">
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#22c55e', marginBottom: 12 }}>
              How it works
            </p>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 46px)', fontWeight: 900, color: '#0f172a', lineHeight: 1.1, marginBottom: 16 }}>
              Powered up in under two minutes
            </h2>
            <p style={{ color: '#64748b', fontSize: 17, maxWidth: 480, margin: '0 auto' }}>
              From empty battery to fully charged — no queues, no cash, no hassle.
            </p>
          </FadeIn>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { step: '01', icon: <Smartphone size={22} />, title: 'Create account', body: 'Verify your email with OTP. Your Nomba virtual account is generated instantly.', color: '#22c55e' },
              { step: '02', icon: <CreditCard size={22} />, title: 'Fund wallet', body: 'Transfer to your Nomba account number or pay by card. Balance credited instantly.', color: '#0ea5e9' },
              { step: '03', icon: <MapPin size={22} />, title: 'Find a kiosk', body: 'Browse nearby stations or scan the QR code at any campus kiosk.', color: '#8b5cf6' },
              { step: '04', icon: <RotateCcw size={22} />, title: 'Return & get paid', body: 'Hand device to operator, confirm with your 4-digit code. Deposit back instantly.', color: '#f59e0b' },
            ].map((s, i) => (
              <FadeIn key={s.step} delay={i * 0.1}>
                <div
                  className="relative p-6 rounded-2xl transition-all"
                  style={{ background: '#fff', border: '1px solid #e2e8f0' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = s.color; e.currentTarget.style.boxShadow = `0 8px 30px ${s.color}18` }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none' }}
                >
                  <div
                    className="absolute top-5 right-5 font-black select-none"
                    style={{ fontSize: 40, color: '#f8fafc', lineHeight: 1 }}
                  >
                    {s.step}
                  </div>
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
                    style={{ background: `${s.color}14`, color: s.color }}
                  >
                    {s.icon}
                  </div>
                  <h3 style={{ fontWeight: 800, color: '#0f172a', fontSize: 16, marginBottom: 8 }}>{s.title}</h3>
                  <p style={{ color: '#64748b', fontSize: 13, lineHeight: 1.6 }}>{s.body}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── DEVICES ── */}
      <section id="devices" style={{ padding: '100px 0', background: '#fff' }}>
        <div className="max-w-6xl mx-auto px-5 lg:px-8">
          <FadeIn className="text-center mb-16">
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#22c55e', marginBottom: 12 }}>
              Available devices
            </p>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 46px)', fontWeight: 900, color: '#0f172a', lineHeight: 1.1, marginBottom: 16 }}>
              Everything for a full study session
            </h2>
            <p style={{ color: '#64748b', fontSize: 17, maxWidth: 480, margin: '0 auto' }}>
              Rent what you need, return when you're done. Your deposit comes straight back.
            </p>
          </FadeIn>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: <Battery size={28} />, name: 'Power Bank', price: 300, deposit: 500, hrs: 8, desc: 'Keep phones and laptops charged through any blackout.', color: '#22c55e', bg: '#f0fdf4' },
              { icon: <Lamp size={28} />, name: 'Study Lamp', price: 300, deposit: 500, hrs: 12, desc: 'Bright, rechargeable lamp for reading through power cuts.', color: '#f59e0b', bg: '#fffbeb' },
              { icon: <Package size={28} />, name: 'Survival Kit', price: 500, deposit: 700, hrs: 12, desc: 'Power bank + study lamp combo for serious sessions.', color: '#0ea5e9', bg: '#f0f9ff' },
              { icon: <Sofa size={28} />, name: 'Comfort Kit', price: 700, deposit: 1000, hrs: 12, desc: 'Power bank + lamp + fan. Full comfort through any outage.', color: '#8b5cf6', bg: '#faf5ff' },
            ].map((d, i) => (
              <FadeIn key={d.name} delay={i * 0.08}>
                <div
                  className="rounded-2xl p-6 flex flex-col h-full transition-all"
                  style={{ background: d.bg, border: '1.5px solid transparent' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = `${d.color}40`; e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.transform = 'none' }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                    style={{ background: `${d.color}18`, color: d.color }}
                  >
                    {d.icon}
                  </div>
                  <h3 style={{ fontWeight: 900, color: '#0f172a', fontSize: 18, marginBottom: 6 }}>{d.name}</h3>
                  <p style={{ color: '#64748b', fontSize: 13, lineHeight: 1.6, flex: 1, marginBottom: 20 }}>{d.desc}</p>
                  <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 16 }}>
                    <div className="flex justify-between items-end">
                      <div>
                        <p style={{ fontSize: 28, fontWeight: 900, color: d.color, lineHeight: 1 }}>₦{d.price}</p>
                        <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>per rental</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#475569' }}>₦{d.deposit}</p>
                        <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>refundable</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 mt-3">
                      <Clock size={11} style={{ color: '#94a3b8' }} />
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>Up to {d.hrs} hours</span>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUST SCORE ── */}
      <section id="trust" style={{ padding: '100px 0', background: '#f8fafc' }}>
        <div className="max-w-6xl mx-auto px-5 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <FadeIn direction="left">
              <div
                className="rounded-3xl p-8 relative overflow-hidden"
                style={{ background: '#060f1a', boxShadow: '0 24px 60px rgba(0,0,0,0.3)' }}
              >
                <div
                  className="absolute pointer-events-none"
                  style={{ top: 0, right: 0, width: 300, height: 300, background: 'radial-gradient(circle, rgba(34,197,94,0.08), transparent 70%)', transform: 'translate(30%,-30%)' }}
                />
                <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#4ade80', marginBottom: 8 }}>
                  Trust Score System
                </p>
                <h3 style={{ fontSize: 30, fontWeight: 900, color: '#fff', lineHeight: 1.15, marginBottom: 28 }}>
                  Build credit<br />on campus.
                </h3>
                <div className="flex flex-col gap-3">
                  {[
                    { emoji: '🔵', label: 'Basic',   score: '0–9 pts',   rnpl: 'Standard rental',    active: false },
                    { emoji: '🟡', label: 'Trusted', score: '10–17 pts', rnpl: 'RNPL ₦1,000 limit',  active: true  },
                    { emoji: '⚪', label: 'Silver',  score: '18–30 pts', rnpl: 'RNPL ₦2,500 limit',  active: false },
                    { emoji: '🏆', label: 'Gold',    score: '31+ pts',   rnpl: 'RNPL ₦5,000 limit',  active: false },
                  ].map(t => (
                    <div
                      key={t.label}
                      className="flex items-center gap-3 p-3 rounded-2xl transition-all"
                      style={{
                        background: t.active ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${t.active ? 'rgba(34,197,94,0.25)' : 'rgba(255,255,255,0.06)'}`
                      }}
                    >
                      <span style={{ fontSize: 20 }}>{t.emoji}</span>
                      <div style={{ flex: 1 }}>
                        <div className="flex items-center gap-2">
                          <span style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>{t.label}</span>
                          {t.active && (
                            <span style={{ fontSize: 9, fontWeight: 800, background: 'rgba(34,197,94,0.2)', color: '#4ade80', padding: '2px 8px', borderRadius: 99 }}>
                              RNPL Unlocked
                            </span>
                          )}
                        </div>
                        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 2 }}>{t.score}</p>
                      </div>
                      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 600, textAlign: 'right' }}>{t.rnpl}</p>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>

            <FadeIn direction="right" delay={0.1}>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#22c55e', marginBottom: 12 }}>
                Rent Now, Pay Later
              </p>
              <h2 style={{ fontSize: 'clamp(28px, 3.5vw, 42px)', fontWeight: 900, color: '#0f172a', lineHeight: 1.15, marginBottom: 20 }}>
                Your return history<br />is your credit score.
              </h2>
              <p style={{ color: '#64748b', fontSize: 16, lineHeight: 1.7, marginBottom: 32 }}>
                Every on-time return builds your Trust Score. Hit 10 successful
                rentals and RNPL unlocks — rent without paying upfront, settle within 48 hours.
              </p>
              <div className="flex flex-col gap-4">
                {[
                  { icon: <TrendingUp size={17} />, title: '+1 point per on-time return', body: 'Consistent returners climb tiers quickly.' },
                  { icon: <Star size={17} />, title: '+2 points for early return', body: 'Return before your window closes and earn extra credit.' },
                  { icon: <CheckCircle size={17} />, title: 'RNPL up to ₦5,000 at Gold tier', body: '31 successful rentals unlocks maximum credit access.' },
                ].map(f => (
                  <div key={f.title} className="flex items-start gap-4">
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {f.icon}
                    </div>
                    <div>
                      <p style={{ fontWeight: 700, color: '#0f172a', fontSize: 14 }}>{f.title}</p>
                      <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 3 }}>{f.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── CAMPUSES ── */}
      <section style={{ padding: '80px 0', background: '#fff' }}>
        <div className="max-w-6xl mx-auto px-5 lg:px-8 text-center">
          <FadeIn>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#22c55e', marginBottom: 12 }}>
              Campus coverage
            </p>
            <h2 style={{ fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 900, color: '#0f172a', marginBottom: 32 }}>
              Available at 10 universities across Nigeria
            </h2>
            <div className="flex flex-wrap justify-center gap-3">
              {['LASU', 'UI', 'UNILAG', 'OAU', 'FUTA', 'UNIBEN', 'ABU', 'UNN', 'UNIPORT', 'LAUTECH'].map((c, i) => (
                <motion.div
                  key={c}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm"
                  style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#374151' }}
                >
                  <MapPin size={11} style={{ color: '#22c55e' }} />
                  {c}
                </motion.div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── ROADMAP ── */}
      <section id="roadmap" style={{ padding: '100px 0', background: '#f8fafc' }}>
        <div className="max-w-6xl mx-auto px-5 lg:px-8">
          <FadeIn className="text-center mb-16">
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#22c55e', marginBottom: 12 }}>
              What's coming
            </p>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 46px)', fontWeight: 900, color: '#0f172a', lineHeight: 1.1, marginBottom: 16 }}>
              Built for one campus.<br />Designed for every campus.
            </h2>
            <p style={{ color: '#64748b', fontSize: 17, maxWidth: 500, margin: '0 auto' }}>
              Waka grows from energy rental into the financial identity of every Nigerian student.
            </p>
          </FadeIn>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { phase: 'Phase 1', title: 'Waka Charge', status: 'live', color: '#22c55e', items: ['Device rentals', 'Nomba wallet', 'Trust Score', 'RNPL credit'] },
              { phase: 'Phase 2', title: 'Waka Market', status: 'next', color: '#0ea5e9', items: ['Vendor marketplace', 'Waka Riders delivery', 'Campus food orders'] },
              { phase: 'Phase 3', title: 'Waka Access', status: 'planned', color: '#8b5cf6', items: ['Digital ajo savings', 'Shuttle payments', 'Bill payments'] },
              { phase: 'Phase 4', title: 'Waka Alliance', status: 'planned', color: '#f59e0b', items: ['Vendor micro-loans', '170+ campuses', 'West Africa expansion'] },
            ].map((p, i) => (
              <FadeIn key={p.phase} delay={i * 0.08}>
                <div
                  className="p-6 rounded-2xl flex flex-col h-full transition-all"
                  style={{ background: '#fff', border: '1px solid #e2e8f0' }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                >
                  <div className="flex items-center justify-between mb-5">
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{p.phase}</span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '3px 10px',
                        borderRadius: 99,
                        background: p.status === 'live' ? '#f0fdf4' : p.status === 'next' ? '#f0f9ff' : '#f8fafc',
                        color: p.status === 'live' ? '#16a34a' : p.status === 'next' ? '#0284c7' : '#94a3b8'
                      }}
                    >
                      {p.status === 'live' ? '● Live' : p.status === 'next' ? 'Building' : 'Planned'}
                    </span>
                  </div>
                  <h3 style={{ fontSize: 19, fontWeight: 900, color: '#0f172a', marginBottom: 16 }}>{p.title}</h3>
                  <ul className="flex flex-col gap-2.5 flex-1">
                    {p.items.map(item => (
                      <li key={item} className="flex items-center gap-2.5" style={{ fontSize: 13, color: '#64748b' }}>
                        <span style={{ color: p.color, fontSize: 14, fontWeight: 700, flexShrink: 0 }}>✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── PORTALS ── */}
      <section style={{ padding: '80px 0', background: '#060f1a' }}>
        <div className="max-w-6xl mx-auto px-5 lg:px-8">
          <FadeIn className="text-center mb-12">
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#4ade80', marginBottom: 12 }}>
              Platform access
            </p>
            <h2 style={{ fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 900, color: '#fff' }}>
              Three separate portals
            </h2>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              { icon: <Smartphone size={22} />, title: 'Student App', desc: 'Rent devices, fund wallet, build trust score, access RNPL.', cta: 'Create account', path: '/register', color: '#22c55e' },
              { icon: <Building2 size={22} />, title: 'Operator Portal', desc: 'Manage kiosk inventory, confirm returns, track your shift.', cta: 'Operator login', path: '/operator-login', color: '#f59e0b' },
              { icon: <BarChart3 size={22} />, title: 'Admin Console', desc: 'Revenue analytics, reconciliation, audit logs, full platform control.', cta: 'Admin login', path: '/admin-login', color: '#8b5cf6' },
            ].map((p, i) => (
              <FadeIn key={p.title} delay={i * 0.08}>
                <div
                  className="p-6 rounded-2xl flex flex-col gap-5 h-full transition-all"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                >
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: `${p.color}18`, color: p.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {p.icon}
                  </div>
                  <div>
                    <p style={{ fontWeight: 900, color: '#fff', fontSize: 17, marginBottom: 6 }}>{p.title}</p>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, lineHeight: 1.6 }}>{p.desc}</p>
                  </div>
                  <button
                    onClick={() => navigate(p.path)}
                    className="mt-auto flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all"
                    style={{ background: `${p.color}18`, color: p.color, border: `1px solid ${p.color}30` }}
                    onMouseEnter={e => e.currentTarget.style.background = `${p.color}28`}
                    onMouseLeave={e => e.currentTarget.style.background = `${p.color}18`}
                  >
                    {p.cta}
                    <ArrowRight size={14} />
                  </button>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: '100px 0', background: '#fff' }}>
        <div className="max-w-2xl mx-auto px-5 text-center">
          <FadeIn>
            <div style={{ width: 60, height: 60, borderRadius: 20, background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <Zap size={26} className="text-white fill-white" />
            </div>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 900, color: '#0f172a', lineHeight: 1.1, marginBottom: 20 }}>
              Never run out of power again.
            </h2>
            <p style={{ color: '#64748b', fontSize: 17, marginBottom: 36, lineHeight: 1.6 }}>
              Join thousands of Nigerian students who stay powered through every lecture and exam with Waka Charge.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => navigate('/register')}
                className="inline-flex items-center gap-2 font-black text-base transition-all group"
                style={{ padding: '16px 32px', borderRadius: 16, background: '#22c55e', color: '#fff', boxShadow: '0 8px 30px rgba(34,197,94,0.3)' }}
                onMouseEnter={e => e.currentTarget.style.background = '#16a34a'}
                onMouseLeave={e => e.currentTarget.style.background = '#22c55e'}
              >
                Get started free
                <ArrowRight size={17} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button
                onClick={() => navigate('/login')}
                className="font-bold text-base transition-all"
                style={{ padding: '16px 32px', borderRadius: 16, border: '2px solid #e2e8f0', color: '#374151' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#94a3b8'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}
              >
                Sign in
              </button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#060f1a', paddingTop: 64, paddingBottom: 32 }}>
        <div className="max-w-6xl mx-auto px-5 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2.5 mb-5">
                <div style={{ width: 34, height: 34, borderRadius: 10, background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Zap size={15} className="text-white fill-white" />
                </div>
                <span style={{ fontWeight: 900, color: '#fff', fontSize: 18 }}>
                  Waka<span style={{ color: '#4ade80' }}>Charge</span>
                </span>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, lineHeight: 1.7, maxWidth: 280, marginBottom: 24 }}>
                Campus energy rental platform for Nigerian students. Wallet · Access · Kiosk · Alliance.
              </p>
              <div className="flex gap-2.5">
                {[
                  { icon: <FiTwitter size={15} />, href: '#' },
                  { icon: <FiInstagram size={15} />, href: '#' },
                  { icon: <Mail size={15} />, href: 'mailto:support@wakacharge.com' },
                ].map((s, i) => (
                  <a
                    key={i}
                    href={s.href}
                    style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)', transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = '#fff' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)' }}
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>

            <div>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.25)', marginBottom: 16 }}>Product</p>
              <div className="flex flex-col gap-3">
                {[
                  { label: 'How it works', href: '#how' },
                  { label: 'Devices', href: '#devices' },
                  { label: 'Trust Score', href: '#trust' },
                  { label: 'Roadmap', href: '#roadmap' },
                  { label: 'Student login', href: '/login' },
                ].map(l => (
                  <a key={l.label} href={l.href} style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, textDecoration: 'none', transition: 'color 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.8)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}>
                    {l.label}
                  </a>
                ))}
              </div>
            </div>

            <div>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.25)', marginBottom: 16 }}>Contact</p>
              <div className="flex flex-col gap-3 mb-8">
                {[
                  { icon: <Mail size={13} />, text: 'support@wakacharge.com' },
                  { icon: <Phone size={13} />, text: '+234 800 000 0000' },
                  { icon: <MapPin size={13} />, text: 'Lagos, Nigeria' },
                ].map(c => (
                  <div key={c.text} className="flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>
                    {c.icon}
                    {c.text}
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.25)', marginBottom: 12 }}>Portals</p>
              <div className="flex flex-col gap-2">
                {[
                  { label: 'Operator login', href: '/operator-login' },
                  { label: 'Admin console', href: '/admin-login' },
                ].map(l => (
                  <a key={l.label} href={l.href} style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, textDecoration: 'none', transition: 'color 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.8)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}>
                    {l.label}
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8">
            <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>
              © 2026 Waka Charge Technologies Ltd. All rights reserved.
            </p>
            <div className="flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>
              <span>Powered by</span>
              <span style={{ fontWeight: 700, color: 'rgba(34,197,94,0.5)' }}>Nomba</span>
              <span>·</span>
              <span>Built for Nigeria 🇳🇬</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}



// import { useState, useEffect, useRef } from 'react'
// import { useNavigate } from 'react-router-dom'
// import { motion, useInView, AnimatePresence } from 'framer-motion'
// import {
//   Zap, Menu, X, ArrowRight, Battery, Lamp,
//   Package, Sofa, Shield, Star, MapPin, Clock,
//   ChevronDown, Mail, Phone,
//   CheckCircle, TrendingUp, Users, Building2,
//   Smartphone, CreditCard, RotateCcw, Lock
// } from 'lucide-react'
// import { FiInstagram as Instagram, FiTwitter as Twitter } from 'react-icons/fi'

// // ─── Nav ────────────────────────────────────────────────
// const Nav = () => {
//   const [open, setOpen] = useState(false)
//   const [scrolled, setScrolled] = useState(false)
//   const navigate = useNavigate()

//   useEffect(() => {
//     const fn = () => setScrolled(window.scrollY > 24)
//     window.addEventListener('scroll', fn)
//     return () => window.removeEventListener('scroll', fn)
//   }, [])

//   const links = [
//     { label: 'How it works', href: '#how' },
//     { label: 'Devices', href: '#devices' },
//     { label: 'Trust Score', href: '#trust' },
//     { label: 'Roadmap', href: '#roadmap' },
//   ]

//   const scrollTo = (href: string) => {
//     document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' })
//     setOpen(false)
//   }

//   return (
//     <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
//       scrolled
//         ? 'bg-white/95 backdrop-blur-xl border-b border-slate-100 shadow-sm'
//         : 'bg-transparent'
//     }`}>
//       <div className="max-w-6xl mx-auto px-5 lg:px-8">
//         <div className="flex items-center justify-between h-16 lg:h-18">

//           {/* Logo */}
//           <div className="flex items-center gap-2.5">
//             <div className="w-9 h-9 rounded-xl bg-green-500 flex items-center justify-center">
//               <Zap size={18} className="text-white fill-white" />
//             </div>
//             <div className="flex items-baseline gap-0.5">
//               <span className={`font-black text-lg transition-colors ${scrolled ? 'text-navy-900' : 'text-white'}`}>
//                 Waka
//               </span>
//               <span className="font-black text-lg text-green-400">Charge</span>
//             </div>
//           </div>

//           {/* Desktop links */}
//           <div className="hidden lg:flex items-center gap-8">
//             {links.map(l => (
//               <button
//                 key={l.href}
//                 onClick={() => scrollTo(l.href)}
//                 className={`text-sm font-semibold transition-colors hover:text-green-400 ${
//                   scrolled ? 'text-slate-600' : 'text-white/70'
//                 }`}
//               >
//                 {l.label}
//               </button>
//             ))}
//           </div>

//           {/* Desktop CTAs */}
//           <div className="hidden lg:flex items-center gap-3">
//             <button
//               onClick={() => navigate('/login')}
//               className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
//                 scrolled
//                   ? 'text-slate-600 hover:text-navy-900'
//                   : 'text-white/70 hover:text-white'
//               }`}
//             >
//               Sign in
//             </button>
//             <button
//               onClick={() => navigate('/register')}
//               className="px-4 py-2 rounded-xl bg-green-500 text-white text-sm font-bold hover:bg-green-400 transition-colors"
//             >
//               Get started
//             </button>
//           </div>

//           {/* Mobile hamburger */}
//           <button
//             onClick={() => setOpen(v => !v)}
//             className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center"
//             style={{ background: scrolled ? '#f1f5f9' : 'rgba(255,255,255,0.15)' }}
//           >
//             {open
//               ? <X size={18} className={scrolled ? 'text-navy-900' : 'text-white'} />
//               : <Menu size={18} className={scrolled ? 'text-navy-900' : 'text-white'} />
//             }
//           </button>
//         </div>
//       </div>

//       {/* Mobile menu */}
//       <AnimatePresence>
//         {open && (
//           <motion.div
//             initial={{ opacity: 0, height: 0 }}
//             animate={{ opacity: 1, height: 'auto' }}
//             exit={{ opacity: 0, height: 0 }}
//             className="lg:hidden bg-white border-t border-slate-100 overflow-hidden"
//           >
//             <div className="px-5 py-4 flex flex-col gap-1">
//               {links.map(l => (
//                 <button
//                   key={l.href}
//                   onClick={() => scrollTo(l.href)}
//                   className="text-left px-4 py-3 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-navy-900 transition-colors"
//                 >
//                   {l.label}
//                 </button>
//               ))}
//               <div className="border-t border-slate-100 pt-3 mt-2 flex flex-col gap-2">
//                 <button
//                   onClick={() => navigate('/login')}
//                   className="px-4 py-3 rounded-xl text-sm font-semibold text-slate-600 border border-slate-200 text-center"
//                 >
//                   Sign in
//                 </button>
//                 <button
//                   onClick={() => navigate('/register')}
//                   className="px-4 py-3 rounded-xl bg-green-500 text-white text-sm font-bold text-center"
//                 >
//                   Create account
//                 </button>
//               </div>
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </nav>
//   )
// }

// // ─── Fade-in wrapper ─────────────────────────────────────
// const FadeIn = ({
//   children,
//   delay = 0,
//   className = ''
// }: {
//   children: React.ReactNode
//   delay?: number
//   className?: string
// }) => {
//   const ref = useRef(null)
//   const inView = useInView(ref, { once: true, margin: '-60px' })
//   return (
//     <motion.div
//       ref={ref}
//       initial={{ opacity: 0, y: 20 }}
//       animate={inView ? { opacity: 1, y: 0 } : {}}
//       transition={{ duration: 0.5, delay, ease: 'easeOut' }}
//       className={className}
//     >
//       {children}
//     </motion.div>
//   )
// }

// // ─── Section label ───────────────────────────────────────
// const Label = ({ children }: { children: React.ReactNode }) => (
//   <p className="text-xs font-bold uppercase tracking-widest text-green-600 mb-3">
//     {children}
//   </p>
// )

// // ─── Main export ─────────────────────────────────────────
// export default function Landing() {
//   const navigate = useNavigate()

//   return (
//     <div className="bg-white min-h-screen font-sans">
//       <Nav />

//       {/* ══════════════════════════════════════════════
//           HERO
//       ══════════════════════════════════════════════ */}
//       <section
//         className="relative min-h-screen flex flex-col justify-center overflow-hidden"
//         style={{
//           background: 'linear-gradient(160deg, #060b12 0%, #0b1420 45%, #0f2318 100%)'
//         }}
//       >
//         {/* Grid pattern */}
//         <div
//           className="absolute inset-0 opacity-[0.04]"
//           style={{
//             backgroundImage: `
//               linear-gradient(rgba(29,185,84,0.5) 1px, transparent 1px),
//               linear-gradient(90deg, rgba(29,185,84,0.5) 1px, transparent 1px)
//             `,
//             backgroundSize: '48px 48px'
//           }}
//         />

//         {/* Glow orb */}
//         <div
//           className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-10 pointer-events-none"
//           style={{ background: 'radial-gradient(circle, #1db954, transparent 70%)' }}
//         />

//         <div className="relative max-w-6xl mx-auto px-5 lg:px-8 pt-24 pb-20">
//           <div className="grid lg:grid-cols-2 gap-16 items-center">

//             {/* Left */}
//             <div>
//               <motion.div
//                 initial={{ opacity: 0, y: 24 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 transition={{ delay: 0.1 }}
//               >
//                 <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/15 border border-green-500/30 mb-6">
//                   <Zap size={12} className="text-green-400 fill-green-400" />
//                   <span className="text-green-400 text-xs font-bold uppercase tracking-widest">
//                     Campus Energy Rental Platform
//                   </span>
//                 </div>

//                 <h1 className="text-5xl lg:text-6xl xl:text-7xl font-black text-white leading-[1.05] tracking-tight mb-6">
//                   Power to<br />
//                   <span className="text-green-400">study</span>{' '}
//                   through<br />
//                   any outage.
//                 </h1>

//                 <p className="text-white/50 text-lg leading-relaxed mb-8 max-w-md">
//                   Rent power banks, study lamps and comfort kits at campus
//                   kiosks. Pay with your Waka Wallet. Deposit refunded the
//                   moment you return.
//                 </p>

//                 <div className="flex flex-wrap gap-3">
//                   <button
//                     onClick={() => navigate('/register')}
//                     className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-green-500 text-white font-bold text-sm hover:bg-green-400 transition-all hover:shadow-lg hover:shadow-green-500/25 group"
//                   >
//                     Create account
//                     <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
//                   </button>
//                   <button
//                     onClick={() => navigate('/login')}
//                     className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl border border-white/15 text-white/70 font-semibold text-sm hover:bg-white/8 hover:text-white transition-all"
//                   >
//                     Sign in
//                   </button>
//                 </div>

//                 {/* Stats row */}
//                 <div className="flex items-center gap-6 mt-10 pt-10 border-t border-white/10">
//                   {[
//                     { n: '10+', label: 'Campuses' },
//                     { n: '₦300', label: 'From per rental' },
//                     { n: '4', label: 'Device types' },
//                   ].map(s => (
//                     <div key={s.label}>
//                       <p className="text-2xl font-black text-white">{s.n}</p>
//                       <p className="text-xs text-white/40 mt-0.5">{s.label}</p>
//                     </div>
//                   ))}
//                 </div>
//               </motion.div>
//             </div>

//             {/* Right — mock phone UI */}
//             <motion.div
//               initial={{ opacity: 0, scale: 0.95 }}
//               animate={{ opacity: 1, scale: 1 }}
//               transition={{ delay: 0.3, duration: 0.6 }}
//               className="hidden lg:flex justify-center"
//             >
//               <MockPhone />
//             </motion.div>
//           </div>
//         </div>

//         {/* Scroll hint */}
//         <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-30">
//           <span className="text-white text-xs">Scroll to explore</span>
//           <motion.div
//             animate={{ y: [0, 6, 0] }}
//             transition={{ duration: 1.5, repeat: Infinity }}
//           >
//             <ChevronDown size={16} className="text-white" />
//           </motion.div>
//         </div>
//       </section>

//       {/* ══════════════════════════════════════════════
//           TRUST BAR
//       ══════════════════════════════════════════════ */}
//       <section className="bg-slate-50 border-y border-slate-100 py-6">
//         <div className="max-w-6xl mx-auto px-5 lg:px-8">
//           <div className="flex flex-wrap items-center justify-center gap-8 lg:gap-16">
//             {[
//               { icon: <Shield size={16} />, text: 'Nomba-secured payments' },
//               { icon: <Clock size={16} />, text: 'Deposit refunded instantly on return' },
//               { icon: <Lock size={16} />, text: 'OTP-verified accounts' },
//               { icon: <CheckCircle size={16} />, text: 'Zero upfront device cost' },
//             ].map(t => (
//               <div key={t.text} className="flex items-center gap-2 text-slate-500 text-sm font-medium">
//                 <span className="text-green-500">{t.icon}</span>
//                 {t.text}
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* ══════════════════════════════════════════════
//           HOW IT WORKS
//       ══════════════════════════════════════════════ */}
//       <section id="how" className="py-24 lg:py-32">
//         <div className="max-w-6xl mx-auto px-5 lg:px-8">
//           <FadeIn className="text-center mb-16">
//             <Label>How it works</Label>
//             <h2 className="text-4xl lg:text-5xl font-black text-navy-900 mb-4">
//               Four steps to powered up
//             </h2>
//             <p className="text-slate-500 text-lg max-w-xl mx-auto">
//               From empty battery to fully charged in under two minutes.
//             </p>
//           </FadeIn>

//           <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
//             {[
//               {
//                 step: '01',
//                 icon: <Smartphone size={24} />,
//                 title: 'Create account',
//                 body: 'Verify your email with OTP. Your Nomba virtual account is created automatically.',
//                 color: '#1db954',
//               },
//               {
//                 step: '02',
//                 icon: <CreditCard size={24} />,
//                 title: 'Fund your wallet',
//                 body: 'Transfer to your Nomba account number or pay by card. Credited instantly.',
//                 color: '#0ea5e9',
//               },
//               {
//                 step: '03',
//                 icon: <MapPin size={24} />,
//                 title: 'Find a station',
//                 body: 'Scan the QR code at any campus kiosk or browse nearby stations in the app.',
//                 color: '#8b5cf6',
//               },
//               {
//                 step: '04',
//                 icon: <RotateCcw size={24} />,
//                 title: 'Return & get paid',
//                 body: 'Hand device to operator, enter your 4-digit code, deposit refunded immediately.',
//                 color: '#f59e0b',
//               },
//             ].map((s, i) => (
//               <FadeIn key={s.step} delay={i * 0.1}>
//                 <div className="relative p-6 rounded-3xl bg-white border border-slate-100 hover:border-slate-200 hover:shadow-card-hover transition-all group">
//                   <div className="absolute top-5 right-5 text-5xl font-black text-slate-50 select-none leading-none">
//                     {s.step}
//                   </div>
//                   <div
//                     className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
//                     style={{ background: `${s.color}18`, color: s.color }}
//                   >
//                     {s.icon}
//                   </div>
//                   <h3 className="font-black text-navy-900 text-lg mb-2">{s.title}</h3>
//                   <p className="text-slate-500 text-sm leading-relaxed">{s.body}</p>
//                 </div>
//               </FadeIn>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* ══════════════════════════════════════════════
//           DEVICES
//       ══════════════════════════════════════════════ */}
//       <section id="devices" className="py-24 lg:py-32 bg-slate-50">
//         <div className="max-w-6xl mx-auto px-5 lg:px-8">
//           <FadeIn className="text-center mb-16">
//             <Label>Available devices</Label>
//             <h2 className="text-4xl lg:text-5xl font-black text-navy-900 mb-4">
//               Everything you need for a full session
//             </h2>
//             <p className="text-slate-500 text-lg max-w-xl mx-auto">
//               Rent what you need, return when you're done. Deposit fully refunded.
//             </p>
//           </FadeIn>

//           <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
//             {[
//               {
//                 icon: <Battery size={32} />,
//                 name: 'Power Bank',
//                 price: 300,
//                 deposit: 500,
//                 maxHrs: 8,
//                 desc: 'Keep your phone and laptop charged through any blackout.',
//                 color: '#1db954',
//                 bg: '#f0fdf4',
//               },
//               {
//                 icon: <Lamp size={32} />,
//                 name: 'Study Lamp',
//                 price: 300,
//                 deposit: 500,
//                 maxHrs: 12,
//                 desc: 'Bright, battery-powered lamp for studying through power cuts.',
//                 color: '#f59e0b',
//                 bg: '#fffbeb',
//               },
//               {
//                 icon: <Package size={32} />,
//                 name: 'Survival Kit',
//                 price: 500,
//                 deposit: 700,
//                 maxHrs: 12,
//                 desc: 'Power bank + study lamp combo for serious study sessions.',
//                 color: '#0ea5e9',
//                 bg: '#f0f9ff',
//               },
//               {
//                 icon: <Sofa size={32} />,
//                 name: 'Comfort Kit',
//                 price: 700,
//                 deposit: 1000,
//                 maxHrs: 12,
//                 desc: 'Power bank + lamp + fan. Full comfort during any outage.',
//                 color: '#8b5cf6',
//                 bg: '#faf5ff',
//               },
//             ].map((d, i) => (
//               <FadeIn key={d.name} delay={i * 0.08}>
//                 <div
//                   className="rounded-3xl p-6 border border-transparent hover:border-current transition-all group cursor-default"
//                   style={{ background: d.bg }}
//                 >
//                   <div
//                     className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
//                     style={{ background: `${d.color}20`, color: d.color }}
//                   >
//                     {d.icon}
//                   </div>
//                   <h3 className="font-black text-navy-900 text-xl mb-1">{d.name}</h3>
//                   <p className="text-slate-500 text-sm leading-relaxed mb-5">{d.desc}</p>
//                   <div className="border-t border-slate-200 pt-4 flex items-center justify-between">
//                     <div>
//                       <p className="text-2xl font-black" style={{ color: d.color }}>
//                         ₦{d.price}
//                       </p>
//                       <p className="text-[11px] text-slate-400 mt-0.5">per rental</p>
//                     </div>
//                     <div className="text-right">
//                       <p className="text-sm font-bold text-slate-600">₦{d.deposit}</p>
//                       <p className="text-[11px] text-slate-400 mt-0.5">refundable deposit</p>
//                     </div>
//                   </div>
//                   <div className="mt-3 flex items-center gap-1.5">
//                     <Clock size={12} className="text-slate-400" />
//                     <span className="text-xs text-slate-400">Up to {d.maxHrs} hours</span>
//                   </div>
//                 </div>
//               </FadeIn>
//             ))}
//           </div>

//           <FadeIn className="mt-8 text-center">
//             <p className="text-slate-400 text-sm">
//               Coming soon:{' '}
//               <span className="font-semibold text-slate-600">Smart Hub</span>
//               {' '}·{' '}
//               <span className="font-semibold text-slate-600">Solar Kiosk</span>
//             </p>
//           </FadeIn>
//         </div>
//       </section>

//       {/* ══════════════════════════════════════════════
//           TRUST SCORE / RNPL
//       ══════════════════════════════════════════════ */}
//       <section id="trust" className="py-24 lg:py-32">
//         <div className="max-w-6xl mx-auto px-5 lg:px-8">
//           <div className="grid lg:grid-cols-2 gap-16 items-center">

//             {/* Left — trust score visual */}
//             <FadeIn>
//               <div className="relative bg-navy-900 rounded-3xl p-8 overflow-hidden">
//                 <div
//                   className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 pointer-events-none"
//                   style={{ background: 'radial-gradient(circle, #1db954, transparent)', transform: 'translate(30%,-30%)' }}
//                 />
//                 <p className="text-xs font-bold uppercase tracking-widest text-green-400 mb-2">
//                   Trust Score System
//                 </p>
//                 <p className="text-4xl font-black text-white mb-6">Build credit<br />on campus.</p>

//                 {/* Tiers */}
//                 <div className="flex flex-col gap-3">
//                   {[
//                     { emoji: '🔵', label: 'Basic', score: '0–9 pts', rnpl: 'Standard rental', active: false },
//                     { emoji: '🟡', label: 'Trusted', score: '10–17 pts', rnpl: 'RNPL ₦1,000 limit', active: true },
//                     { emoji: '⚪', label: 'Silver', score: '18–30 pts', rnpl: 'RNPL ₦2,500 limit', active: false },
//                     { emoji: '🏆', label: 'Gold', score: '31+ pts', rnpl: 'RNPL ₦5,000 limit', active: false },
//                   ].map(t => (
//                     <div
//                       key={t.label}
//                       className={`flex items-center gap-4 p-3 rounded-2xl transition-all ${
//                         t.active
//                           ? 'bg-green-500/15 border border-green-500/30'
//                           : 'bg-white/5 border border-white/8'
//                       }`}
//                     >
//                       <span className="text-2xl">{t.emoji}</span>
//                       <div className="flex-1">
//                         <div className="flex items-center gap-2">
//                           <p className="text-white font-bold text-sm">{t.label}</p>
//                           {t.active && (
//                             <span className="text-[10px] font-bold bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
//                               RNPL Unlocked
//                             </span>
//                           )}
//                         </div>
//                         <p className="text-white/40 text-xs mt-0.5">{t.score}</p>
//                       </div>
//                       <p className="text-xs font-semibold text-white/50 text-right">{t.rnpl}</p>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             </FadeIn>

//             {/* Right — explanation */}
//             <FadeIn delay={0.1}>
//               <Label>Rent Now, Pay Later</Label>
//               <h2 className="text-4xl lg:text-5xl font-black text-navy-900 mb-5 leading-tight">
//                 Your return history is your credit score.
//               </h2>
//               <p className="text-slate-500 text-lg leading-relaxed mb-8">
//                 Every on-time return builds your Trust Score. Once you hit 10 successful
//                 rentals, RNPL unlocks — rent without paying upfront and settle within 48 hours.
//               </p>

//               <div className="flex flex-col gap-4">
//                 {[
//                   {
//                     icon: <TrendingUp size={18} />,
//                     title: '+1 point per on-time return',
//                     body: 'Consistent returners climb tiers fast.',
//                   },
//                   {
//                     icon: <Star size={18} />,
//                     title: '+2 points for early return',
//                     body: 'Return before your window closes, earn extra credit.',
//                   },
//                   {
//                     icon: <CheckCircle size={18} />,
//                     title: 'RNPL up to ₦5,000 at Gold tier',
//                     body: '31 successful rentals gets you maximum credit access.',
//                   },
//                 ].map(f => (
//                   <div key={f.title} className="flex items-start gap-4">
//                     <div className="w-10 h-10 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center flex-shrink-0">
//                       {f.icon}
//                     </div>
//                     <div>
//                       <p className="font-bold text-navy-900 text-sm">{f.title}</p>
//                       <p className="text-slate-400 text-sm mt-0.5">{f.body}</p>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </FadeIn>
//           </div>
//         </div>
//       </section>

//       {/* ══════════════════════════════════════════════
//           CAMPUSES
//       ══════════════════════════════════════════════ */}
//       <section className="py-16 bg-slate-50">
//         <div className="max-w-6xl mx-auto px-5 lg:px-8 text-center">
//           <FadeIn>
//             <Label>Campus coverage</Label>
//             <h2 className="text-3xl font-black text-navy-900 mb-8">
//               Available at 10 universities across Nigeria
//             </h2>
//             <div className="flex flex-wrap justify-center gap-3">
//               {['LASU', 'UI', 'UNILAG', 'OAU', 'FUTA', 'UNIBEN', 'ABU', 'UNN', 'UNIPORT', 'LAUTECH'].map(c => (
//                 <div
//                   key={c}
//                   className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-sm font-bold text-navy-700"
//                 >
//                   <MapPin size={12} className="text-green-500" />
//                   {c}
//                 </div>
//               ))}
//             </div>
//           </FadeIn>
//         </div>
//       </section>

//       {/* ══════════════════════════════════════════════
//           ROADMAP
//       ══════════════════════════════════════════════ */}
//       <section id="roadmap" className="py-24 lg:py-32">
//         <div className="max-w-6xl mx-auto px-5 lg:px-8">
//           <FadeIn className="text-center mb-16">
//             <Label>What's coming</Label>
//             <h2 className="text-4xl lg:text-5xl font-black text-navy-900 mb-4">
//               Built for one campus.<br />Designed for every campus.
//             </h2>
//             <p className="text-slate-500 text-lg max-w-xl mx-auto">
//               Waka grows from energy rental into the financial identity of every Nigerian student.
//             </p>
//           </FadeIn>

//           <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
//             {[
//               {
//                 phase: 'Phase 1',
//                 title: 'Waka Charge',
//                 status: 'live',
//                 color: '#1db954',
//                 items: ['Device rentals', 'Nomba wallet', 'Trust Score', 'RNPL credit'],
//               },
//               {
//                 phase: 'Phase 2',
//                 title: 'Waka Market',
//                 status: 'next',
//                 color: '#0ea5e9',
//                 items: ['Vendor marketplace', 'Waka Riders delivery', 'Campus food orders'],
//               },
//               {
//                 phase: 'Phase 3',
//                 title: 'Waka Access',
//                 status: 'planned',
//                 color: '#8b5cf6',
//                 items: ['Digital ajo savings', 'Shuttle payments', 'Bill payments'],
//               },
//               {
//                 phase: 'Phase 4',
//                 title: 'Waka Alliance',
//                 status: 'planned',
//                 color: '#f59e0b',
//                 items: ['Vendor micro-loans', '170+ campuses', 'West Africa expansion'],
//               },
//             ].map((p, i) => (
//               <FadeIn key={p.phase} delay={i * 0.08}>
//                 <div className="p-6 rounded-3xl bg-white border border-slate-100 hover:shadow-card-hover transition-all h-full flex flex-col">
//                   <div className="flex items-center justify-between mb-4">
//                     <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{p.phase}</span>
//                     <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
//                       p.status === 'live'
//                         ? 'bg-green-50 text-green-600'
//                         : p.status === 'next'
//                         ? 'bg-sky-50 text-sky-600'
//                         : 'bg-slate-100 text-slate-400'
//                     }`}>
//                       {p.status === 'live' ? '● Live' : p.status === 'next' ? 'Building' : 'Planned'}
//                     </span>
//                   </div>
//                   <h3 className="text-xl font-black text-navy-900 mb-4">{p.title}</h3>
//                   <ul className="flex flex-col gap-2 flex-1">
//                     {p.items.map(item => (
//                       <li key={item} className="flex items-center gap-2 text-sm text-slate-500">
//                         <span style={{ color: p.color }} className="flex-shrink-0">✓</span>
//                         {item}
//                       </li>
//                     ))}
//                   </ul>
//                 </div>
//               </FadeIn>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* ══════════════════════════════════════════════
//           PORTALS
//       ══════════════════════════════════════════════ */}
//       <section className="py-16 bg-navy-900">
//         <div className="max-w-6xl mx-auto px-5 lg:px-8">
//           <FadeIn className="text-center mb-10">
//             <p className="text-xs font-bold uppercase tracking-widest text-green-400 mb-3">
//               Platform access
//             </p>
//             <h2 className="text-3xl font-black text-white">Three separate portals</h2>
//           </FadeIn>
//           <div className="grid md:grid-cols-3 gap-5">
//             {[
//               {
//                 icon: <Smartphone size={24} />,
//                 title: 'Student App',
//                 desc: 'Rent devices, fund wallet, build trust score, access RNPL.',
//                 cta: 'Create account',
//                 path: '/register',
//                 variant: 'green' as const,
//               },
//               {
//                 icon: <Building2 size={24} />,
//                 title: 'Operator Portal',
//                 desc: 'Manage kiosk inventory, confirm returns, track your shift.',
//                 cta: 'Operator login',
//                 path: '/operator-login',
//                 variant: 'amber' as const,
//               },
//               {
//                 icon: <TrendingUp size={24} />,
//                 title: 'Admin Console',
//                 desc: 'Revenue analytics, reconciliation, audit logs, full platform control.',
//                 cta: 'Admin login',
//                 path: '/admin-login',
//                 variant: 'slate' as const,
//               },
//             ].map((p, i) => {
//               const btnStyle = {
//                 green: 'bg-green-500 text-white hover:bg-green-400',
//                 amber: 'bg-amber-500 text-navy-950 hover:bg-amber-400',
//                 slate: 'bg-white/10 text-white hover:bg-white/20 border border-white/20',
//               }[p.variant]

//               return (
//                 <FadeIn key={p.title} delay={i * 0.08}>
//                   <div className="p-6 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/8 transition-all flex flex-col gap-4">
//                     <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white">
//                       {p.icon}
//                     </div>
//                     <div>
//                       <p className="font-black text-white text-lg">{p.title}</p>
//                       <p className="text-white/40 text-sm mt-1 leading-relaxed">{p.desc}</p>
//                     </div>
//                     <button
//                       onClick={() => navigate(p.path)}
//                       className={`px-4 py-3 rounded-2xl text-sm font-bold transition-all ${btnStyle}`}
//                     >
//                       {p.cta} →
//                     </button>
//                   </div>
//                 </FadeIn>
//               )
//             })}
//           </div>
//         </div>
//       </section>

//       {/* ══════════════════════════════════════════════
//           CTA BANNER
//       ══════════════════════════════════════════════ */}
//       <section className="py-24 bg-white">
//         <div className="max-w-3xl mx-auto px-5 text-center">
//           <FadeIn>
//             <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-green-500 mb-6">
//               <Zap size={28} className="text-white fill-white" />
//             </div>
//             <h2 className="text-4xl lg:text-5xl font-black text-navy-900 mb-5">
//               Ready to never run out of power again?
//             </h2>
//             <p className="text-slate-500 text-lg mb-8">
//               Join thousands of Nigerian students who already use Waka Charge
//               to stay powered through every lecture and exam.
//             </p>
//             <div className="flex flex-wrap items-center justify-center gap-3">
//               <button
//                 onClick={() => navigate('/register')}
//                 className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-green-500 text-white font-black text-base hover:bg-green-400 transition-all hover:shadow-xl hover:shadow-green-500/20 group"
//               >
//                 Get started free
//                 <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
//               </button>
//               <button
//                 onClick={() => navigate('/login')}
//                 className="px-8 py-4 rounded-2xl border-2 border-slate-200 text-navy-700 font-bold text-base hover:border-navy-300 transition-all"
//               >
//                 Sign in
//               </button>
//             </div>
//           </FadeIn>
//         </div>
//       </section>

//       {/* ══════════════════════════════════════════════
//           FOOTER
//       ══════════════════════════════════════════════ */}
//       <footer className="bg-navy-950 pt-16 pb-8">
//         <div className="max-w-6xl mx-auto px-5 lg:px-8">
//           <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-white/10">

//             {/* Brand */}
//             <div className="lg:col-span-2">
//               <div className="flex items-center gap-2.5 mb-4">
//                 <div className="w-9 h-9 rounded-xl bg-green-500 flex items-center justify-center">
//                   <Zap size={16} className="text-white fill-white" />
//                 </div>
//                 <div>
//                   <span className="font-black text-white text-lg">Waka</span>
//                   <span className="font-black text-green-400 text-lg">Charge</span>
//                 </div>
//               </div>
//               <p className="text-white/40 text-sm leading-relaxed max-w-xs mb-6">
//                 Campus energy rental platform for Nigerian students.
//                 Wallet · Access · Kiosk · Alliance.
//               </p>
//               <div className="flex items-center gap-3">
//                 {[
//                   { icon: <Twitter size={16} />, href: '#' },
//                   { icon: <Instagram size={16} />, href: '#' },
//                   { icon: <Mail size={16} />, href: 'mailto:support@wakacharge.com' },
//                 ].map((s, i) => (
//                   <a
//                     key={i}
//                     href={s.href}
//                     className="w-9 h-9 rounded-xl bg-white/8 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/15 transition-all"
//                   >
//                     {s.icon}
//                   </a>
//                 ))}
//               </div>
//             </div>

//             {/* Product */}
//             <div>
//               <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-4">Product</p>
//               <div className="flex flex-col gap-3">
//                 {[
//                   { label: 'How it works', href: '#how' },
//                   { label: 'Devices', href: '#devices' },
//                   { label: 'Trust Score', href: '#trust' },
//                   { label: 'Roadmap', href: '#roadmap' },
//                   { label: 'Student login', href: '/login' },
//                 ].map(l => (
//                   <a
//                     key={l.label}
//                     href={l.href}
//                     className="text-white/40 text-sm hover:text-white/80 transition-colors"
//                   >
//                     {l.label}
//                   </a>
//                 ))}
//               </div>
//             </div>

//             {/* Contact */}
//             <div>
//               <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-4">Contact</p>
//               <div className="flex flex-col gap-3">
//                 <div className="flex items-center gap-2 text-white/40 text-sm">
//                   <Mail size={14} />
//                   support@wakacharge.com
//                 </div>
//                 <div className="flex items-center gap-2 text-white/40 text-sm">
//                   <Phone size={14} />
//                   +234 800 000 0000
//                 </div>
//                 <div className="flex items-center gap-2 text-white/40 text-sm">
//                   <MapPin size={14} />
//                   Lagos, Nigeria
//                 </div>
//               </div>

//               <div className="mt-6">
//                 <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-3">
//                   Portals
//                 </p>
//                 <div className="flex flex-col gap-2">
//                   {[
//                     { label: 'Operator login', href: '/operator-login' },
//                     { label: 'Admin console', href: '/admin-login' },
//                   ].map(l => (
//                   <a
//                     key={l.label}
//                     href={l.href}
//                     className="text-white/40 text-sm hover:text-white/80 transition-colors"
//                   >
//                     {l.label}
//                   </a>
//                 ))}
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Bottom bar */}
//           <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8">
//             <p className="text-white/25 text-xs">
//               © 2026 Waka Charge. All rights reserved.
//             </p>
//             <div className="flex items-center gap-2 text-white/25 text-xs">
//               <span>Powered by</span>
//               <span className="font-bold text-green-500/60">Nomba</span>
//               <span>·</span>
//               <span>Built for Nigeria 🇳🇬</span>
//             </div>
//           </div>
//         </div>
//       </footer>
//     </div>
//   )
// }

// // ─── Mock phone UI ───────────────────────────────────────
// const MockPhone = () => (
//   <div className="relative">
//     {/* Glow behind phone */}
//     <div
//       className="absolute inset-0 blur-3xl opacity-20 rounded-full"
//       style={{ background: '#1db954' }}
//     />

//     <div
//       className="relative w-64 rounded-[2.5rem] overflow-hidden shadow-2xl"
//       style={{
//         background: '#0b1420',
//         border: '1px solid rgba(255,255,255,0.12)',
//         padding: '2px',
//       }}
//     >
//       <div className="rounded-[2.4rem] overflow-hidden bg-slate-50">
//         {/* Status bar */}
//         <div className="bg-navy-900 px-6 pt-4 pb-5">
//           <div className="flex items-center justify-between mb-5">
//             <p className="text-white/40 text-xs">9:41</p>
//             <div className="flex items-center gap-1">
//               <div className="w-4 h-2 rounded-sm border border-white/30 relative">
//                 <div className="absolute inset-0.5 right-1 bg-green-400 rounded-sm" />
//               </div>
//             </div>
//           </div>
//           <p className="text-white/40 text-[10px] font-semibold uppercase tracking-widest mb-1">Waka Wallet</p>
//           <p className="text-white text-3xl font-black">₦2,500</p>
//           <div className="mt-4 flex gap-2">
//             <div className="flex-1 py-2 rounded-xl bg-green-500 text-center">
//               <p className="text-navy-950 text-xs font-bold">+ Fund</p>
//             </div>
//             <div className="flex-1 py-2 rounded-xl bg-white/10 text-center">
//               <p className="text-white/70 text-xs font-semibold">History</p>
//             </div>
//           </div>
//         </div>

//         {/* Active rental card */}
//         <div className="px-4 py-4 border-b border-slate-100">
//           <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Active rental</p>
//                 <p className="font-black text-navy-900 text-sm mt-0.5">🔋 Power Bank</p>
//                 <p className="text-amber-500 text-xs font-bold mt-0.5">3h 22m left</p>
//               </div>
//               <div className="text-right">
//                 <p className="text-[10px] text-slate-400">Locker</p>
//                 <p className="font-black text-navy-900">PB-4</p>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Trust score */}
//         <div className="px-4 py-3 border-b border-slate-100">
//           <div className="flex items-center justify-between mb-1.5">
//             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Trust Score</p>
//             <p className="text-[10px] font-bold text-amber-500">🟡 Trusted</p>
//           </div>
//           <div className="flex items-center gap-2">
//             <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
//               <div className="h-full w-2/3 bg-green-400 rounded-full" />
//             </div>
//             <p className="text-[10px] font-black text-navy-900">12 pts</p>
//           </div>
//         </div>

//         {/* Quick actions */}
//         <div className="px-4 py-3">
//           <div className="grid grid-cols-4 gap-2">
//             {[
//               { icon: <MapPin size={14} />, label: 'Station' },
//               { icon: <Battery size={14} />, label: 'Rent' },
//               { icon: <CreditCard size={14} />, label: 'Wallet' },
//               { icon: <Star size={14} />, label: 'Trust' },
//             ].map(a => (
//               <div key={a.label} className="flex flex-col items-center gap-1">
//                 <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
//                   {a.icon}
//                 </div>
//                 <p className="text-[9px] text-slate-400 font-semibold">{a.label}</p>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* Bottom nav */}
//         <div className="px-4 py-3 bg-white border-t border-slate-100 flex items-center justify-around">
//           {[
//             { icon: <Zap size={16} />, active: true },
//             { icon: <CreditCard size={16} />, active: false },
//             { icon: <MapPin size={16} />, active: false },
//             { icon: <Battery size={16} />, active: false },
//           ].map((n, i) => (
//             <div
//               key={i}
//               className={`flex flex-col items-center ${n.active ? 'text-green-500' : 'text-slate-300'}`}
//             >
//               {n.icon}
//               {n.active && <div className="w-1 h-1 rounded-full bg-green-500 mt-1" />}
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   </div>
// )