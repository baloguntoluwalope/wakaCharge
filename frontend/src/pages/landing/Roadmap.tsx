import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { TopBar } from '../../components/shared/TopBar'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'

const phases = [
  {
    phase: 'Phase 1 — Live Now',
    title: 'Waka Charge',
    status: 'live' as const,
    color: '#1db954',
    items: [
      'Power Bank, Study Lamp, Survival Kit & Comfort Kit rentals',
      'Smart locker simulation with dual confirmation codes',
      'Nomba Virtual Account + Checkout for wallet funding',
      'Trust Score system with Rent Now, Pay Later unlock',
      'OTP-based fintech authentication',
      'Operator kiosk management + shift handover',
    ]
  },
  {
    phase: 'Phase 2 — Building Next',
    title: 'Waka Market, Communities & Cities',
    status: 'next' as const,
    color: '#0ea5e9',
    items: [
      'Campus vendor marketplace — food, printing, laundry',
      'Waka Riders delivery network across off-campus student residential zones',
      'Geo-fenced city hubs — starting with tech-heavy urban clusters (e.g., Yaba, Lagos)',
      'Community power circles — shared charging infrastructure for off-campus apartments',
      'Vendor payment confirmation — eliminating transfer fraud for community businesses',
    ]
  },
  {
    phase: 'Phase 3',
    title: 'Waka Access',
    status: 'planned' as const,
    color: '#8b5cf6',
    items: [
      'Digital ajo/esusu savings circles for student and neighborhood groups',
      'Campus & city shuttle payments — ending cash arguments with transit drivers',
      'Utility bills — fast airtime, data, prepaid electricity, and cable management',
    ]
  },
  {
    phase: 'Phase 4',
    title: 'Waka Alliance',
    status: 'planned' as const,
    color: '#f59e0b',
    items: [
      'Vendor micro-loans built on community transaction history',
      'Waka Nest — student & young professional accommodation payments',
      'Smart Hub — solar-powered multi-device kiosks deployed across Nigerian cities',
      'Expansion to 170+ Nigerian campuses and major urban student towns',
      'West African rollout — Ghana, Kenya, Senegal',
    ]
  }
]

const statusBadge = (status: string) => {
  if (status === 'live') return <Badge variant="green" dot>Live</Badge>
  if (status === 'next') return <Badge variant="blue" dot>Building Next</Badge>
  return <Badge variant="slate">Planned</Badge>
}

export default function Roadmap() {
  const navigate = useNavigate()

  return (
    <div className="min-h-svh bg-slate-50">
      <TopBar title="Roadmap" />
      <div className="px-5 py-6 max-w-lg mx-auto">
        <p className="text-xs font-bold uppercase tracking-widest text-green-600 mb-2">
          Where We're Going
        </p>
        <h1 className="text-3xl font-black text-navy-900 leading-tight mb-3">
          Built for one campus. Designed for every community.
        </h1>
        <p className="text-slate-500 text-sm leading-relaxed mb-8">
          Waka starts as an energy rental kiosk. It grows into the financial
          identity of every young Nigerian — from their first year on campus
          to their first apartment in the city.
        </p>

        {/* ── Timeline Phases ────────────────────────────── */}
        <div className="flex flex-col gap-4">
          {phases.map((p, i) => (
            <motion.div
              key={p.phase}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className={p.status === 'live' ? 'border-l-4 border-l-green-500' : ''}>
                <div className="flex items-start justify-between mb-2">
                  <p className="text-xs text-slate-400 font-semibold">{p.phase}</p>
                  {statusBadge(p.status)}
                </div>
                <h2 className="text-xl font-black text-navy-900 mb-3">{p.title}</h2>
                <ul className="flex flex-col gap-2">
                  {p.items.map((item, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-slate-600">
                      <span style={{ color: p.color }} className="mt-0.5 flex-shrink-0">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* ── Why It Lasts Feature Section (Visibility Fixed) ── */}
        <div className="mt-6 bg-slate-900 rounded-3xl p-5 border border-slate-800 shadow-xl">
          <p className="text-xs font-black uppercase tracking-widest text-emerald-400 mb-2">
            Why It Lasts
          </p>
          <p className="text-slate-100 text-sm font-medium leading-relaxed">
            A student who funds their wallet in year one graduates four years
            later still holding it. Power outages, daily local commerce, and
            trust-based credit are real-world needs that don't stop at the university gate.
          </p>
        </div>

        <Button
          variant="primary"
          fullWidth
          size="lg"
          className="mt-6"
          onClick={() => navigate(-1)}
        >
          Back to dashboard
        </Button>
      </div>
    </div>
  )
}