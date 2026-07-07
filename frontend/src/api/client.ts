import axios from 'axios'
import type { AxiosError, AxiosInstance } from 'axios'

const BASE_URL =
  import.meta.env.VITE_API_URL ||
  'https://wakacharge.onrender.com'

class ApiClient {
  private instance: AxiosInstance

  constructor() {
    this.instance = axios.create({
      baseURL: `${BASE_URL}/api/v1`,
      timeout: 20000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        // ❌ REMOVE THIS — browser controls it, setting it throws security error:
        // 'Accept-Encoding': 'gzip, deflate, br',
        // ❌ REMOVE THIS TOO — also browser-controlled:
        // 'decompress': true,
      },
    })

    this.instance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('waka_token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    this.instance.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          const path = window.location.pathname
          const publicPaths = [
            '/',
            '/login',
            '/register',
            '/verify-otp',
            '/complete-profile',
            '/forgot-password',
            '/reset-verify-otp',
            '/reset-password',
            '/operator-login',
            '/admin-login',
            '/payment/verify',
            '/payment/callback',
          ]
          const isPublic = publicPaths.some(p => path.startsWith(p))
          if (!isPublic) {
            localStorage.removeItem('waka_token')
            localStorage.removeItem('waka_user')
            window.location.href = '/login'
          }
        }
        return Promise.reject(error)
      }
    )
  }

  get = <T>(url: string, params?: object) =>
    this.instance.get<T>(url, { params }).then(r => r.data)

  post = <T>(url: string, data?: object) =>
    this.instance.post<T>(url, data).then(r => r.data)

  put = <T>(url: string, data?: object) =>
    this.instance.put<T>(url, data).then(r => r.data)

  patch = <T>(url: string, data?: object) =>
    this.instance.patch<T>(url, data).then(r => r.data)

  delete = <T>(url: string) =>
    this.instance.delete<T>(url).then(r => r.data)
}

export const api = new ApiClient()
export default api