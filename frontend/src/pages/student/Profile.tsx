import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { authApi } from '../../api/auth.api'
import { TopBar } from '../../components/shared/TopBar'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { TRUST_LEVELS } from '../../theme/tokens'

export default function Profile() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try { await authApi.logout() } catch {}
    logout()
    navigate('/')
  }

  const trustConfig = TRUST_LEVELS[user?.trustLevel as keyof typeof TRUST_LEVELS] || TRUST_LEVELS.basic
  const TrustIcon = trustConfig.icon

  return (
    <div className="bg-slate-50 min-h-svh">
      <TopBar title="Profile" onBack={false} />
      <div className="px-5 py-5 flex flex-col gap-5">

        {/* Avatar */}
        <div className="bg-white rounded-3xl p-6 text-center border border-slate-100">
          <div
            className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center font-black text-3xl"
            style={{ background: 'linear-gradient(135deg, #1db954, #34d572)', color: '#0b1420' }}
          >
            {user?.name?.charAt(0)}
          </div>
          <h2 className="text-xl font-black text-navy-900">{user?.name}</h2>
          <p className="text-slate-400 text-sm mt-0.5">{user?.email}</p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <Badge variant="green">{user?.campus}</Badge>
            <Badge variant="slate" className="flex items-center gap-1"><TrustIcon className="text-sm" /> {trustConfig.label}</Badge>
          </div>
        </div>

        {/* Details */}
        <Card>
          {[
            ['Phone', user?.phone || '—'],
            ['Student ID', user?.studentId || '—'],
            ['Trust score', `${user?.trustScore || 0} pts`],
            ['RNPL status', user?.rnplEnabled ? `Active · ₦${user?.rnplLimit?.toLocaleString()} limit` : 'Not unlocked'],
            ['Member since', user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
              <p className="text-sm text-slate-400">{label}</p>
              <p className="font-semibold text-navy-900 text-sm capitalize">{value}</p>
            </div>
          ))}
        </Card>

        {/* Nav links */}
        <div className="flex flex-col gap-2">
          {[
            { icon: '⭐', label: 'Trust Score & RNPL', path: '/trust' },
            { icon: '🗺️', label: 'Roadmap & Vision', path: '/roadmap' },
            { icon: '📋', label: 'Transaction History', path: '/transactions' },
            { icon: '🔔', label: 'Notifications', path: '/notifications' },
          ].map(link => (
            <Card
              key={link.path}
              hoverable
              onClick={() => navigate(link.path)}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{link.icon}</span>
                <p className="font-semibold text-navy-900 text-sm">{link.label}</p>
              </div>
              <span className="text-slate-300">→</span>
            </Card>
          ))}
        </div>

        <Button
          variant="danger"
          size="md"
          fullWidth
          onClick={handleLogout}
        >
          Sign out
        </Button>
      </div>
    </div>
  )
}
