import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MdNotifications,
  MdNotificationsNone,
  MdCheckCircle,
  MdDoneAll,
  MdArrowForward,
  MdAccountBalanceWallet,
  MdBolt,
  MdWarning,
  MdInfo,
  MdPayment,
  MdStar,
} from 'react-icons/md'
import { notificationsApi } from '../../api/notifications.api'
import { TopBar } from '../../components/shared/TopBar'
import { Skeleton } from '../../components/ui/Card'
import { useToast } from '../../components/ui/Toast'
import { formatDateTime } from '../../utils'

// ─── Config per notification type ────────────────────────
const NOTIF_CONFIG: Record<string, {
  icon: React.ReactNode
  bg: string
  color: string
  route?: string
}> = {
  wallet_funded: {
    icon: <MdAccountBalanceWallet size={20} />,
    bg: '#f0fdf4',
    color: '#16a34a',
    route: '/wallet',
  },
  rental_started: {
    icon: <MdBolt size={20} />,
    bg: '#eff6ff',
    color: '#2563eb',
    route: '/rentals',
  },
  deposit_refunded: {
    icon: <MdPayment size={20} />,
    bg: '#f0fdf4',
    color: '#16a34a',
    route: '/transactions',
  },
  rental_overdue: {
    icon: <MdWarning size={20} />,
    bg: '#fffbeb',
    color: '#d97706',
    route: '/rentals',
  },
  payment_success: {
    icon: <MdCheckCircle size={20} />,
    bg: '#f0fdf4',
    color: '#16a34a',
    route: '/transactions',
  },
  new_rental: {
    icon: <MdBolt size={20} />,
    bg: '#eff6ff',
    color: '#2563eb',
    route: '/rentals',
  },
  device_returned: {
    icon: <MdCheckCircle size={20} />,
    bg: '#f0fdf4',
    color: '#16a34a',
    route: '/rentals',
  },
  trust_score: {
    icon: <MdStar size={20} />,
    bg: '#fffbeb',
    color: '#d97706',
    route: '/trust',
  },
  general: {
    icon: <MdInfo size={20} />,
    bg: '#f8fafc',
    color: '#64748b',
  },
}

const getConfig = (type: string) =>
  NOTIF_CONFIG[type] || NOTIF_CONFIG.general

// ─── Relative time ────────────────────────────────────────
const relativeTime = (date: string): string => {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return formatDateTime(date)
}

