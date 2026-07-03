import { useState, type JSX } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from 'recharts'
import {
  HiUsers,
  HiLightningBolt,
  HiCurrencyDollar,
  HiExclamationCircle,
  HiLightBulb,
  HiShoppingBag,
  HiCollection,
  HiArchive,
  HiChip
} from 'react-icons/hi'
import { adminApi } from '../../api/admin.api'
import { paymentsApi } from '../../api/payments.api'
import { StatsCard, Card, Skeleton } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { formatCurrency } from '../../utils'
import type { AdminDashboard as AdminDashboardType } from '../../types'

export default function AdminDashboard() {
  const [revPeriod, setRevPeriod] = useState('7days')

  const { data: dashData, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: adminApi.getDashboard,
  })

  const { data: revData } = useQuery({
    queryKey: ['admin-revenue', revPeriod],
    queryFn: () => adminApi.getRevenue(revPeriod),
  })

  const { data: analyticsData } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: adminApi.getAnalytics,
  })

  const { data: reconcData } = useQuery({
    queryKey: ['reconciliation'],
    queryFn: () => paymentsApi.getReconciliation(),
  })

  const { data: auditData } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => paymentsApi.getAuditLogs({ limit: 8 }),
  })

  const dash = (dashData as any)?.dashboard as AdminDashboardType
  const rev = revData as any
  const analytics = (analyticsData as any)?.analytics
  const reconciliation = reconcData as any
  const auditLogs = (auditData as any)?.logs || []

  const revenueChartData = rev?.dailyRevenue
    ? Object.entries(rev.dailyRevenue).map(([date, amount]) => ({
        date: date.slice(5),
        revenue: amount as number
      }))
    : []

  const peakData = analytics?.peakRentalHours?.map((h: any) => ({
    hour: `${h._id}:00`,
    rentals: h.count
  })) || []

  return (
    <div className="p-6 max-w-7xl">
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-green-600 mb-1">
          Admin Console
        </p>
        <h1 className="text-3xl font-black text-navy-900">Platform Overview</h1>
        <p className="text-slate-500 text-sm mt-1">
          Real-time data across all campuses
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard
            label="Total students"
            value={dash?.users?.students?.toLocaleString() || '0'}
            icon={<HiUsers size={22} />}
            color="#1db954"
          />
          <StatsCard
            label="Active rentals"
            value={dash?.rentals?.active?.toLocaleString() || '0'}
            icon={<HiLightningBolt size={22} />}
            color="#f59e0b"
          />
          <StatsCard
            label="Today's revenue"
            value={formatCurrency(dash?.revenue?.today || 0)}
            icon={<HiCurrencyDollar size={22} />}
            color="#1db954"
          />
          <StatsCard
            label="Overdue rentals"
            value={dash?.rentals?.overdue?.toLocaleString() || '0'}
            icon={<HiExclamationCircle size={22} />}
            color="#ef4444"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Revenue chart */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">
                Daily Revenue
              </p>
              <p className="text-2xl font-black text-navy-900">
                {formatCurrency(rev?.totalRevenue || 0)}
              </p>
            </div>
            <div className="flex gap-1">
              {['7days', '30days', '90days'].map(p => (
                <button
                  key={p}
                  onClick={() => setRevPeriod(p)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    revPeriod === p
                      ? 'bg-navy-900 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {p === '7days' ? '7d' : p === '30days' ? '30d' : '90d'}
                </button>
              ))}
            </div>
          </div>
          {revenueChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={revenueChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#0b1420', border: 'none', borderRadius: 12, color: '#fff' }}
                  formatter={(v: any) => [formatCurrency(v), 'Revenue']}
                />
                <Bar dataKey="revenue" fill="#1db954" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-300">No data yet</div>
          )}
        </Card>

        {/* Peak hours */}
        <Card>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">
            Peak Rental Hours
          </p>
          <p className="text-sm text-slate-500 mb-4">When students rent most</p>
          {peakData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={peakData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="hour" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#0b1420', border: 'none', borderRadius: 12, color: '#fff' }}
                />
                <Bar dataKey="rentals" fill="#f59e0b" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-300">No data yet</div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Device popularity */}
        <Card>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
            Device popularity
          </p>
          <div className="flex flex-col gap-3">
            {analytics?.devicePopularity?.map((d: any, i: number) => (
              <div key={d._id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-slate-300 text-xs w-4">{i + 1}</span>
                  <span className="text-green-500">{deviceIcon(d._id)}</span>
                  <p className="font-semibold text-navy-900 text-sm capitalize">{d._id}</p>
                </div>
                <div className="flex gap-1">
                  <Badge variant="green" size="xs">{d.count}</Badge>
                  <Badge variant="slate" size="xs">{formatCurrency(d.revenue || 0)}</Badge>
                </div>
              </div>
            )) || <p className="text-slate-300 text-sm">No data yet</p>}
          </div>
        </Card>

        {/* Campus performance */}
        <Card>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
            Campus performance
          </p>
          <div className="flex flex-col gap-3">
            {analytics?.campusPerformance?.map((c: any) => (
              <div key={c._id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <p className="font-bold text-navy-900 text-sm">{c._id}</p>
                <div className="flex gap-1">
                  <Badge variant="green" size="xs">{formatCurrency(c.totalRevenue || 0)}</Badge>
                  <Badge variant="slate" size="xs">{c.totalRentals} rentals</Badge>
                </div>
              </div>
            )) || <p className="text-slate-300 text-sm">No data yet</p>}
          </div>
        </Card>

        {/* Reconciliation */}
        <Card className={
          (reconciliation as any)?.unreconciled?.count > 0
            ? 'border-2 border-amber-300 bg-amber-50'
            : ''
        }>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
            Reconciliation — today
          </p>
          <div className="flex flex-col gap-3">
            {[
              { label: 'Transactions', value: (reconciliation as any)?.dailySummary?.totalTransactions },
              { label: 'Rate', value: (reconciliation as any)?.dailySummary?.reconciliationRate },
              { label: 'Unreconciled', value: (reconciliation as any)?.unreconciled?.count, warning: true },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between">
                <p className="text-sm text-slate-400">{s.label}</p>
                <p className={`font-black text-lg ${
                  s.warning && s.value > 0 ? 'text-amber-600' : 'text-navy-900'
                }`}>
                  {s.value ?? '—'}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Audit log */}
      <Card>
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
          Recent audit log
        </p>
        {auditLogs.length === 0 ? (
          <p className="text-slate-300 text-sm text-center py-4">No logs yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left">
                  {['Action', 'User', 'Resource', 'Status', 'Time'].map(h => (
                    <th key={h} className="text-xs font-bold uppercase tracking-widest text-slate-400 pb-3 pr-4">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log: any) => (
                  <tr key={log._id} className="border-t border-slate-50">
                    <td className="py-3 pr-4 font-semibold text-navy-900 text-xs">{log.action}</td>
                    <td className="py-3 pr-4 text-slate-500 text-xs">{log.userId?.name || 'System'}</td>
                    <td className="py-3 pr-4 text-slate-400 text-xs">{log.resourceType || '—'}</td>
                    <td className="py-3 pr-4">
                      <Badge
                        variant={log.status === 'success' ? 'green' : log.status === 'failed' ? 'red' : 'amber'}
                        size="xs"
                      >
                        {log.status}
                      </Badge>
                    </td>
                    <td className="py-3 text-slate-400 text-xs whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

const deviceIcon = (t: string): JSX.Element => {
  const icons: Record<string, JSX.Element> = {
    powerbank:   <HiChip size={18} />,
    studylamp:   <HiLightBulb size={18} />,
    survivalkit: <HiShoppingBag size={18} />,
    comfortkit:  <HiCollection size={18} />
  }
  return icons[t] || <HiArchive size={18} />
}