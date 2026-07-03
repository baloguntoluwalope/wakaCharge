import api from './client'
import type { Rental, Station, Device, StationInventory } from '../types'

export const rentalsApi = {
  getStations: (campus?: string) =>
    api.get<{ success: boolean; count: number; stations: Station[] }>(
      '/stations', campus ? { campus } : undefined
    ),

  getStation: (id: string) =>
    api.get<{ success: boolean; station: Station; inventory: StationInventory }>(
      `/stations/${id}`
    ),

  scanStation: (stationId: string) =>
    api.post<{
      success: boolean
      station: Station
      availableDevices: number
      devices: Device[]
    }>('/stations/scan', { stationId }),

  getDevicesByStation: (stationId: string) =>
    api.get<{
      success: boolean
      count: number
      devices: Device[]
      grouped: Record<string, Device[]>
    }>(`/devices/station/${stationId}`),

  startRental: (payload: {
    stationId: string
    deviceType: string
    selectedHours: number
    useRNPL?: boolean
  }) => api.post<{
    success: boolean
    rental: Rental
    locker: { assigned: string; status: string; message: string }
    walletBalance: number
  }>('/rentals', payload),

  getMyRentals: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get<{
      success: boolean
      count: number
      total: number
      rentals: Rental[]
    }>('/rentals', params),

  getRental: (id: string) =>
    api.get<{ success: boolean; rental: Rental }>(`/rentals/${id}`),

  initiateReturn: (id: string) =>
    api.post<{
      success: boolean
      message: string
      rentalId: string
      confirmationCode: string
      instructions: string[]
    }>(`/rentals/${id}/initiate-return`),

  confirmReturn: (id: string, confirmationCode: string) =>
    api.patch<{
      success: boolean
      message: string
      rental: Partial<Rental>
      walletBalance: number
      trustScore: unknown
    }>(`/rentals/${id}/confirm-return`, { confirmationCode }),

  cancelRental: (id: string) =>
    api.patch(`/rentals/${id}/cancel`),
}