// ─── Main component ───────────────────────────────────────
export default function Notifications() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const qc = useQueryClient()
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  // Fetch notifications with polling
  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationsApi.getAll,
    refetchInterval: 30000,
  })

  // Mark all notifications as read mutation
  const { mutate: markAll, isPending: markingAll } = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      toast('All notifications marked as read', 'success')
    },
  })

  // Mark a single notification as read mutation with Optimistic UI updates
  const { mutate: markOne } = useMutation({
    mutationFn: (id: string) => notificationsApi.markOneRead(id),
    onMutate: async (id: string) => {
      // Cancel outgoing refetches to prevent overwriting our optimistic state
      await qc.cancelQueries({ queryKey: ['notifications'] })

      // Snapshot the previous state value
      const previous = qc.getQueryData(['notifications'])

      // Optimistically update the cache instantly
      qc.setQueryData(['notifications'], (old: any) => {
        if (!old) return old
        return {
          ...old,
          unreadCount: Math.max(0, (old.unreadCount || 0) - 1),
          notifications: old.notifications?.map((n: any) =>
            n._id === id ? { ...n, isRead: true } : n
          ),
        }
      })

      // Return context with snapshotted value
      return { previous }
    },
    onError: (_err, _id, context: any) => {
      // Roll back to the original values if request fails
      if (context?.previous) {
        qc.setQueryData(['notifications'], context.previous)
      }
    },
    onSettled: () => {
      // Sync up background cache cleanly with backend data
      qc.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const all = (data as any)?.notifications || []
  const unread = (data as any)?.unreadCount || 0

  const displayed = filter === 'unread'
    ? all.filter((n: any) => !n.isRead)
    : all

  const handleNotifClick = (n: any) => {
    if (!n.isRead) markOne(n._id)
    const cfg = getConfig(n.type)
    if (cfg.route) navigate(cfg.route)
  }

  return (
    <div className="bg-slate-50 min-h-svh">
      {/* Top bar */}
      <div className="bg-white sticky top-0 z-30 border-b border-slate-100">
        <TopBar
          title="Notifications"
          right={
            unread > 0 ? (
              <button
                onClick={() => markAll()}
                disabled={markingAll}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200 transition-colors disabled:opacity-40"
              >
                <MdDoneAll size={14} />
                Mark all read
              </button>
            ) : undefined
          }
        />

        {/* Filter tabs */}
        <div className="flex items-center gap-1 px-5 pb-3">
          <div className="flex gap-1 bg-slate-100 rounded-2xl p-1">
            {([
              { value: 'all', label: 'All' },
              {
                value: 'unread',
                label: `Unread${unread > 0 ? ` (${unread})` : ''}`
              },
            ] as const).map(tab => (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value)}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  filter === tab.value
                    ? 'bg-white text-navy-900 shadow-sm'
                    : 'text-slate-500'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-5 py-4">
        {/* Unread badge */}
        {unread > 0 && filter === 'all' && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-2xl px-4 py-3 mb-4"
          >
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
            <p className="text-green-700 text-sm font-semibold">
              {unread} unread notification{unread !== 1 ? 's' : ''}
            </p>
          </motion.div>
        )}

        {/* Loading Skeleton */}
        {isLoading && (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && displayed.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <MdNotificationsNone size={32} className="text-slate-300" />
            </div>
            <p className="font-bold text-navy-900">
              {filter === 'unread' ? 'All caught up!' : 'No notifications yet'}
            </p>
            <p className="text-slate-400 text-sm mt-1">
              {filter === 'unread'
                ? 'No unread notifications'
                : "We'll notify you about rentals, payments and trust score updates"
              }
            </p>
            {filter === 'unread' && (
              <button
                onClick={() => setFilter('all')}
                className="mt-4 text-xs font-semibold text-green-600 hover:text-green-700 transition-colors"
              >
                View all notifications →
              </button>
            )}
          </motion.div>
        )}

        {/* Notifications list */}
        {!isLoading && displayed.length > 0 && (
          <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
            <AnimatePresence>
              {displayed.map((n: any, i: number) => {
                const cfg = getConfig(n.type)
                const isLast = i === displayed.length - 1

                return (
                  <motion.div
                    key={n._id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => handleNotifClick(n)}
                    className={`
                      flex items-start gap-4 px-5 py-4
                      cursor-pointer transition-colors hover:bg-slate-50/80
                      ${!isLast ? 'border-b border-slate-50' : ''}
                      ${!n.isRead ? 'bg-green-50/30' : ''}
                    `}
                  >
                    {/* Icon */}
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: cfg.bg, color: cfg.color }}
                    >
                      {cfg.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm leading-snug ${
                          !n.isRead
                            ? 'font-bold text-navy-900'
                            : 'font-semibold text-slate-700'
                        }`}>
                          {n.title}
                        </p>
                        {/* Unread dot */}
                        {!n.isRead && (
                          <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0 mt-1.5" />
                        )}
                      </div>

                      <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                        {n.message}
                      </p>

                      <div className="flex items-center gap-2 mt-1.5">
                        <p className="text-[10px] text-slate-300 font-medium">
                          {relativeTime(n.createdAt)}
                        </p>
                        {cfg.route && (
                          <>
                            <span className="text-slate-200">·</span>
                            <p className="text-[10px] text-green-600 font-semibold flex items-center gap-0.5">
                              View
                              <MdArrowForward size={10} />
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}