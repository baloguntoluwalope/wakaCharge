import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, UserPlus, Search, ChevronLeft,
  ChevronRight, X, Building2, Mail,
  Phone, Lock, MapPin
} from 'lucide-react'
import { adminApi } from '../../api/admin.api'
import { Skeleton } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { useToast } from '../../components/ui/Toast'
import { CAMPUSES, TRUST_LEVELS } from '../../theme/tokens'
import { formatCurrency } from '../../utils'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

const ROLES = ['', 'student', 'operator', 'admin']

// ─── Create Operator Form ────────────────────────────────
const operatorSchema = z.object({
  name: z.string().min(2, 'Name required'),
  email: z.string().email('Valid email required'),
  phone: z.string().regex(/^0[789][01]\d{8}$/, 'Valid Nigerian phone required'),
  password: z.string().min(6, 'Min 6 characters'),
  campus: z.string().min(1, 'Select campus'),
  stationId: z.string().optional(),
})

type OperatorForm = z.infer<typeof operatorSchema>

const CreateOperatorModal = ({
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

  const { register, handleSubmit, reset, formState: { errors } } = useForm<OperatorForm>({
    resolver: zodResolver(operatorSchema)
  })

  const { mutate, isPending } = useMutation({
    mutationFn: (data: OperatorForm) => adminApi.createOperator(data),
    onSuccess: () => {
      toast('Operator account created successfully', 'success')
      qc.invalidateQueries({ queryKey: ['admin-users'] })
      reset()
      onClose()
    },
    onError: (err: any) => {
      toast(err.response?.data?.message || 'Failed to create operator', 'error')
    }
  })

  const Field = ({
    label,
    icon,
    error,
    children
  }: {
    label: string
    icon: React.ReactNode
    error?: string
    children: React.ReactNode
  }) => (
    <div>
      <label className="block text-sm font-semibold text-navy-700 mb-1.5">{label}</label>
      <div className="relative">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
          {icon}
        </div>
        {children}
      </div>
      {error && <p className="text-red-500 text-xs mt-1.5 font-medium">{error}</p>}
    </div>
  )

  const inputCls = (hasError?: boolean) => `
    w-full pl-10 pr-4 py-3 rounded-xl text-sm font-medium
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
                  <h2 className="text-xl font-black text-navy-900">Create Operator</h2>
                  <p className="text-sm text-slate-400 mt-0.5">
                    Operators manage kiosk stations
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
                <Field label="Full name" icon={<Users size={16} />} error={errors.name?.message}>
                  <input
                    className={inputCls(!!errors.name)}
                    placeholder="John Operator"
                    {...register('name')}
                  />
                </Field>

                <Field label="Email address" icon={<Mail size={16} />} error={errors.email?.message}>
                  <input
                    type="email"
                    className={inputCls(!!errors.email)}
                    placeholder="operator@wakacharge.com"
                    {...register('email')}
                  />
                </Field>

                <Field label="Phone number" icon={<Phone size={16} />} error={errors.phone?.message}>
                  <input
                    className={inputCls(!!errors.phone)}
                    placeholder="08012345678"
                    {...register('phone')}
                  />
                </Field>

                <Field label="Password" icon={<Lock size={16} />} error={errors.password?.message}>
                  <input
                    type="password"
                    className={inputCls(!!errors.password)}
                    placeholder="Min 6 characters"
                    {...register('password')}
                  />
                </Field>

                <Field label="Campus" icon={<MapPin size={16} />} error={errors.campus?.message}>
                  <select className={inputCls(!!errors.campus)} {...register('campus')}>
                    <option value="">Select campus</option>
                    {CAMPUSES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </Field>

                {stations.length > 0 && (
                  <Field label="Assign to station" icon={<Building2 size={16} />}>
                    <select className={inputCls()} {...register('stationId')}>
                      <option value="">No station yet</option>
                      {stations.map((s: any) => (
                        <option key={s._id} value={s._id}>
                          {s.name} — {s.campus}
                        </option>
                      ))}
                    </select>
                  </Field>
                )}

                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mt-1">
                  <p className="text-amber-700 text-xs font-semibold leading-relaxed">
                    ⚠️ Operator accounts use email + password login — no OTP. Share credentials
                    securely with the operator after creation.
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button variant="secondary" fullWidth onClick={onClose} type="button">
                    Cancel
                  </Button>
                  <Button variant="primary" fullWidth type="submit" loading={isPending}>
                    Create operator
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
export default function AdminUsers() {
  const [role, setRole] = useState('')
  const [campus, setCampus] = useState('')
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [showCreateOperator, setShowCreateOperator] = useState(false)
  const { toast } = useToast()
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', role, campus, page],
    queryFn: () => adminApi.getUsers({
      role: role || undefined,
      campus: campus || undefined,
      page,
      limit: 20
    }),
  })

  const { data: stationsData } = useQuery({
    queryKey: ['stations-all'],
    queryFn: () => import('../../api/rentals.api').then(m => m.rentalsApi.getStations()),
  })

  const stations = (stationsData as any)?.stations || []

  const { mutate: deactivate } = useMutation({
    mutationFn: (id: string) => adminApi.deactivateUser(id),
    onSuccess: () => {
      toast('User deactivated', 'success')
      qc.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: () => toast('Failed to deactivate', 'error')
  })

  const { mutate: activate } = useMutation({
    mutationFn: (id: string) => adminApi.activateUser(id),
    onSuccess: () => {
      toast('User reactivated', 'success')
      qc.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: () => toast('Failed to activate', 'error')
  })

  const users = (data as any)?.users || []
  const total = (data as any)?.total || 0

  const filtered = search
    ? users.filter((u: any) =>
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
      )
    : users

  return (
    <div className="p-6 max-w-6xl">
      <CreateOperatorModal
        open={showCreateOperator}
        onClose={() => setShowCreateOperator(false)}
        stations={stations}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-navy-900">Users</h1>
          <p className="text-slate-400 text-sm mt-0.5">{total.toLocaleString()} total accounts</p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowCreateOperator(true)}
          icon={<UserPlus size={16} />}
          className="w-auto"
        >
          Create operator
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1 min-w-48 max-w-72">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm bg-white border border-slate-200 outline-none focus:border-green-500 text-navy-900 placeholder-slate-300"
          />
        </div>

        {/* Role pills */}
        <div className="flex gap-1.5">
          {ROLES.map(r => (
            <button
              key={r}
              onClick={() => { setRole(r); setPage(1) }}
              className={`px-3 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                role === r ? 'bg-navy-900 text-white' : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-300'
              }`}
            >
              {r || 'All roles'}
            </button>
          ))}
        </div>

        {/* Campus filter */}
        <select
          value={campus}
          onChange={e => { setCampus(e.target.value); setPage(1) }}
          className="px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-600 outline-none focus:border-green-500"
        >
          <option value="">All campuses</option>
          {CAMPUSES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="👥"
          title="No users found"
          description="Try adjusting your filters"
          action={role === 'operator' ? {
            label: 'Create first operator',
            onClick: () => setShowCreateOperator(true)
          } : undefined}
        />
      ) : (
        <>
          <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden mb-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    {['User', 'Campus', 'Role', 'Wallet', 'Trust', 'Status', 'Actions'].map(h => (
                      <th key={h}
                        className="text-left text-xs font-bold uppercase tracking-widest text-slate-400 px-5 py-4 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u: any) => {
                    const trust = TRUST_LEVELS[u.trustLevel as keyof typeof TRUST_LEVELS] || TRUST_LEVELS.basic
                    const trustEmoji = (trust as { emoji?: string }).emoji || ''
                    return (
                      <tr
                        key={u._id}
                        className="border-t border-slate-50 hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-black text-sm flex-shrink-0">
                              {u.name?.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-navy-900 truncate">{u.name}</p>
                              <p className="text-xs text-slate-400 truncate">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <Badge variant="slate" size="xs">{u.campus}</Badge>
                        </td>
                        <td className="px-5 py-4">
                          <Badge
                            size="xs"
                            variant={
                              u.role === 'admin' ? 'purple'
                                : u.role === 'operator' ? 'amber'
                                : 'blue'
                            }
                          >
                            {u.role}
                          </Badge>
                        </td>
                        <td className="px-5 py-4 font-semibold text-navy-900 text-sm whitespace-nowrap">
                          {formatCurrency(u.walletBalance || 0)}
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-sm">{trustEmoji} {u.trustScore || 0}</span>
                        </td>
                        <td className="px-5 py-4">
                          <Badge variant={u.isActive ? 'green' : 'red'} size="xs" dot>
                            {u.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="px-5 py-4">
                          {u.role !== 'admin' && (
                            u.isActive ? (
                              <button
                                onClick={() => deactivate(u._id)}
                                className="text-xs font-semibold text-red-500 hover:text-red-700 transition-colors"
                              >
                                Deactivate
                              </button>
                            ) : (
                              <button
                                onClick={() => activate(u._id)}
                                className="text-xs font-semibold text-green-600 hover:text-green-800 transition-colors"
                              >
                                Activate
                              </button>
                            )
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">
              Showing {filtered.length} of {total} users
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm font-semibold text-navy-900 px-2">
                Page {page}
              </span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={users.length < 20}
                className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}