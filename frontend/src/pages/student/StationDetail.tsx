import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { rentalsApi } from '../../api/rentals.api'
import { TopBar } from '../../components/shared/TopBar'
import { Card, Skeleton } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { DEVICE_CONFIG } from '../../theme/tokens'
import { formatCurrency } from '../../utils'

export default function StationDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const scanned = location.state?.scanned

  const { data, isLoading } = useQuery({
    queryKey: ['station', id],
    queryFn: () => rentalsApi.getStation(id!),
  })

  const station = (data as any)?.station
  const inventory = (data as any)?.inventory || {}

  return (
    <div className="bg-slate-50 min-h-svh">
      <TopBar title={station?.name || 'Station'} />
      <div className="px-5 py-5 flex flex-col gap-5">

        {scanned && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 border border-green-200 rounded-2xl px-4 py-3 flex items-center gap-2"
          >
            <span className="text-green-600">✓</span>
            <p className="text-green-700 text-sm font-semibold">QR scanned successfully</p>
          </motion.div>
        )}

        {isLoading ? (
          <Skeleton className="h-20" />
        ) : station && (
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">{station.campus}</p>
                <p className="font-bold text-navy-900 mt-0.5">{station.location}</p>
              </div>
              <Badge variant={station.isActive ? 'green' : 'slate'} dot>
                {station.isActive ? 'Active' : 'Offline'}
              </Badge>
            </div>
          </Card>
        )}

        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
          Available to rent
        </p>

        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {Object.entries(DEVICE_CONFIG).map(([type, config], i) => {
              const inv = inventory[type] || { total: 0, available: 0 }
              const isAvailable = inv.available > 0

              return (
                <motion.div
                  key={type}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <Card
                    hoverable={isAvailable}
                    onClick={() => isAvailable && navigate('/rent', {
                      state: {
                        stationId: id,
                        deviceType: type,
                        config: {
                          label: config.label,
                          price: config.price,
                          deposit: config.deposit,
                          maxHours: config.maxHours,
                          color: config.color,
                          description: config.description,
                        },
                        stationName: station?.name
                      }
                    })}
                    className={isAvailable ? '' : 'opacity-50'}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                        style={{ background: `${config.color}15` }}
                      >
                        <config.icon className="text-2xl" style={{ color: config.color }} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-navy-900">{config.label}</p>
                          <div className="text-right">
                            <p className="text-lg font-black" style={{ color: config.color }}>
                              {inv.available}
                            </p>
                            <p className="text-xs text-slate-400">of {inv.total}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <Badge variant="green" size="xs">
                            {formatCurrency(config.price)} rental
                          </Badge>
                          <Badge variant="slate" size="xs">
                            {formatCurrency(config.deposit)} deposit
                          </Badge>
                          <Badge variant="slate" size="xs">
                            {config.maxHours}h max
                          </Badge>
                        </div>
                        {isAvailable && (
                          <p className="text-xs text-green-600 font-semibold mt-2">
                            Tap to rent →
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}