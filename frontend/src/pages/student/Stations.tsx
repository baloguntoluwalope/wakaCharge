import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { rentalsApi } from '../../api/rentals.api'
import { useAuth } from '../../context/AuthContext'
import { TopBar } from '../../components/shared/TopBar'
import { Card, Skeleton } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { EmptyState } from '../../components/ui/EmptyState'

export default function Stations() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['stations'],
    queryFn: () => rentalsApi.getStations(),
  })

  const stations = (data as any)?.stations || []

  return (
    <div className="bg-slate-50 min-h-svh">
      <TopBar title={`${user?.campus} Stations`} onBack={false} />
      <div className="px-5 py-5 flex flex-col gap-5">

        {/* Scan CTA */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => navigate('/scan')}
          className="rounded-3xl overflow-hidden cursor-pointer"
          style={{ background: 'linear-gradient(135deg, #0b1420, #1a2f45)' }}
        >
          <div className="p-6 flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-green-500/20 flex items-center justify-center text-4xl flex-shrink-0">
              📷
            </div>
            <div>
              <p className="text-white font-black text-lg">Scan station QR</p>
              <p className="text-white/50 text-sm mt-0.5">
                Point at any kiosk QR to rent instantly
              </p>
            </div>
          </div>
        </motion.div>

        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
          Stations near you — {user?.campus}
        </p>

        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-28" />)}
          </div>
        ) : stations.length === 0 ? (
          <EmptyState
            icon="📍"
            title={`No stations at ${user?.campus} yet`}
            description="We're expanding soon. Check back shortly."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {stations.map((s: any, i: number) => (
              <motion.div
                key={s._id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <Card
                  hoverable
                  onClick={() => navigate(`/stations/${s._id}`)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-green-100 flex items-center justify-center text-xl flex-shrink-0">
                        ⚡
                      </div>
                      <div>
                        <p className="font-bold text-navy-900">{s.name}</p>
                        <p className="text-sm text-slate-400 mt-0.5">{s.location}</p>
                      </div>
                    </div>
                    <Badge variant={s.isActive ? 'green' : 'slate'} dot>
                      {s.isActive ? 'Active' : 'Offline'}
                    </Badge>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {['🔋', '💡', '🎒', '🛋️'].map((emoji, j) => (
                      <div key={j}
                        className="bg-slate-100 rounded-xl px-2 py-1 text-sm flex items-center gap-1">
                        {emoji}
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}