import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { paymentsApi } from '../../api/payments.api'
import { Card, Skeleton } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { formatDateTime } from '../../utils'

const ACTIONS = [
  '', 'WALLET_FUNDED', 'CHECKOUT_INITIATED', 'CHECKOUT_VERIFIED',
  'WEBHOOK_RECEIVED', 'WEBHOOK_DUPLICATE', 'WEBHOOK_FAILED',
  'PAYMENT_FAILED', 'RENTAL_STARTED', 'RENTAL_RETURNED',
  'RENTAL_OVERDUE', 'RENTAL_CANCELLED', 'DEPOSIT_REFUNDED',
  'LATE_FEE_CHARGED', 'TRUST_SCORE_INCREASED', 'TRUST_SCORE_DECREASED',
  'RNPL_UNLOCKED', 'USER_LOGIN', 'OTP_SENT', 'OTP_VERIFIED',
]

const STATUS_OPTIONS = ['', 'success', 'failed', 'warning']

export default function AdminAudit() {
  const [action, setAction] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs-full', action, status, page],
    queryFn: () => paymentsApi.getAuditLogs({
      action: action || undefined,
      status: status || undefined,
      page,
      limit: 30,
    }),
  })

  const logs = (data as any)?.logs || []
  const total = (data as any)?.total || 0

  const statusVariant = (s: string) => {
    if (s === 'success') return 'green'
    if (s === 'failed') return 'red'
    return 'amber'
  }

  const actionCategory = (a: string): string => {
    if (a.includes('WALLET') || a.includes('PAYMENT') || a.includes('CHECKOUT') || a.includes('WEBHOOK')) return 'payment'
    if (a.includes('RENTAL') || a.includes('DEPOSIT')) return 'rental'
    if (a.includes('TRUST') || a.includes('RNPL')) return 'trust'
    if (a.includes('USER') || a.includes('OTP')) return 'auth'
    return 'other'
  }

  const categoryColor = (cat: string): string => ({
    payment: 'text-green-600',
    rental: 'text-blue-600',
    trust: 'text-amber-600',
    auth: 'text-purple-600',
    other: 'text-slate-500',
  }[cat] || 'text-slate-500')

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-navy-900">Audit Log</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Immutable trail of all platform actions — {total.toLocaleString()} total
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={action}
          onChange={e => { setAction(e.target.value); setPage(1) }}
          className="px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-600 outline-none"
        >
          <option value="">All actions</option>
          {ACTIONS.filter(Boolean).map(a => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>

        <div className="flex gap-2">
          {STATUS_OPTIONS.map(s => (
            <button
              key={s}
              onClick={() => { setStatus(s); setPage(1) }}
              className={`px-3 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                status === s ? 'bg-navy-900 text-white' : 'bg-white border border-slate-200 text-slate-500'
              }`}
            >
              {s || 'All status'}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16" />)}
        </div>
      ) : logs.length === 0 ? (
        <EmptyState icon="📋" title="No audit logs found" />
      ) : (
        <>
          <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden mb-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    {['Action', 'User', 'Resource', 'Before → After', 'Status', 'IP', 'Time'].map(h => (
                      <th key={h}
                        className="text-left text-xs font-bold uppercase tracking-widest text-slate-400 px-4 py-4">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log: any) => {
                    const cat = actionCategory(log.action)
                    return (
                      <tr key={log._id} className="border-t border-slate-50 hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <p className={`font-bold text-xs ${categoryColor(cat)}`}>
                            {log.action}
                          </p>
                          <p className="text-[10px] text-slate-300 mt-0.5 capitalize">{cat}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-navy-900 text-xs">
                            {log.userId?.name || 'System'}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {log.userId?.role || 'system'}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-400">
                          {log.resourceType || '—'}
                        </td>
                        <td className="px-4 py-3">
                          {log.previousState?.walletBalance !== undefined && (
                            <p className="text-xs text-slate-500">
                              ₦{log.previousState.walletBalance?.toLocaleString()}
                              <span className="text-slate-300 mx-1">→</span>
                              <span className="text-green-600 font-semibold">
                                ₦{log.newState?.walletBalance?.toLocaleString()}
                              </span>
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={statusVariant(log.status) as any} size="xs">
                            {log.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-[10px] text-slate-300 font-mono">
                          {log.ipAddress || '—'}
                        </td>
                        <td className="px-4 py-3 text-[10px] text-slate-400 whitespace-nowrap">
                          {formatDateTime(log.createdAt)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">Page {page}</p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage(p => p + 1)}
                disabled={logs.length < 30}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}