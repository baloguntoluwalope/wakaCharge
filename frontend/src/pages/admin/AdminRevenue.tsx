import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, LineChart,
  CartesianGrid, AreaChart, Area
} from 'recharts'
import { adminApi } from '../../api/admin.api'
import { paymentsApi } from '../../api/payments.api'
import { Card, StatsCard, Skeleton } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { formatCurrency } from '../../utils'

const PERIODS = [
  { value: '7days', label: '7 days' },
  { value: '30days', label: '30 days' },
  { value: '90days', label: '90 days' },
]

export default function AdminRevenue() {
  const [period, setPeriod] = useState('30days')

  const { data: revData, isLoading } = useQuery({
    queryKey: ['admin-revenue', period],
    queryFn: () => adminApi.getRevenue(period),
  })

  const { data: reconcData } = useQuery({
    queryKey: ['reconciliation'],
    queryFn: () => paymentsApi.getReconciliation(),
  })

  const { data: auditData } = useQuery({
    queryKey: ['audit-logs', 'payment'],
    queryFn: () => paymentsApi.getAuditLogs({ action: 'WALLET_FUNDED', limit: 20 }),
  })

  const rev = revData as any
  const reconciliation = reconcData as any
  const auditLogs = (auditData as any)?.logs || []

  const chartData = rev?.dailyRevenue
    ? Object.entries(rev.dailyRevenue).map(([date, amount]) => ({
        date: date.slice(5),
        revenue: amount as number
      }))
    : []

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-navy-900">Revenue</h1>
          <p className="text-slate-400 text-sm mt-0.5">Payment analytics and reconciliation</p>
        </div>
        <div className="flex gap-1 bg-slate-100 rounded-2xl p-1">
          {PERIODS.map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                period === p.value ? 'bg-white text-navy-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)
        ) : (
          <>
            <StatsCard
              label="Total revenue"
              value={formatCurrency(rev?.totalRevenue || 0)}
              icon="💰"
              color="#1db954"
            />
            <StatsCard
              label="Transactions"
              value={rev?.transactions?.toLocaleString() || '0'}
              icon="📋"
              color="#0ea5e9"
            />
            <StatsCard
              label="Reconciled"
              value={reconciliation?.dailySummary?.reconciliationRate || '—'}
              icon="✅"
              color="#1db954"
            />
            <StatsCard
              label="Unreconciled"
              value={reconciliation?.unreconciled?.count || 0}
              icon="⚠️"
              color="#f59e0b"
            />
          </>
        )}
      </div>

      {/* Revenue area chart */}
      <Card className="mb-6">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">
          Revenue trend
        </p>
        <p className="text-3xl font-black text-navy-900 mb-4">
          {formatCurrency(rev?.totalRevenue || 0)}
        </p>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1db954" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#1db954" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#0b1420', border: 'none', borderRadius: 12, color: '#fff' }}
                formatter={(v: any) => [formatCurrency(v), 'Revenue']}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#1db954"
                strokeWidth={2}
                fill="url(#revGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-48 flex items-center justify-center text-slate-300">
            No revenue data for this period
          </div>
        )}
      </Card>

      {/* Reconciliation detail */}
      {reconciliation && (
        <Card className="mb-6">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
            Reconciliation — {reconciliation.dailySummary?.date}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            {[
              { label: 'Total transactions', value: reconciliation.dailySummary?.totalTransactions },
              { label: 'Expected amount', value: formatCurrency(reconciliation.dailySummary?.totalExpected || 0) },
              { label: 'Actual amount', value: formatCurrency(reconciliation.dailySummary?.totalActual || 0) },
              { label: 'Discrepancy', value: formatCurrency(reconciliation.dailySummary?.totalDiscrepancy || 0) },
              { label: 'Reconciliation rate', value: reconciliation.dailySummary?.reconciliationRate },
              { label: 'Unreconciled count', value: reconciliation.unreconciled?.count || 0 },
            ].map(s => (
              <div key={s.label} className="bg-slate-50 rounded-2xl p-3">
                <p className="text-xs text-slate-400 mb-1">{s.label}</p>
                <p className="font-black text-navy-900">{s.value ?? '—'}</p>
              </div>
            ))}
          </div>

          {reconciliation.unreconciled?.count > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <p className="text-amber-700 text-sm font-bold mb-2">
                ⚠️ {reconciliation.unreconciled.count} unreconciled transaction(s)
              </p>
              <div className="flex flex-col gap-2">
                {reconciliation.unreconciled.items?.slice(0, 3).map((item: any) => (
                  <div key={item._id} className="flex items-center justify-between text-xs text-amber-600">
                    <span>{item.reference}</span>
                    <span>
                      Expected {formatCurrency(item.expectedAmount)} · Got {formatCurrency(item.actualAmount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Payment audit log */}
      <Card>
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
          Payment audit trail
        </p>
        {auditLogs.length === 0 ? (
          <p className="text-slate-300 text-sm text-center py-4">No payment logs yet</p>
        ) : (
          <div className="flex flex-col gap-2">
            {auditLogs.map((log: any) => (
              <div
                key={log._id}
                className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-green-100 flex items-center justify-center text-sm">
                    💰
                  </div>
                  <div>
                    <p className="font-semibold text-navy-900 text-sm">{log.action}</p>
                    <p className="text-xs text-slate-400">
                      {log.userId?.name || 'System'} ·{' '}
                      {new Date(log.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {log.newState?.walletBalance && (
                    <p className="font-bold text-green-600 text-sm">
                      {formatCurrency(log.newState.walletBalance)}
                    </p>
                  )}
                  <Badge
                    variant={log.status === 'success' ? 'green' : 'red'}
                    size="xs"
                  >
                    {log.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}