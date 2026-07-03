// ─── Auth ──────────────────────────────────────────
export interface User {
  _id: string
  name: string
  email: string
  phone: string
  role: 'student' | 'operator' | 'admin'
  campus: string
  studentId?: string
  walletBalance: number
  virtualAccountNumber?: string
  virtualAccountBank?: string
  trustScore: number
  trustLevel: 'basic' | 'trusted' | 'silver' | 'gold'
  rnplEnabled: boolean
  rnplLimit: number
  rnplOutstanding: number
  rnplDueDate?: string
  isActive: boolean
  isPhoneVerified: boolean
  lastLogin?: string
  createdAt: string
}

export interface AuthState {
  user: User | null
  token: string | null
  loading: boolean
}

// ─── Station ────────────────────────────────────────
export interface Station {
  _id: string
  name: string
  campus: string
  location: string
  description?: string
  qrCode?: string
  qrCodeUrl?: string
  operatorId?: { name: string; phone: string } | null
  isActive: boolean
  coordinates?: { lat: number; lng: number }
  createdAt: string
}

export interface StationInventory {
  powerbank: { total: number; available: number }
  studylamp: { total: number; available: number }
  survivalkit: { total: number; available: number }
  comfortkit: { total: number; available: number }
}

// ─── Device ─────────────────────────────────────────
export type DeviceType = 'powerbank' | 'studylamp' | 'survivalkit' | 'comfortkit'
export type DeviceStatus = 'available' | 'rented' | 'damaged' | 'charging'

export interface Device {
  _id: string
  stationId: string | Station
  deviceType: DeviceType
  deviceCode: string
  status: DeviceStatus
  rentalPrice: number
  depositAmount: number
  maxHours: number
  totalRentals: number
  condition: 'excellent' | 'good' | 'fair' | 'poor'
  notes?: string
}

// ─── Rental ─────────────────────────────────────────
export type RentalStatus = 'active' | 'returned' | 'overdue' | 'cancelled'

export interface Rental {
  _id: string
  userId: string | User
  deviceId: string | Device
  stationId: string | Station
  deviceType: DeviceType
  rentalAmount: number
  depositAmount: number
  totalPaid: number
  selectedHours: number
  startTime: string
  expectedReturnTime: string
  actualReturnTime?: string
  confirmationCode: string
  operatorConfirmed: boolean
  operatorId?: string
  lateFee: number
  depositRefunded: number
  status: RentalStatus
  lockerAssigned?: string
  lockerStatus: 'locked' | 'unlocked'
  paymentType?: 'wallet' | 'RNPL'
}

// ─── Transaction ────────────────────────────────────
export type TransactionType =
  | 'wallet_funding' | 'rental_payment' | 'deposit_hold'
  | 'deposit_refund' | 'late_fee' | 'checkout_payment'

export interface Transaction {
  _id: string
  userId: string
  rentalId?: string
  amount: number
  type: TransactionType
  status: 'pending' | 'success' | 'failed'
  reference: string
  provider: 'nomba_virtual_account' | 'nomba_checkout' | 'wallet'
  description: string
  balanceBefore: number
  balanceAfter: number
  createdAt: string
}

// ─── Notification ────────────────────────────────────
export interface Notification {
  _id: string
  userId: string
  title: string
  message: string
  type: string
  isRead: boolean
  rentalId?: string
  createdAt: string
}

// ─── Trust ──────────────────────────────────────────
export interface TrustProfile {
  trustScore: number
  trustLevel: 'basic' | 'trusted' | 'silver' | 'gold'
  totalSuccessfulRentals: number
  totalLateReturns: number
  rnplEnabled: boolean
  rnplLimit: number
  rnplOutstanding: number
  rnplDueDate?: string
  nextLevel?: { level: string; needed: number }
  badges: { isTrusted: boolean; isSilver: boolean; isGold: boolean }
}

// ─── API Response ────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean
  message?: string
  data?: T
}

export interface PaginatedResponse<T> {
  success: boolean
  count: number
  total: number
  page?: number
  data: T[]
}

// ─── Admin ──────────────────────────────────────────
export interface AdminDashboard {
  users: { total: number; students: number; operators: number }
  stations: number
  devices: { total: number; status: Array<{ _id: string; count: number }> }
  rentals: { active: number; today: number; overdue: number }
  revenue: { today: number; weekly: number; monthly: number }
  analytics: { mostRentedDevice: string; rentalsByType: Array<{ _id: string; count: number }> }
}