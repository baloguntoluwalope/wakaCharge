import api from './client'
import type { User } from '../types'

interface AuthResponse {
  success: boolean
  message: string
  token: string
  user: User
}

export const authApi = {
  sendOTP: (email: string) =>
    api.post('/auth/send-otp', { email }),

  verifyOTP: (email: string, otp: string) =>
    api.post('/auth/verify-otp', { email, otp }),

  resendOTP: (email: string, type: string) =>
    api.post('/auth/resend-otp', { email, type }),

  completeRegistration: (payload: {
    email: string
    phone: string
    name: string
    password: string
    campus: string
    studentId?: string
  }) => api.post<AuthResponse>('/auth/complete-registration', payload),

  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }),

  operatorLogin: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/operator/login', { email, password }),

  adminLogin: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/admin/login', { email, password }),

  getProfile: () =>
    api.get<{ success: boolean; user: User; trustProfile: unknown }>('/auth/profile'),

  updateProfile: (data: { name?: string; phone?: string; studentId?: string }) =>
    api.put('/auth/profile', data),

  logout: () =>
    api.post('/auth/logout'),

  // Add to existing authApi object:

sendResetOTP: (email: string) =>
  api.post('/auth/send-otp', { email, type: 'reset' }),

verifyResetOTP: (email: string, otp: string) =>
  api.post('/auth/verify-otp', { email, otp, type: 'reset' }),

resetPassword: (email: string, password: string) =>
  api.post('/auth/reset-password', { email, password }),
}