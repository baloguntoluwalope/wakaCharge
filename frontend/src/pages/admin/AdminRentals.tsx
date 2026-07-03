import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { adminApi } from '../../api/admin.api'
import { Skeleton } from '../../components/ui/Card'
import { StatusPill } from '../../components/ui/Badge'
import { EmptyState } from '../../components/ui/EmptyState'
import { Button } from '../../components/ui/Button'
import { deviceEmoji, deviceLabel, formatCurrency, formatDateTime } from '../../utils'

const STATUSES = ['', 'active', 'returned', 'overdue', 'cancelled']

export default function AdminRentals() {
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-rentals', status, page],
    queryFn: () => adminApi.getAllRentals({ status: status || undefined, page, limit: 20 }),
  })

  const rentals = (data as any)?.rentals || []
  const total = (data as any)?.total || 0

  return (
    <div className="p-6 max-w-5xl">
      <h1 className="text-2xl font-black text-navy-900 mb-6">All Rentals</h1>

      <div className="flex gap-2 mb-6 flex-wrap">
        {STATUSES.map(s => (
          <button
            key={s}
            onClick={() => { setStatus(s); setPage(1) }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all capitalize ${
              status === s ? 'bg-navy-900 text-white' : 'bg-slate-100 text-slate-500'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : rentals.length === 0 ? (
        <EmptyState icon="🔋" title="No rentals found" />
      ) : (
        <>
          <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden mb-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    {['Student', 'Device', 'Station', 'Paid', 'Status', 'Started'].map(h => (
                      <th key={h} className="text-left text-xs font-bold uppercase tracking-widest text-slate-400 px-5 py-4">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rentals.map((r: any) => (
                    <tr key={r._id} className="border-t border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-navy-900">{r.userId?.name}</p>
                        <p className="text-xs text-slate-400">{r.userId?.campus}</p>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span>{deviceEmoji(r.deviceType)}</span>
                          <span className="capitalize text-navy-700">{deviceLabel(r.deviceType)}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-500 text-xs">{r.stationId?.name}</td>
                      <td className="px-5 py-4 font-semibold text-navy-900">{formatCurrency(r.totalPaid)}</td>
                      <td className="px-5 py-4"><StatusPill status={r.status} /></td>
                      <td className="px-5 py-4 text-slate-400 text-xs whitespace-nowrap">{formatDateTime(r.startTime)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">{total} total rentals</p>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                Previous
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setPage(p => p + 1)} disabled={rentals.length < 20}>
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}