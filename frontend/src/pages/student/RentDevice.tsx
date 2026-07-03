import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { rentalsApi } from '../../api/rentals.api'
import { paymentsApi } from '../../api/payments.api'
import { useAuth } from '../../context/AuthContext'
import { TopBar } from '../../components/shared/TopBar'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { useToast } from '../../components/ui/Toast'
import { DEVICE_CONFIG } from '../../theme/tokens'
import { formatCurrency } from '../../utils'

export default function RentDevice() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const { toast } = useToast()
  const { stationId, deviceType, config, stationName } = location.state || {}

  const [hours, setHours] = useState(2)
  const [useRNPL, setUseRNPL] = useState(false)

  const { data: walletData } = useQuery({
    queryKey: ['wallet'],
    queryFn: paymentsApi.getWallet,
  })

  const wallet = walletData as any
  const baseConfig = (deviceType && DEVICE_CONFIG[deviceType as keyof typeof DEVICE_CONFIG]) || undefined
  const viewConfig = { ...baseConfig, ...config }
  const totalCost = (viewConfig?.price || 0) + (viewConfig?.deposit || 0)
  const canRNPL = user?.rnplEnabled && !user?.rnplOutstanding
  const canAfford = (wallet?.walletBalance || 0) >= totalCost
  const Icon = viewConfig?.icon

  const hoursOptions = {
    powerbank: [1, 2, 3, 4, 6, 8],
    studylamp: [1, 2, 3, 4, 6, 8, 10, 12],
    survivalkit: [1, 2, 3, 4, 6, 8, 10, 12],
    comfortkit: [1, 2, 3, 4, 6, 8, 10, 12],
  }[deviceType as string] || [1, 2, 4, 8]

  const { mutate, isPending } = useMutation({
    mutationFn: () => rentalsApi.startRental({ stationId, deviceType, selectedHours: hours, useRNPL }),
    onSuccess: (res: any) => {
      navigate('/locker-unlock', { state: { rental: res.rental, locker: res.locker } })
    },
    onError: (err: any) => {
      toast(err.response?.data?.message || 'Could not start rental', 'error')
    }
  })

  useEffect(() => { if (!stationId) navigate('/stations') }, [stationId])

  if (!stationId) return null

  return (
    <div className="bg-slate-50 min-h-svh">
      <TopBar title="Rent Device" />
      <div className="px-5 py-5 flex flex-col gap-5">

        {/* Device header */}
        <div
          className="rounded-3xl p-6 text-center"
          style={{ background: `linear-gradient(135deg, ${config?.color}20, ${config?.color}08)`, border: `1px solid ${config?.color}30` }}
        >
          <div className="mb-3 flex justify-center">
            {Icon ? <Icon className="text-6xl" style={{ color: viewConfig?.color }} /> : null}
          </div>
          <h2 className="text-2xl font-black text-navy-900">{viewConfig?.label}</h2>
          <p className="text-slate-400 text-sm mt-1">{stationName}</p>
          <div className="flex justify-center gap-2 mt-3">
            <Badge variant="green" size="sm">{formatCurrency(viewConfig?.price || 0)} rental</Badge>
            <Badge variant="slate" size="sm">{formatCurrency(viewConfig?.deposit || 0)} deposit</Badge>
          </div>
        </div>

        {/* Duration picker */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
            How long do you need it?
          </p>
          <div className="grid grid-cols-4 gap-2">
            {hoursOptions.map(h => (
              <motion.button
                key={h}
                whileTap={{ scale: 0.93 }}
                onClick={() => setHours(h)}
                className={`py-3 rounded-2xl text-sm font-black transition-all ${
                  hours === h
                    ? 'bg-navy-900 text-white'
                    : 'bg-white text-navy-700 border border-slate-200 hover:border-navy-300'
                }`}
              >
                {h}h
              </motion.button>
            ))}
          </div>
        </div>

        {/* Cost breakdown */}
        <Card>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
            Cost breakdown
          </p>
          {[
            { label: 'Rental fee', value: formatCurrency(viewConfig?.price || 0) },
            { label: 'Refundable deposit', value: formatCurrency(viewConfig?.deposit || 0) },
          ].map(row => (
            <div key={row.label} className="flex items-center justify-between py-2 border-b border-slate-50">
              <p className="text-sm text-slate-500">{row.label}</p>
              <p className="font-semibold text-navy-900 text-sm">{row.value}</p>
            </div>
          ))}
          <div className="flex items-center justify-between pt-3">
            <p className="font-bold text-navy-900">Total to pay now</p>
            <p className="text-xl font-black text-green-600">{formatCurrency(totalCost)}</p>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Wallet: {formatCurrency(wallet?.walletBalance || 0)}
            {!canAfford && !canRNPL && (
              <span className="text-red-500">
                {' '}— {formatCurrency(totalCost - (wallet?.walletBalance || 0))} short
              </span>
            )}
          </p>
        </Card>

        {/* RNPL toggle */}
        {canRNPL && (
          <motion.div
            onClick={() => setUseRNPL(v => !v)}
            className={`rounded-3xl p-5 cursor-pointer border-2 transition-all ${
              useRNPL ? 'border-amber-400 bg-amber-50' : 'border-slate-200 bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-navy-900">⭐ Rent Now, Pay Later</p>
                <p className="text-xs text-slate-400 mt-1">
                  RNPL active · Limit {formatCurrency(user?.rnplLimit || 0)} · Pay within 48hrs
                </p>
              </div>
              <div className={`w-12 h-6 rounded-full relative transition-all ${useRNPL ? 'bg-amber-400' : 'bg-slate-200'}`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${useRNPL ? 'left-7' : 'left-1'}`} />
              </div>
            </div>
          </motion.div>
        )}

        <Button
          variant={useRNPL ? 'amber' : 'primary'}
          size="lg"
          fullWidth
          loading={isPending}
          onClick={() => mutate()}
          disabled={!canAfford && !useRNPL}
        >
          {useRNPL
            ? `Rent via RNPL — pay ${formatCurrency(totalCost)} later`
            : `Confirm rental — ${formatCurrency(totalCost)}`
          }
        </Button>

        {!canAfford && !useRNPL && (
          <Button variant="secondary" fullWidth onClick={() => navigate('/wallet/fund')}>
            Fund wallet first →
          </Button>
        )}
      </div>
    </div>
  )
}