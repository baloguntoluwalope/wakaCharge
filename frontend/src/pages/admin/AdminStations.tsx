import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPin, Plus, X, Building2, Map,
  Power, PowerOff, QrCode
} from 'lucide-react'
import { Card, Skeleton } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { useToast } from '../../components/ui/Toast'
import { CAMPUSES } from '../../theme/tokens'
import api from '../../api/client'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

// ─── API ─────────────────────────────────────────────────
const stationsAdminApi = {
  getAll: (campus?: string) =>
    api.get('/stations', campus ? { campus } : undefined),

  create: (data: any) =>
    api.post('/stations', data),

  update: (id: string, data: any) =>
    api.put(`/stations/${id}`, data),

  deactivate: (id: string) =>
    api.delete(`/stations/${id}`),
}

const stationSchema = z.object({
  name: z.string().min(2, 'Name required'),
  campus: z.string().min(1, 'Select campus'),
  location: z.string().min(3, 'Location required'),
  description: z.string().optional(),
})

type StationForm = z.infer<typeof stationSchema>

// ─── Create Station Modal ────────────────────────────────
const CreateStationModal = ({
  open,
  onClose
}: {
  open: boolean
  onClose: () => void
}) => {
  const { toast } = useToast()
  const qc = useQueryClient()

  const { register, handleSubmit, reset, formState: { errors } } = useForm<StationForm>({
    resolver: zodResolver(stationSchema)
  })

  const { mutate, isPending } = useMutation({
    mutationFn: (data: StationForm) => stationsAdminApi.create(data),
    onSuccess: () => {
      toast('Station created with QR code generated', 'success')
      qc.invalidateQueries({ queryKey: ['admin-stations'] })
      reset()
      onClose()
    },
    onError: (err: any) => {
      toast(err.response?.data?.message || 'Failed to create station', 'error')
    }
  })

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
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <div>
                  <h2 className="text-xl font-black text-navy-900">Create Station</h2>
                  <p className="text-sm text-slate-400 mt-0.5">
                    QR code is generated automatically
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
                className="p-6 flex flex-col gap-4"
              >
                <div>
                  <label className="block text-sm font-semibold text-navy-700 mb-1.5">
                    Station name
                  </label>
                  <input
                    className={inputCls(!!errors.name)}
                    placeholder="e.g. Library Block A"
                    {...register('name')}
                  />
                  {errors.name && (
                    <p className="text-red-500 text-xs mt-1 font-medium">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-navy-700 mb-1.5">
                    Campus
                  </label>
                  <select
                    className={inputCls(!!errors.campus)}
                    {...register('campus')}
                  >
                    <option value="">Select campus</option>
                    {CAMPUSES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  {errors.campus && (
                    <p className="text-red-500 text-xs mt-1 font-medium">{errors.campus.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-navy-700 mb-1.5">
                    Location description
                  </label>
                  <input
                    className={inputCls(!!errors.location)}
                    placeholder="e.g. Ground floor, near main entrance"
                    {...register('location')}
                  />
                  {errors.location && (
                    <p className="text-red-500 text-xs mt-1 font-medium">{errors.location.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-navy-700 mb-1.5">
                    Description{' '}
                    <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <textarea
                    className={`${inputCls()} resize-none`}
                    rows={3}
                    placeholder="Additional details about this station…"
                    {...register('description')}
                  />
                </div>

                <div className="bg-green-50 border border-green-100 rounded-2xl p-4">
                  <p className="text-green-700 text-xs font-semibold leading-relaxed">
                    ✅ A QR code will be generated automatically and attached to this station.
                    Print it and mount it at the kiosk location.
                  </p>
                </div>

                <div className="flex gap-3 pt-1">
                  <Button variant="secondary" fullWidth onClick={onClose} type="button">
                    Cancel
                  </Button>
                  <Button variant="primary" fullWidth type="submit" loading={isPending}>
                    Create station
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

// ─── Main Component ──────────────────────────────────────
export default function AdminStations() {
  const [campus, setCampus] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const { toast } = useToast()
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-stations', campus],
    queryFn: () => stationsAdminApi.getAll(campus || undefined),
  })

  const { mutate: deactivate } = useMutation({
    mutationFn: (id: string) => stationsAdminApi.deactivate(id),
    onSuccess: () => {
      toast('Station deactivated', 'success')
      qc.invalidateQueries({ queryKey: ['admin-stations'] })
    },
    onError: () => toast('Failed to deactivate station', 'error')
  })

  const stations = (data as any)?.stations || []

  return (
    <div className="p-6 max-w-6xl">
      <CreateStationModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-navy-900">Stations</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {stations.length} station{stations.length !== 1 ? 's' : ''} across all campuses
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowCreate(true)}
          icon={<Plus size={16} />}
          className="w-auto"
        >
          Add station
        </Button>
      </div>

      {/* Campus filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setCampus('')}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
            !campus ? 'bg-navy-900 text-white' : 'bg-white border border-slate-200 text-slate-500'
          }`}
        >
          All campuses
        </button>
        {CAMPUSES.map(c => (
          <button
            key={c}
            onClick={() => setCampus(c)}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              campus === c ? 'bg-navy-900 text-white' : 'bg-white border border-slate-200 text-slate-500'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Stations grid */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : stations.length === 0 ? (
        <EmptyState
          icon="📍"
          title="No stations yet"
          description="Add your first kiosk station to get started"
          action={{ label: 'Add station', onClick: () => setShowCreate(true) }}
        />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stations.map((s: any, i: number) => (
            <motion.div
              key={s._id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="h-full flex flex-col">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-green-100 flex items-center justify-center flex-shrink-0">
                    <MapPin size={18} className="text-green-600" />
                  </div>
                  <Badge variant={s.isActive ? 'green' : 'red'} size="xs" dot>
                    {s.isActive ? 'Active' : 'Offline'}
                  </Badge>
                </div>

                {/* Info */}
                <div className="flex-1">
                  <p className="font-black text-navy-900 text-lg mb-1">{s.name}</p>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Building2 size={12} className="text-slate-400 flex-shrink-0" />
                    <p className="text-sm font-semibold text-slate-500">{s.campus}</p>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <Map size={12} className="text-slate-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-slate-400 leading-relaxed">{s.location}</p>
                  </div>

                  {/* Operator */}
                  {s.operatorId && (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <p className="text-xs text-slate-400">Operator</p>
                      <p className="text-sm font-semibold text-navy-700 mt-0.5">{s.operatorId.name}</p>
                    </div>
                  )}
                </div>

                {/* QR + Actions */}
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                  {s.qrCodeUrl ? (
                    <a
                      href={s.qrCodeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs font-semibold text-green-600 hover:text-green-700 transition-colors"
                    >
                      <QrCode size={14} />
                      View QR code
                    </a>
                  ) : (
                    <p className="text-xs text-slate-300">No QR generated</p>
                  )}

                  {s.isActive ? (
                    <button
                      onClick={() => deactivate(s._id)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-700 transition-colors"
                    >
                      <PowerOff size={14} />
                      Deactivate
                    </button>
                  ) : (
                    <button
                      onClick={() => {/* activate */}}
                      className="flex items-center gap-1.5 text-xs font-semibold text-green-600 hover:text-green-700 transition-colors"
                    >
                      <Power size={14} />
                      Activate
                    </button>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}