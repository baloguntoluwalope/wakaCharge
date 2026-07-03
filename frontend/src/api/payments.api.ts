import api from './client'
import type { Transaction } from '../types'

export const paymentsApi = {
  getWallet: () =>
    api.get<{
      success: boolean
      walletBalance: number
      virtualAccount: { accountNumber: string; bankName: string; accountName: string }
    }>('/payments/wallet'),

  getVirtualAccount: () =>
    api.get('/payments/virtual-account'),

  createCheckout: (amount: number, idempotencyKey?: string) =>
    api.post<{
      success: boolean
      reference: string
      checkoutUrl: string
      amount: number
    }>('/payments/checkout', {
      amount,
      idempotencyKey: idempotencyKey || `WAKA-${Date.now()}`
    }),

  verifyPayment: (reference: string) =>
    api.get(`/payments/verify/${reference}`),

  pollStatus: (reference: string) =>
    api.get<{
      success: boolean
      reference: string
      status: 'pending' | 'success' | 'failed'
      amount: number
      walletBalance: number | null
      message: string
    }>(`/payments/status/${reference}`),

  getTransactions: (params?: {
    type?: string
    status?: string
    page?: number
    limit?: number
  }) => api.get<{
    success: boolean
    count: number
    total: number
    page: number
    transactions: Transaction[]
  }>('/payments/transactions', params),

  getReconciliation: (date?: string) =>
    api.get('/payments/reconciliation', { date }),

  getAuditLogs: (params?: {
    userId?: string
    action?: string
    status?: string
    page?: number
    limit?: number
  }) => api.get('/payments/audit-logs', params),
}