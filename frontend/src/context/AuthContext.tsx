import {
  createContext, useContext, useState,
  useEffect, useCallback, useMemo
} from 'react'
import type { ReactNode } from 'react'
import type { User } from '../types'
import { authApi } from '../api/auth.api'

interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  login: (token: string, user: User) => void
  logout: () => void
  refreshUser: (user: User) => void
  isStudent: boolean
  isOperator: boolean
  isAdmin: boolean
  
}

const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedToken = localStorage.getItem('waka_token')
    const storedUser = localStorage.getItem('waka_user')

    if (storedToken && storedUser) {
      try {
        setToken(storedToken)
        setUser(JSON.parse(storedUser))
        
        // Note: Make sure your Axios instance registers storedToken here if needed!
        authApi.getProfile()
          .then(res => {
            setUser(res.user)
            localStorage.setItem('waka_user', JSON.stringify(res.user))
          })
          .catch(() => {
            // If the token expired or is invalid, wipe state
            logout()
          })
          .finally(() => setLoading(false))
      } catch {
        localStorage.clear()
        setLoading(false)
      }
    } else {
      setLoading(false)
    }
  }, [])

  const login = useCallback((newToken: string, newUser: User) => {
    localStorage.setItem('waka_token', newToken)
    localStorage.setItem('waka_user', JSON.stringify(newUser))
    setToken(newToken)
    setUser(newUser)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('waka_token')
    localStorage.removeItem('waka_user')
    setToken(null)
    setUser(null)
  }, [])

  const refreshUser = useCallback((updatedUser: User) => {
    setUser(updatedUser)
    localStorage.setItem('waka_user', JSON.stringify(updatedUser))
  }, [])

  // Fix 2: Memoize the context value to prevent unnecessary app re-renders
  const contextValue = useMemo(() => ({
    user,
    token,
    loading,
    login,
    logout,
    refreshUser,
    isStudent: user?.role === 'student',
    isOperator: user?.role === 'operator',
    isAdmin: user?.role === 'admin',
  }), [user, token, loading, login, logout, refreshUser])

  return (
    /* Fix 1: React 19 allows <AuthContext> instead of <AuthContext.Provider> */
    <AuthContext value={contextValue}>
      {children}
    </AuthContext>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}