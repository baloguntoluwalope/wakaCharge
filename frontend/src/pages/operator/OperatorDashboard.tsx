import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { operatorApi } from '../../api/operator.api'
import { useAuth } from '../../context/AuthContext'
import { authApi } from '../../api/auth.api'
import { useNavigate } from 'react-router-dom'
import { Card, Skeleton } from '../../components/ui/Card'
import { Badge, StatusPill } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { useToast } from '../../components/ui/Toast'
import { deviceEmoji } from '../../utils'

export default function OperatorDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const qc = useQueryClient()
  const [clockedIn, setClockedIn] = useState(false)
  const [clockInTime, setClockInTime] = useState<string | null>(null)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['operator-dashboard'],
    queryFn: operatorApi.getDashboard,
    refetchInterval: 30000,
  })

  const dash = data as any

  const { mutate: clockIn } = useMutation({
    mutationFn: operatorApi.clockIn,
    onSuccess: () => {
      setClockedIn(true)
      setClockInTime(new Date().toISOString())
      toast('Clocked in. Good shift!', 'success')
    }
  })

  const { mutate: clockOut } = useMutation({
    mutationFn: () => operatorApi.clockOut(clockInTime!),
    onSuccess: () => {
      toast('Clocked out. Shift summary saved.', 'success')
      setClockedIn(false)
      try { authApi.logout() } catch {}
      logout()
      navigate('/')
    }
  })

  const { mutate: confirmReturn } = useMutation({
    mutationFn: (rentalId: string) => operatorApi.confirmReturn(rentalId),
    onSuccess: () => {
      toast('Confirmed. Student can now enter their code.', 'success')
      qc.invalidateQueries({ queryKey: ['operator-dashboard'] })
      setConfirmingId(null)
    },
    onError: (err: any) => {
      toast(err.response?.data?.message || 'Failed', 'error')
      setConfirmingId(null)
    }
  })

  return (
    <div className="bg-slate-50 min-h-svh">
      {/* Header */}
      <div className="bg-navy-900 px-5 pt-14 pb-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-white/40 font-semibold uppercase tracking-widest mb-0.5">
              Operator Station
            </p>
            <p className="text-white font-black text-xl">{dash?.station?.name || 'Loading…'}</p>
            <p className="text-white/40 text-xs mt-0.5">{user?.campus}</p>
          </div>
          <Button
            variant={clockedIn ? 'danger' : 'primary'}
            size="sm"
            onClick={() => clockedIn ? clockOut() : clockIn()}
            className="w-auto"
          >
            {clockedIn ? 'Clock out' : 'Clock in'}
          </Button>
        </div>

        {/* Summary strip */}
        {dash?.summary && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Active', value: dash.summary.activeRentals, color: '#1db954' },
              { label: 'Overdue', value: dash.summary.overdueRentals, color: '#f59e0b' },
              { label: 'Available', value: dash.summary.availableDevices, color: '#fff' },
            ].map(s => (
              <div key={s.label} className="bg-white/10 rounded-2xl p-3 text-center">
                <p className="font-black text-2xl" style={{ color: s.color }}>{s.value}</p>
                <p className="text-white/40 text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="px-5 py-5 flex flex-col gap-5">
        {/* Inventory */}
        {dash?.inventory && (
          <Card>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
              Kiosk inventory
            </p>
            <div className="flex flex-col gap-3">
              {Object.entries(dash.inventory).map(([type, inv]: [string, any]) => (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{deviceEmoji(type as any)}</span>
                    <p className="font-semibold text-navy-900 text-sm capitalize">{type}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="green" size="xs">{inv.available} avail</Badge>
                    <Badge variant="blue" size="xs">{inv.rented} rented</Badge>
                    {inv.damaged > 0 && <Badge variant="red" size="xs">{inv.damaged} dmg</Badge>}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Low inventory alert */}
        {dash?.lowInventory?.length > 0 && (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-4">
            <p className="text-amber-700 font-bold text-sm">
              ⚠️ Restock needed: {dash.lowInventory.join(', ')}
            </p>
            <p className="text-amber-600 text-xs mt-1">
              Open back panel and reload these devices from charging rack.
            </p>
          </div>
        )}

        {/* Active rentals */}
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2].map(i => <Skeleton key={i} className="h-36" />)}
          </div>
        ) : dash?.activeRentals?.length > 0 ? (
          <div className="flex flex-col gap-3">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Active rentals — confirm returns
            </p>
            {dash.activeRentals.map((rental: any) => (
              <motion.div
                key={rental._id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className={rental.status === 'overdue' ? 'border-2 border-amber-300 bg-amber-50' : ''}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{deviceEmoji(rental.deviceType)}</span>
                      <div>
                        <p className="font-bold text-navy-900">{rental.userId?.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Return by {new Date(rental.expectedReturnTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <StatusPill status={rental.status} />
                  </div>

                  <div className="flex items-center justify-between mb-3 bg-slate-50 rounded-2xl px-3 py-2">
                    <p className="text-xs text-slate-400">Confirmation code</p>
                    <p className="font-mono font-black text-amber-500 text-lg tracking-widest">
                      {rental.confirmationCode}
                    </p>
                  </div>

                  {rental.operatorConfirmed ? (
                    <p className="text-green-600 text-sm font-semibold text-center">
                      ✓ Confirmed — waiting for student code
                    </p>
                  ) : (
                    <Button
                      variant="primary"
                      fullWidth
                      loading={confirmingId === rental._id}
                      onClick={() => {
                        setConfirmingId(rental._id)
                        confirmReturn(rental._id)
                      }}
                    >
                      ✓ Confirm device received
                    </Button>
                  )}
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card className="text-center py-8">
            <p className="text-4xl mb-3">✅</p>
            <p className="font-bold text-navy-900">All clear</p>
            <p className="text-slate-400 text-sm mt-1">No active rentals requiring action</p>
          </Card>
        )}

        <Button variant="secondary" fullWidth onClick={() => refetch()}>
          Refresh dashboard
        </Button>
      </div>
    </div>
  )
}
