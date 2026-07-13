import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { QrCode, Zap, MapPin, Battery, Lightbulb, Briefcase, Armchair } from 'lucide-react'
import { rentalsApi } from '../../api/rentals.api'
import { useAuth } from '../../context/AuthContext'
import { TopBar } from '../../components/shared/TopBar'
import { Card, Skeleton } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { EmptyState } from '../../components/ui/EmptyState'

// High-quality iconography mapping to replace the old emojis beautifully
const STATION_UTILITIES = [
  { icon: Battery, label: 'Power', color: 'text-amber-500 bg-amber-50 border-amber-100' },
  { icon: Lightbulb, label: 'Lighting', color: 'text-indigo-500 bg-indigo-50 border-indigo-100' },
  { icon: Briefcase, label: 'Storage', color: 'text-emerald-500 bg-emerald-50 border-emerald-100' },
  { icon: Armchair, label: 'Lounge', color: 'text-rose-500 bg-rose-50 border-rose-100' },
]

export default function Stations() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['stations'],
    queryFn: () => rentalsApi.getStations(),
  })

  const stations = (data as any)?.stations || []

  return (
    <div className="bg-slate-50 min-h-svh antialiased text-slate-900">
      <TopBar title={`${user?.campus || 'Campus'} Stations`} onBack={false} />
      
      <div className="max-w-md mx-auto px-4 py-6 flex flex-col gap-6">

        {/* Premium Dark Action Card */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => navigate('/scan')}
          className="relative overflow-hidden rounded-2xl bg-slate-950 p-5 text-white shadow-md cursor-pointer group active:scale-[0.99] transition-all duration-200"
        >
          <div className="absolute -right-6 -top-6 w-28 h-28 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full blur-2xl opacity-40 group-hover:opacity-60 transition-opacity" />
          
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-sm">
              <QrCode size={22} className="stroke-[2]" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-base tracking-tight text-white">Scan Station QR</h3>
              <p className="text-emerald-300/80 text-xs mt-0.5 font-medium">
                Point at any kiosk screen to unlock instantly
              </p>
            </div>
          </div>
        </motion.div>

        {/* Dynamic Header */}
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Stations near you
          </h2>
          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100/60 px-2.5 py-0.5 rounded-full">
            {user?.campus}
          </span>
        </div>

        {/* Stations Stream */}
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
        ) : stations.length === 0 ? (
          <EmptyState
            icon={<MapPin className="text-slate-300 w-8 h-8" />}
            title="No Active Stations"
            description={`We haven't launched stations at ${user?.campus || 'your campus'} quite yet.`}
          />
        ) : (
          <div className="flex flex-col gap-3">
            {stations.map((s: any, i: number) => (
              <motion.div
                key={s._id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card
                  hoverable
                  onClick={() => navigate(`/stations/${s._id}`)}
                  className="p-4 bg-white border border-slate-200/60 rounded-2xl shadow-sm transition-all hover:border-indigo-200/80 hover:shadow-md hover:shadow-indigo-500/5 group"
                >
                  <div className="flex items-start justify-between gap-4 mb-3.5">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors shadow-sm ${
                        s.isActive 
                          ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white' 
                          : 'bg-slate-100 text-slate-400'
                      }`}>
                        <Zap size={18} className="stroke-[2]" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 group-hover:text-indigo-900 transition-colors leading-snug">
                          {s.name}
                        </h4>
                        <div className="flex items-center gap-1 text-slate-500 mt-0.5">
                          <MapPin size={12} className="text-slate-400" />
                          <p className="text-xs font-medium">{s.location}</p>
                        </div>
                      </div>
                    </div>
                    
                    <Badge variant={s.isActive ? 'green' : 'slate'} dot>
                      <span className="text-xs font-bold tracking-tight">
                        {s.isActive ? 'Online' : 'Offline'}
                      </span>
                    </Badge>
                  </div>

                  {/* Clean, Modern Utility Features Grid */}
                  <div className="flex gap-2 flex-wrap pt-3 border-t border-slate-100">
                    {STATION_UTILITIES.map((utility, idx) => {
                      const IconComponent = utility.icon
                      return (
                        <div 
                          key={idx}
                          className={`border rounded-xl px-2.5 py-1 text-xs font-semibold flex items-center gap-1.5 shadow-sm/5 ${utility.color}`}
                        >
                          <IconComponent size={13} className="stroke-[2]" />
                          <span>{utility.label}</span>
                        </div>
                      )
                    })}
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