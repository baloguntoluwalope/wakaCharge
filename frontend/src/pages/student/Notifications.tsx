import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { notificationsApi } from '../../api/notifications.api'
import { TopBar } from '../../components/shared/TopBar'
import { Skeleton } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { formatDateTime } from '../../utils'

const notifIcon: Record<string, string> = {
  wallet_funded: '💰',
  rental_started: '⚡',
  deposit_refunded: '↩️',
  rental_overdue: '⚠️',
  payment_success: '✅',
  general: '🔔',
}

export default function Notifications() {
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationsApi.getAll,
  })

  const { mutate: markAll } = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const { mutate: markOne } = useMutation({
    mutationFn: (id: string) => notificationsApi.markOneRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const notifications = (data as any)?.notifications || []
  const unread = (data as any)?.unreadCount || 0

  return (
    <div className="bg-slate-50 min-h-svh">
      <TopBar
        title="Notifications"
        right={
          unread > 0 ? (
            <button
              onClick={() => markAll()}
              className="text-xs font-semibold text-green-600"
            >
              Mark all read
            </button>
          ) : undefined
        }
      />
      <div className="px-5 py-4">
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-20" />)}
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState icon="🔔" title="No notifications yet" description="We'll notify you about rentals, payments, and trust score updates." />
        ) : (
          <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
            {notifications.map((n: any, i: number) => (
              <motion.div
                key={n._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => !n.isRead && markOne(n._id)}
                className={`flex items-start gap-4 px-5 py-4 cursor-pointer hover:bg-slate-50 transition-colors ${
                  i < notifications.length - 1 ? 'border-b border-slate-50' : ''
                } ${!n.isRead ? 'bg-green-50/50' : ''}`}
              >
                <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-xl flex-shrink-0">
                  {notifIcon[n.type] || '🔔'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm ${!n.isRead ? 'font-bold text-navy-900' : 'font-semibold text-slate-600'}`}>
                      {n.title}
                    </p>
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0 mt-1" />
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{n.message}</p>
                  <p className="text-xs text-slate-300 mt-1">{formatDateTime(n.createdAt)}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
