import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import ProtectedRoute from './components/shared/ProtectedRoute'
import { LoadingSpinner } from './components/ui/Button'

// Layouts
import { StudentLayout } from './layouts/StudentLayout'
import { OperatorLayout } from './layouts/OperatorLayout'
import { AdminLayout } from './layouts/AdminLayout'

// Eager loaded (critical path)
// import Story from './pages/landing/Story'
import Landing from './pages/landing/Landing'
import NotFound from './pages/NotFound'

// Add new admin page imports

import Login from './pages/auth/Login'
import EmailEntry from './pages/auth/EmailEntry'
import VerifyOTP from './pages/auth/VerifyOTP'
import CompleteProfile from './pages/auth/CompleteProfile'
import OperatorLogin from './pages/auth/OperatorLogin'
import AdminLogin from './pages/auth/AdminLogin'
import ForgetPassword from './pages/auth/ForgetPassword'
import ResetPassword from './pages/auth/ResetPassword'
import ResetVerifyOTP from './pages/auth/ResetVerifyOTP'
// Add import
import PaymentVerify from './pages/payment/PaymentVerify'


// Lazy loaded
const Dashboard = lazy(() => import('./pages/student/Dashboard'))
const Wallet = lazy(() => import('./pages/student/Wallet'))
const FundWallet = lazy(() => import('./pages/student/FundWallet'))
const Transactions = lazy(() => import('./pages/student/Transactions'))
const Stations = lazy(() => import('./pages/student/Stations'))
const ScanQR = lazy(() => import('./pages/student/ScanQR'))
const StationDetail = lazy(() => import('./pages/student/StationDetail'))
const RentDevice = lazy(() => import('./pages/student/RentDevice'))
const LockerUnlock = lazy(() => import('./pages/student/LockerUnlock'))
const Rentals = lazy(() => import('./pages/student/Rentals'))
const ActiveRental = lazy(() => import('./pages/student/ActiveRental'))
const ReturnDevice = lazy(() => import('./pages/student/ReturnDevice'))
const TrustScore = lazy(() => import('./pages/student/TrustScore'))
const Profile = lazy(() => import('./pages/student/Profile'))
const Notifications = lazy(() => import('./pages/student/Notifications'))
const Roadmap = lazy(() => import('./pages/landing/Roadmap'))

const OperatorDashboard = lazy(() => import('./pages/operator/OperatorDashboard'))

const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminRentals = lazy(() => import('./pages/admin/AdminRentals'))
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'))
const AdminRevenue = lazy(() => import('./pages/admin/AdminRevenue'))
const AdminAudit = lazy(() => import('./pages/admin/AdminAudit'))
const AdminStations = lazy(() => import('./pages/admin/AdminStations'))
const AdminDevices = lazy(() => import('./pages/admin/AdminDevices'))
const PageLoader = () => (
  <div className="flex-1 flex items-center justify-center min-h-[60vh]">
    <LoadingSpinner size="lg" />
  </div>
)

// const RootRedirect = () => {
//   const { user, loading } = useAuth()
//   if (loading) return <PageLoader />
//   if (!user) return <Navigate to="/landing" replace />
//   if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />
//   if (user.role === 'operator') return <Navigate to="/operator/dashboard" replace />
//   return <Navigate to="/dashboard" replace />
// }

const RootRedirectOrLanding = () => {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader />
  if (!user) return <Landing />
  if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />
  if (user.role === 'operator') return <Navigate to="/operator/dashboard" replace />
  return <Navigate to="/dashboard" replace />
}

const App = () => (
  <BrowserRouter>
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Root */}
        <Route path="/" element={<RootRedirectOrLanding />} />
        <Route path="/not-found" element={<NotFound />} />

        {/* Landing */}
        <Route path="/landing" element={<Landing />} />
        <Route path="/roadmap" element={<Roadmap />} />

         // Add route — public, no auth required so Nomba redirect always lands correctly
<Route path="/payment/verify" element={<PaymentVerify />} />
<Route path="/payment/callback" element={<PaymentVerify />} />
<Route path="/payment/mock" element={<PaymentVerify />} />

        {/* Auth */}
        <Route path="/register" element={<EmailEntry />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        <Route path="/complete-profile" element={<CompleteProfile />} />
        <Route path="/login" element={<Login />} />
        <Route path="/operator-login" element={<OperatorLogin />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/forgot-password" element={<ForgetPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/reset-verify-otp" element={<ResetVerifyOTP />} />

        {/* Student */}
        <Route element={<ProtectedRoute role="student"><StudentLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/wallet/fund" element={<FundWallet />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/stations" element={<Stations />} />
          <Route path="/scan" element={<ScanQR />} />
          <Route path="/stations/:id" element={<StationDetail />} />
          <Route path="/rent" element={<RentDevice />} />
          <Route path="/locker-unlock" element={<LockerUnlock />} />
          <Route path="/rentals" element={<Rentals />} />
          <Route path="/rentals/:id" element={<ActiveRental />} />
          <Route path="/return-device" element={<ReturnDevice />} />
          <Route path="/trust" element={<TrustScore />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/notifications" element={<Notifications />} />
        </Route>

        {/* Operator */}
        <Route element={<ProtectedRoute role="operator"><OperatorLayout /></ProtectedRoute>}>
          <Route path="/operator/dashboard" element={<OperatorDashboard />} />
        </Route>

        {/* Admin */}
        <Route element={<ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/rentals" element={<AdminRentals />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/revenue" element={<AdminRevenue />} />
          <Route path="/admin/audit" element={<AdminAudit />} />
          <Route path="/admin/stations" element={<AdminStations/>}/>
          <Route path="/admin/devices" element={<AdminDevices/>}/>
        </Route>
        

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  </BrowserRouter>
)

export default App
