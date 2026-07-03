import axios from 'axios'
import type { AxiosError, AxiosInstance } from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'https://wakacharge.onrender.com'

class ApiClient {
  private instance: AxiosInstance

  constructor() {
    this.instance = axios.create({
      baseURL: `${BASE_URL}/api/v1`,
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' }
    })

    this.instance.interceptors.request.use((config) => {
      const token = localStorage.getItem('waka_token')
      if (token) config.headers.Authorization = `Bearer ${token}`
      return config
    })

    this.instance.interceptors.response.use(
      (res) => res,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          const path = window.location.pathname
          if (!path.startsWith('/login') && !path.startsWith('/register') && path !== '/') {
            localStorage.removeItem('waka_token')
            localStorage.removeItem('waka_user')
            window.location.href = '/login'
          }
        }
        
        // Handle 404 errors
        if (error.response?.status === 404) {
          console.warn('Resource not found:', error.config?.url)
          error.message = 'Resource not found'
        }
        
        // Handle 5xx errors (server issues)
        if (error.response?.status && error.response.status >= 500) {
          console.error('Server error:', error.config?.url, error.response.status)
          error.message = 'Server error. Please try again later.'
        }
        
        // Handle network/timeout errors
        if (!error.response) {
          console.error('Network error or timeout')
          error.message = 'Connection failed. Please check your internet.'
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