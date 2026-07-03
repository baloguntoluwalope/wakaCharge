import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Battery, Lamp, Package, Sofa,
  Plus, X, AlertTriangle, CheckCircle2
} from 'lucide-react'
import { Card, Skeleton } from '../../components/ui/Card'
import { Badge, StatusPill } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { useToast } from '../../components/ui/Toast'
import { DEVICE_CONFIG } from '../../theme/tokens'
import api from '../../api/client'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

// ─── API ─────────────────────────────────────────────────
const devicesAdminApi = {
  getAll: (params?: { stationId?: string; deviceType?: string; status?: string }) =>
    api.get('/devices', params),

  getStations: () => api.get('/stations'),

  addDevices: (data: { stationId: string; deviceType: string; quantity: number }) =>
    api.post('/devices', data),

  updateDevice: (id: string, data: any) =>
    api.put(`/devices/${id}`, data),

  deleteDevice: (id: string) =>
    api.delete(`/devices/${id}`),
}

const addDeviceSchema = z.object({
  stationId: z.string().min(1, 'Select a station'),
  deviceType: z.enum(['powerbank', 'studylamp', 'survivalkit', 'comfortkit'], {
    errorMap: () => ({ message: 'Select a device type' })
  }),
  quantity: z.coerce.number().min(1, 'Min 1').max(50, 'Max 50 at once'),
})

type AddDeviceForm = z.infer<typeof addDeviceSchema>

// ─── Add Devices Modal ───────────────────────────────────
const AddDevicesModal = ({
  open,
  onClose,
  stations
}: {
  open: boolean
  onClose: () => void
  stations: any[]
}) => {
  const { toast } = useToast()
  const qc = useQueryClient()
  const [selectedType, setSelectedType] = useState<string>('')

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<AddDeviceForm>({
    resolver: zodResolver(addDeviceSchema),
    defaultValues: { quantity: 1 }
  })

  const watchedType = watch('deviceType')

  const { mutate, isPending } = useMutation({
    mutationFn: (data: AddDeviceForm) => devicesAdminApi.addDevices(data),
    onSuccess: (res: any) => {
      toast(`${res.devices?.length || 'Multiple'} device(s) added successfully`, 'success')
      qc.invalidateQueries({ queryKey: ['admin-devices'] })
      reset()
      setSelectedType('')
      onClose()
    },
    onError: (err: any) => {
      toast(err.response?.data?.message || 'Failed to add devices', 'error')
    }
  })

  const deviceTypes = Object.entries(DEVICE_CONFIG)

  const inputCls = (hasError?: boolean) => `
    w-full px-4 py-3 rounded-xl text-sm font-medium
    border-2 outline-none transition-all
    text-navy-900 placeholder-slate-300 bg-slate-50
    ${hasError
      ? 'border-red-400 bg-red-50'
      : 'border-slate-200 focus:border-green-500 focus:bg-white'
    }
  `

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <div>
                  <h2 className="text-xl font-black text-navy-900">Add Devices</h2>
                  <p className="text-sm text-slate-400 mt-0.5">
                    Add devices to a station's inventory
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <form
                onSubmit={handleSubmit(d => mutate(d))}
                className="p-6 flex flex-col gap-5"
              >
                {/* Station select */}
                <div>
                  <label className="block text-sm font-semibold text-navy-700 mb-1.5">
                    Station
                  </label>
                  <select className={inputCls(!!errors.stationId)} {...register('stationId')}>
                    <option value="">Select station</option>
                    {stations.map(s => (
                      <option key={s._id} value={s._id}>
                        {s.name} — {s.campus}
                      </option>
                    ))}
                  </select>
                  {errors.stationId && (
                    <p className="text-red-500 text-xs mt-1 font-medium">{errors.stationId.message}</p>
                  )}
                </div>

                {/* Device type selector — visual */}
                <div>
                  <label className="block text-sm font-semibold text-navy-700 mb-2">
                    Device type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {deviceTypes.map(([type, config]) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          setSelectedType(type)
                          setValue('deviceType', type as any, { shouldValidate: true })
                        }}
                        className={`flex items-center gap-3 p-3 rounded-2xl border-2 text-left transition-all ${
                          watchedType === type
                            ? 'border-green-500 bg-green-50'
                            : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                        }`}
                      >
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: `${config.color}18`, color: config.color }}
                        >
                          {type === 'powerbank' && <Battery size={18} />}
                          {type === 'studylamp' && <Lamp size={18} />}
                          {type === 'survivalkit' && <Package size={18} />}
                          {type === 'comfortkit' && <Sofa size={18} />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-navy-900">{config.label}</p>
                          <p className="text-xs text-slate-400">₦{config.price}/rental</p>
                        </div>
                      </button>
                    ))}
                  </div>
                  {errors.deviceType && (
                    <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.deviceType.message}</p>
                  )}
                </div>

                {/* Selected device info */}
                {watchedType && DEVICE_CONFIG[watchedType as keyof typeof DEVICE_CONFIG] && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-50 rounded-2xl p-4 border border-slate-200"
                  >
                    {(() => {
                      const cfg = DEVICE_CONFIG[watchedType as keyof typeof DEVICE_CONFIG]
                      return (
                        <div className="grid grid-cols-3 gap-3 text-center">
                          {[
                            { label: 'Rental price', value: `₦${cfg.price}` },
                            { label: 'Deposit', value: `₦${cfg.deposit}` },
                            { label: 'Max hours', value: `${cfg.maxHours}h` },
                          ].map(s => (
                            <div key={s.label}>
                              <p className="text-xs text-slate-400">{s.label}</p>
                              <p className="font-black text-navy-900 text-sm mt-0.5">{s.value}</p>
                            </div>
                          ))}
                        </div>
                      )
                    })()}
                  </motion.div>
                )}

                {/* Quantity */}
                <div>
                  <label className="block text-sm font-semibold text-navy-700 mb-1.5">
                    Quantity to add
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    className={inputCls(!!errors.quantity)}
                    {...register('quantity')}
                  />
                  {errors.quantity && (
                    <p className="text-red-500 text-xs mt-1 font-medium">{errors.quantity.message}</p>
                  )}
                  <p className="text-xs text-slate-400 mt-1.5">
                    Each device gets a unique auto-generated code
                  </p>
                </div>

                <div className="flex gap-3 pt-1">
                  <Button variant="secondary" fullWidth onClick={onClose} type="button">
                    Cancel
                  </Button>
                  <Button variant="primary" fullWidth type="submit" loading={isPending}>
                    Add devices
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ─── Condition badge ─────────────────────────────────────
const ConditionBadge = ({ condition }: { condition: string }) => {
  const map: Record<string, { variant: any; label: string }> = {
    excellent: { variant: 'green', label: 'Excellent' },
    good:      { variant: 'blue',  label: 'Good' },
    fair:      { variant: 'amber', label: 'Fair' },
    poor:      { variant: 'red',   label: 'Poor' },
  }
  const cfg = map[condition] || { variant: 'slate', label: condition }
  return <Badge variant={cfg.variant} size="xs">{cfg.label}</Badge>
}

