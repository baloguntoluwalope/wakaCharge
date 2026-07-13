import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { trustApi } from '../../api/trust.api'
import { TopBar } from '../../components/shared/TopBar'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { useToast } from '../../components/ui/Toast'
import { useAuth } from '../../context/AuthContext'
import { TRUST_LEVELS } from '../../theme/tokens'
import { formatCurrency } from '../../utils'

export default function TrustScore() {
  const { toast } = useToast()
  const qc = useQueryClient()
  const { user } = useAuth()

  const { data, isLoading } = useQuery({
    queryKey: ['trust'],
    queryFn: trustApi.getTrustScore,
  })

  const { data: leaderData } = useQuery({
    queryKey: ['leaderboard', user?.campus],
    queryFn: () => trustApi.getLeaderboard(user?.campus),
    staleTime: 1000 * 60 * 5,
    enabled: !!user?.campus,
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

  const leaders = (leaderData as any)?.leaderboard || []

  return (
    <div className="bg-slate-50 min-h-svh antialiased selection:bg-emerald-500/20">
      <TopBar title="Trust Score" onBack={false} />
      
      <div className="max-w-md mx-auto px-4 py-6 flex flex-col gap-6">

        {/* Hero Score Dashboard Card */}
        <div
          className="relative overflow-hidden rounded-[2rem] p-6 shadow-xl shadow-slate-900/10 border border-slate-800/10"
          style={{ background: 'linear-gradient(145deg, #0f172a, #1e293b)' }}
        >
          {/* Subtle background decorative glows */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative flex flex-col items-center text-center">
            <div className="mb-4 p-3 bg-white/5 rounded-2xl border border-white/10 shadow-inner backdrop-blur-md">
              <levelConfig.icon className="text-4xl text-emerald-400" />
            </div>
            
            {isLoading ? (
              <div className="h-16 w-32 mx-auto bg-white/10 rounded-2xl animate-pulse mb-2" />
            ) : (
              <h1 className="text-6xl font-extrabold tracking-tight text-white mb-1">
                {profile?.trustScore || 0}
              </h1>
            )}
            
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-4">Trust Points</p>
            
            <Badge
              variant="green"
              size="md"
              className="inline-flex mx-auto bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 font-semibold rounded-full text-xs shadow-sm"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
              {levelConfig.label} Tier
            </Badge>

            {/* Next Milestone Progress */}
            {nextLevel && profile && (
              <div className="w-full mt-6 pt-5 border-t border-white/5">
                <div className="flex items-center justify-between text-xs font-medium text-slate-400 mb-2">
                  <span>{levelConfig.label}</span>
                  <span className="text-white">{(nextLevel as any).label} — {(nextLevel as any).threshold} pts</span>
                </div>
                
                <div className="h-2 bg-white/10 rounded-full overflow-hidden p-[2px]">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, progress)}%` }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                  />
                </div>
                
                <p className="text-emerald-400 font-medium text-xs mt-2.5">
                  {Math.max(0, (nextLevel as any).threshold - (profile?.trustScore || 0))} more returns to unlock {(nextLevel as any).label}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Rent Now, Pay Later Feature Premium Section */}
        <Card className={`relative overflow-hidden transition-all duration-300 rounded-3xl border ${
          profile?.rnplEnabled
            ? 'border-indigo-100 bg-gradient-to-br from-indigo-50/40 via-white to-white shadow-md'
            : 'border-slate-200 bg-white shadow-sm'
        }`}>
          <div className="p-5">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-500/80 mb-1">
                  Rent Now, Pay Later
                </p>
                <h3 className="font-bold text-slate-900 text-lg flex items-center gap-1.5">
                  {profile?.rnplEnabled ? (
                    <>
                      <span className="text-emerald-500 text-sm">●</span> Active
                    </>
                  ) : (
                    <>
                      <span className="text-slate-300 text-sm">🔒</span> Lock at 10 returns
                    </>
                  )}
                </h3>
              </div>
              <div className="text-right">
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Limit</p>
                <p className="font-extrabold text-2xl text-slate-900 tracking-tight">
                  {formatCurrency(profile?.rnplLimit || 0)}
                </p>
              </div>
            </div>

            {profile?.rnplOutstanding > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-100 bg-amber-50/50 -mx-5 -mb-5 p-5 rounded-b-3xl">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wider mb-0.5">Outstanding</p>
                    <p className="font-extrabold text-2xl text-amber-600 tracking-tight">
                      {formatCurrency(profile.rnplOutstanding)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500 font-medium">
                      Due: {new Date(profile.rnplDueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <Button
                  variant="amber"
                  fullWidth
                  loading={paying}
                  onClick={() => payRNPL()}
                  className="shadow-sm shadow-amber-500/10 hover:shadow-md transition-all font-semibold rounded-xl text-sm h-11"
                >
                  Clear Outstanding Balance
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Twin Stats Quick-Glance Grids */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 text-center rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow">
            <span className="text-2xl block mb-1">p</span>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{profile?.totalSuccessfulRentals || 0}</p>
            <p className="text-xs font-medium text-slate-400 mt-1">Successful Returns</p>
          </Card>
          <Card className="p-4 text-center rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow">
            <span className="text-2xl block mb-1">⚠️</span>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{profile?.totalLateReturns || 0}</p>
            <p className="text-xs font-medium text-slate-400 mt-1">Late Returns</p>
          </Card>
        </div>

        {/* Tier Pathways Breakdown */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3">All Milestone Tiers</p>
          <div className="flex flex-col gap-2.5">
            {Object.entries(TRUST_LEVELS).map(([key, lvl]) => {
              const isCurrent = key === levelKey;
              return (
                <Card
                  key={key}
                  className={`p-4 rounded-2xl border transition-all duration-200 bg-white ${
                    isCurrent ? 'shadow-md scale-[1.01]' : 'shadow-sm border-slate-100 opacity-75'
                  }`}
                  style={isCurrent ? { borderColor: lvl.color, borderWidth: '2px' } : {}}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center">
                        <lvl.icon className="text-xl" style={{ color: lvl.color }} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                          {lvl.label}
                          {isCurrent && <span className="text-[10px] bg-slate-100 font-medium px-2 py-0.5 rounded-full text-slate-600 border border-slate-200">Current</span>}
                        </p>
                        <p className="text-xs text-slate-400 font-medium">{lvl.threshold ? `${lvl.threshold}+ points` : 'Max tier reached'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">RNPL Limit</p>
                      <p className="font-bold text-sm mt-0.5" style={{ color: lvl.color }}>
                        {lvl.rnpl === 0 ? 'None' : formatCurrency(lvl.rnpl)}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Clean Campus Leaderboard */}
        {leaders.length > 0 && (
          <div className="mt-2">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3">
              🏆 {user?.campus} Leaderboard
            </p>
            <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden divide-y divide-slate-100">
              {leaders.map((l: any) => {
                const isTop3 = l.rank <= 3;
                return (
                  <div
                    key={l.rank}
                    className={`flex items-center gap-4 px-5 py-4 transition-colors ${
                      isTop3 ? 'bg-slate-50/40 font-medium' : ''
                    }`}
                  >
                    <span
                      className="text-base font-black w-7 text-center shrink-0"
                      style={{ color: l.rank === 1 ? '#eab308' : l.rank === 2 ? '#94a3b8' : l.rank === 3 ? '#cd7f32' : '#94a3b8' }}
                    >
                      {l.rank === 1 ? '🥇' : l.rank === 2 ? '🥈' : l.rank === 3 ? '🥉' : `${l.rank}`}
                    </span>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 text-sm truncate">{l.name}</p>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">{l.successfulRentals} successful rentals</p>
                    </div>
                    
                    <div className="text-right shrink-0">
                      <p className="font-extrabold text-slate-900 tracking-tight">{l.trustScore}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mt-0.5">
                        {TRUST_LEVELS[l.trustLevel as keyof typeof TRUST_LEVELS]?.emoji} {l.trustLevel}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}