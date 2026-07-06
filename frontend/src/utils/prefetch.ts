import { QueryClient } from '@tanstack/react-query'
import { paymentsApi } from '../api/payments.api'
import { rentalsApi } from '../api/rentals.api'
import { notificationsApi } from '../api/notifications.api'
import { trustApi } from '../api/trust.api'

// Call this from your QueryClientProvider context
// or pass queryClient as argument

export const prefetchCommonData = async (queryClient: QueryClient) => {
  await Promise.allSettled([
    queryClient.prefetchQuery({
      queryKey: ['wallet'],
      queryFn: paymentsApi.getWallet,
      staleTime: 1000 * 60 * 2,
    }),
    queryClient.prefetchQuery({
      queryKey: ['rentals', 'active'],
      queryFn: () => rentalsApi.getMyRentals({ status: 'active', limit: 1 }),
      staleTime: 1000 * 30,
    }),
    queryClient.prefetchQuery({
      queryKey: ['notifications'],
      queryFn: notificationsApi.getAll,
      staleTime: 1000 * 60,
    }),
  ])
}