// ─── Main Component ──────────────────────────────────────
export default function AdminDevices() {
  const [stationFilter, setStationFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showAddDevices, setShowAddDevices] = useState(false)
  const { toast } = useToast()
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-devices', stationFilter, typeFilter, statusFilter],
    queryFn: () => devicesAdminApi.getAll({
      stationId: stationFilter || undefined,
      deviceType: typeFilter || undefined,
      status: statusFilter || undefined,
    }),
  })

  const { data: stationsData } = useQuery({
    queryKey: ['stations-all'],
    queryFn: () => devicesAdminApi.getStations(),
  })

  const { mutate: deleteDevice } = useMutation({
    mutationFn: (id: string) => devicesAdminApi.deleteDevice(id),
    onSuccess: () => {
      toast('Device removed', 'success')
      qc.invalidateQueries({ queryKey: ['admin-devices'] })
    },
    onError: () => toast('Failed to remove device', 'error')
  })

  const { mutate: markAvailable } = useMutation({
    mutationFn: (id: string) => devicesAdminApi.updateDevice(id, { status: 'available' }),
    onSuccess: () => {
      toast('Device marked as available', 'success')
      qc.invalidateQueries({ queryKey: ['admin-devices'] })
    },
    onError: () => toast('Failed to update device', 'error')
  })

  const devices = (data as any)?.devices || []
  const stations = (stationsData as any)?.stations || []

  const deviceIcon = (type: string) => {
    const cls = "flex-shrink-0"
    switch (type) {
      case 'powerbank':   return <Battery size={18} className={cls} />
      case 'studylamp':   return <Lamp size={18} className={cls} />
      case 'survivalkit': return <Package size={18} className={cls} />
      case 'comfortkit':  return <Sofa size={18} className={cls} />
      default:            return <Package size={18} className={cls} />
    }
  }

  return (
    <div className="p-6 max-w-6xl">
      <AddDevicesModal
        open={showAddDevices}
        onClose={() => setShowAddDevices(false)}
        stations={stations}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-navy-900">Devices</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {devices.length} device{devices.length !== 1 ? 's' : ''} in inventory
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowAddDevices(true)}
          icon={<Plus size={16} />}
          className="w-auto"
        >
          Add devices
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          {
            label: 'Available',
            count: devices.filter((d: any) => d.status === 'available').length,
            icon: <CheckCircle2 size={18} />,
            color: '#1db954',
            bg: '#f0fdf4'
          },
          {
            label: 'Rented',
            count: devices.filter((d: any) => d.status === 'rented').length,
            icon: <Battery size={18} />,
            color: '#0ea5e9',
            bg: '#f0f9ff'
          },
          {
            label: 'Damaged',
            count: devices.filter((d: any) => d.status === 'damaged').length,
            icon: <AlertTriangle size={18} />,
            color: '#ef4444',
            bg: '#fef2f2'
          },
          {
            label: 'Charging',
            count: devices.filter((d: any) => d.status === 'charging').length,
            icon: <Battery size={18} />,
            color: '#f59e0b',
            bg: '#fffbeb'
          },
        ].map(s => (
          <div
            key={s.label}
            className="rounded-2xl p-4 flex items-center gap-3"
            style={{ background: s.bg }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${s.color}20`, color: s.color }}
            >
              {s.icon}
            </div>
            <div>
              <p className="text-2xl font-black text-navy-900">{s.count}</p>
              <p className="text-xs font-semibold" style={{ color: s.color }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-5">
        <select
          value={stationFilter}
          onChange={e => setStationFilter(e.target.value)}
          className="px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-600 outline-none focus:border-green-500"
        >
          <option value="">All stations</option>
          {stations.map((s: any) => (
            <option key={s._id} value={s._id}>{s.name}</option>
          ))}
        </select>

        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-600 outline-none focus:border-green-500"
        >
          <option value="">All types</option>
          {Object.entries(DEVICE_CONFIG).map(([type, cfg]) => (
            <option key={type} value={type}>{cfg.label}</option>
          ))}
        </select>

        {['', 'available', 'rented', 'damaged', 'charging'].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
              statusFilter === s
                ? 'bg-navy-900 text-white'
                : 'bg-white border border-slate-200 text-slate-500'
            }`}
          >
            {s || 'All status'}
          </button>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : devices.length === 0 ? (
        <EmptyState
          icon="🔋"
          title="No devices found"
          description="Add devices to a station to get started"
          action={{ label: 'Add devices', onClick: () => setShowAddDevices(true) }}
        />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {['Device', 'Code', 'Station', 'Rentals', 'Condition', 'Status', 'Actions'].map(h => (
                    <th key={h}
                      className="text-left text-xs font-bold uppercase tracking-widest text-slate-400 px-5 py-4 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {devices.map((d: any) => {
                  const cfg = DEVICE_CONFIG[d.deviceType as keyof typeof DEVICE_CONFIG]
                  return (
                    <tr
                      key={d._id}
                      className="border-t border-slate-50 hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: `${cfg?.color || '#1db954'}18`, color: cfg?.color || '#1db954' }}
                          >
                            {deviceIcon(d.deviceType)}
                          </div>
                          <p className="font-semibold text-navy-900">
                            {cfg?.label || d.deviceType}
                          </p>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-lg inline-block">
                          {d.deviceCode}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm text-slate-600">
                          {(d.stationId as any)?.name || '—'}
                        </p>
                        <p className="text-xs text-slate-400">
                          {(d.stationId as any)?.campus}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-bold text-navy-900">{d.totalRentals}</p>
                      </td>
                      <td className="px-5 py-4">
                        <ConditionBadge condition={d.condition} />
                      </td>
                      <td className="px-5 py-4">
                        <StatusPill status={d.status} />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {d.status === 'damaged' && (
                            <button
                              onClick={() => markAvailable(d._id)}
                              className="text-xs font-semibold text-green-600 hover:text-green-800 transition-colors whitespace-nowrap"
                            >
                              Mark available
                            </button>
                          )}
                          <button
                            onClick={() => {
                              if (window.confirm('Remove this device? This cannot be undone.')) {
                                deleteDevice(d._id)
                              }
                            }}
                            className="text-xs font-semibold text-red-500 hover:text-red-700 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}