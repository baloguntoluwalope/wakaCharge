import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { trustApi } from '../../api/trust.api'
import { TopBar } from '../../components/shared/TopBar'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { useToast } from '../../components/ui/Toast'
import { TRUST_LEVELS } from '../../theme/tokens'
import { formatCurrency } from '../../utils'

export default function TrustScore() {
  const { toast } = useToast()
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['trust'],
    queryFn: trustApi.getTrustScore,
  })

  const { mutate: payRNPL, isPending: paying } = useMutation({
    mutationFn: trustApi.payRNPL,
    onSuccess: () => {
      toast('RNPL balance cleared!', 'success')
      qc.invalidateQueries({ queryKey: ['trust'] })
      qc.invalidateQueries({ queryKey: ['wallet'] })
    },
    onError: (err: any) => {
      toast(err.response?.data?.message || 'Could not pay balance', 'error')
    }
  })

  const profile = (data as any)?.trustProfile
  const levelKey = profile?.trustLevel || 'basic'
  const levelConfig = TRUST_LEVELS[levelKey as keyof typeof TRUST_LEVELS]
  const nextLevel = Object.values(TRUST_LEVELS).find(l => l.threshold !== null && l.threshold > (profile?.trustScore || 0))
  const progress = nextLevel && levelConfig.threshold !== null && nextLevel.threshold !== null
    ? ((profile?.trustScore - levelConfig.threshold) / (nextLevel.threshold - levelConfig.threshold)) * 100
    : 100

  return (
    <div className="bg-slate-50 min-h-svh">
      <TopBar title="Trust Score" onBack={false} />
      <div className="px-5 py-5 flex flex-col gap-5">

        {/* Score hero */}
        <div
          className="rounded-3xl p-6 text-center"
          style={{ background: 'linear-gradient(135deg, #0b1420, #1a2f45)' }}
        >
          <div className="mb-3 flex justify-center">
            <levelConfig.icon className="text-5xl text-green-400" />
          </div>
          {isLoading ? (
            <div className="h-16 w-24 mx-auto bg-white/10 rounded-2xl animate-pulse mb-2" />
          ) : (
            <p className="text-6xl font-black text-white mb-1">{profile?.trustScore || 0}</p>
          )}
          <p className="text-white/50 text-sm mb-4">trust points</p>
          <Badge
            variant="green"
            size="md"
            className="inline-flex mx-auto"
          >
            {levelConfig.label} tier
          </Badge>

          {/* Progress */}
          {nextLevel && profile && (
            <div className="mt-6">
              <div className="flex items-center justify-between text-xs text-white/40 mb-2">
                <span>{levelConfig.label}</span>
                <span>{(nextLevel as any).label} — {(nextLevel as any).threshold} pts</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, progress)}%` }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                  className="h-full bg-green-400 rounded-full"
                />
              </div>
              <p className="text-green-400 text-xs mt-2">
                {Math.max(0, (nextLevel as any).threshold - (profile?.trustScore || 0))} more returns to {(nextLevel as any).label}
              </p>
            </div>
          )}
        </div>

        {/* RNPL status */}
        <Card className={
          profile?.rnplEnabled
            ? 'border-2 border-amber-300 bg-amber-50'
            : ''
        }>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">
                Rent Now, Pay Later
              </p>
              <p className="font-bold text-navy-900">
                {profile?.rnplEnabled ? '✅ Unlocked' : `🔒 Unlock at 10 returns`}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">Limit</p>
              <p className="font-black text-xl text-amber-500">
                {formatCurrency(profile?.rnplLimit || 0)}
              </p>
            </div>
          </div>

          {profile?.rnplOutstanding > 0 && (
            <div className="border-t border-amber-200 pt-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs text-amber-600 font-semibold mb-0.5">Outstanding</p>
                  <p className="font-black text-2xl text-amber-600">
                    {formatCurrency(profile.rnplOutstanding)}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Due: {new Date(profile.rnplDueDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <Button
                variant="amber"
                fullWidth
                loading={paying}
                onClick={() => payRNPL()}
              >
                Pay {formatCurrency(profile.rnplOutstanding)} from wallet
              </Button>
            </div>
          )}
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="text-center">
            <span className="text-3xl block mb-2">✅</span>
            <p className="text-3xl font-black text-navy-900">{profile?.totalSuccessfulRentals || 0}</p>
            <p className="text-xs text-slate-400 mt-1">Successful returns</p>
          </Card>
          <Card className="text-center">
            <span className="text-3xl block mb-2">⚠️</span>
            <p className="text-3xl font-black text-navy-900">{profile?.totalLateReturns || 0}</p>
            <p className="text-xs text-slate-400 mt-1">Late returns</p>
          </Card>
        </div>

        {/* All levels */}
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">All tiers</p>
        <div className="flex flex-col gap-2">
          {Object.entries(TRUST_LEVELS).map(([key, lvl]) => (
            <Card
              key={key}
              className={key === levelKey ? 'border-2' : ''}
              style={key === levelKey ? { borderColor: lvl.color } : {}}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center">
                    <lvl.icon className="text-2xl" style={{ color: lvl.color }} />
                  </div>
                  <div>
                    <p className="font-bold text-navy-900">{lvl.label}</p>
                    <p className="text-xs text-slate-400">{lvl.threshold ? `${lvl.threshold}+ points` : 'Max tier'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">RNPL limit</p>
                  <p className="font-bold text-sm" style={{ color: lvl.color }}>
                    {lvl.rnpl === 0 ? 'None' : formatCurrency(lvl.rnpl)}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
