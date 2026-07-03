import api from './client'

export const operatorApi = {
  getDashboard: () =>
    api.get('/operator/dashboard'),

  getActiveRentals: () =>
    api.get('/operator/rentals/active'),

  confirmReturn: (rentalId: string) =>
    api.post('/operator/confirm-return', { rentalId }),

  reportDamage: (deviceId: string, damageReport: string) =>
    api.post('/operator/report-damage', { deviceId, damageReport }),

  getInventory: () =>
    api.get('/operator/inventory'),

  clockIn: () =>
    api.post('/operator/shift/clock-in'),

  clockOut: (clockInTime: string) =>
    api.post('/operator/shift/clock-out', { clockInTime }),

  searchStudent: (query: string) =>
    api.get('/operator/search-student', { query }),
}