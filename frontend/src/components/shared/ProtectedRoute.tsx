import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { LoadingSpinner } from '../ui/Button'

interface ProtectedRouteProps {
  children: React.ReactNode
  role?: 'student' | 'operator' | 'admin'
}

const ProtectedRoute = ({ children, role }: ProtectedRouteProps) => {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (role && user.role !== role) {
    const homeMap = { student: '/dashboard', operator: '/operator/dashboard', admin: '/admin/dashboard' }
    return <Navigate to={homeMap[user.role] || '/'} replace />
  }

  return <>{children}</>
}

export default ProtectedRoute