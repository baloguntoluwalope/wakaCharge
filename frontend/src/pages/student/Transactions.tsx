import { useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { FaClipboardList } from 'react-icons/fa6'
import { paymentsApi } from '../../api/payments.api'
import { TopBar } from '../../components/shared/TopBar'
import { Skeleton } from '../../components/ui/Card'
import { StatusPill } from '../../components/ui/Badge'
import { EmptyState } from '../../components/ui/EmptyState'
import { Button } from '../../components/ui/Button'
import { groupByDate, formatCurrency, formatTime } from '../../utils'
import { TRANSACTION_META } from '../../theme/tokens'
import type { Transaction } from '../../types'

const FILTERS = [
  { value: '', label: 'All' },
  { value: 'wallet_funding', label: 'Funded' },
  { value: 'rental_payment', label: 'Rentals' },
  { value: 'deposit_refund', label: 'Refunds' },
  { value: 'late_fee', label: 'Late fees' },
]

export default function Transactions() {
  const [filter, setFilter] = useState('')

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ['transactions', filter],
      queryFn: ({ pageParam = 1 }) =>
        paymentsApi.getTransactions({ type: filter || undefined, page: pageParam as number, limit: 20 }),
      getNextPageParam: (last: any, all) => {
        const total = last?.total || 0
        const loaded = all.flatMap((p: any) => p.transactions || []).length
        return loaded < total ? all.length + 1 : undefined
      },
      initialPageParam: 1,
    })

  const allTxns = data?.pages.flatMap((p: any) => p.transactions || []) as Transaction[]
  const grouped = allTxns ? groupByDate(allTxns) : {}

  return (
    <div className="bg-slate-50 min-h-svh">
      <TopBar title="Transactions" onBack={false} />

      {/* Filters */}
      <div className="bg-white px-5 py-3 border-b border-slate-100 flex gap-2 overflow-x-auto">
        {FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              filter === f.value
                ? 'bg-navy-900 text-white'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="px-5 py-4">
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16" />)}
          </div>
        ) : !allTxns?.length ? (
          <EmptyState
            icon={<FaClipboardList />}
            title="No transactions yet"
            description="Fund your wallet to get started"
          />
        ) : (
          <>
            {Object.entries(grouped).map(([date, items]) => (
              <div key={date} className="mb-6">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
                  {date}
                </p>
                <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
                  {(items as Transaction[]).map((tx, i) => {
                    const meta = TRANSACTION_META[tx.type] || {
                      label: tx.type, icon: FaClipboardList, isCredit: false
                    }
                    const Icon = meta.icon
                    return (
                      <motion.div
                        key={tx._id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={`flex items-center gap-4 px-4 py-4 ${
                          i < items.length - 1 ? 'border-b border-slate-50' : ''
                        }`}
                      >
                        <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-lg flex-shrink-0">
                          <Icon className="text-slate-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-navy-900 text-sm truncate">
                            {meta.label}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-xs text-slate-400">{formatTime(tx.createdAt)}</p>
                            <StatusPill status={tx.status} />
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className={`font-black text-base ${
                            meta.isCredit ? 'text-green-600' : 'text-navy-900'
                          }`}>
                            {meta.isCredit ? '+' : '-'}{formatCurrency(tx.amount)}
                          </p>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            ))}

            {hasNextPage && (
              <Button
                variant="secondary"
                fullWidth
                loading={isFetchingNextPage}
                onClick={() => fetchNextPage()}
              >
                Load more
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  )
}