import api from './client'

export const adminApi = {
  getDashboard: () =>
    api.get('/admin/dashboard'),

  getAnalytics: () =>
    api.get('/admin/analytics'),

  getUsers: (params?: { role?: string; campus?: string; page?: number; limit?: number }) =>
    api.get('/admin/users', params),

  deactivateUser: (id: string) =>
    api.patch(`/admin/users/${id}/deactivate`),

  activateUser: (id: string) =>
    api.patch(`/admin/users/${id}/activate`),

  createOperator: (data: {
    name: string
    email: string
    phone: string
    password: string
    campus: string
    stationId?: string
  }) => api.post('/admin/operators', data),

  getAllRentals: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get('/admin/rentals', params),

  getRevenue: (period?: string) =>
    api.get('/admin/revenue', { period }),
}