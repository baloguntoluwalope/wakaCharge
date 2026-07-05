import { Component, ErrorInfo, ReactNode } from 'react'
import { MdRefresh, MdHome, MdWifiOff, MdWarningAmber } from 'react-icons/md'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  isNetworkError: boolean
  retryCount: number
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      isNetworkError: false,
      retryCount: 0,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const isNetworkError =
      error.message?.includes('Network Error') ||
      error.message?.includes('fetch') ||
      error.message?.includes('Failed to fetch') ||
      error.message?.includes('ERR_NETWORK') ||
      error.message?.includes('timeout')

    return { hasError: true, error, isNetworkError }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('❌ ErrorBoundary caught:', error, info)
  }

  handleRetry = () => {
    this.setState(s => ({
      hasError: false,
      error: null,
      isNetworkError: false,
      retryCount: s.retryCount + 1,
    }))
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <ErrorScreen
          error={this.state.error}
          isNetworkError={this.state.isNetworkError}
          retryCount={this.state.retryCount}
          onRetry={this.handleRetry}
        />
      )
    }
    return this.props.children
  }
}

// ─── Error screen UI ──────────────────────────────────────
const ErrorScreen = ({
  error,
  isNetworkError,
  retryCount,
  onRetry,
}: {
  error: Error | null
  isNetworkError: boolean
  retryCount: number
  onRetry: () => void
}) => {
  const isServerSleep =
    isNetworkError ||
    error?.message?.includes('504') ||
    error?.message?.includes('502') ||
    error?.message?.includes('ECONNREFUSED')

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
      <div className="max-w-sm w-full">

        {/* Icon */}
        <div className="w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center"
          style={{
            background: isServerSleep ? '#fffbeb' : '#fef2f2',
            border: `1px solid ${isServerSleep ? '#fde68a' : '#fecaca'}`
          }}
        >
          {isServerSleep
            ? <MdWifiOff size={36} className="text-amber-500" />
            : <MdWarningAmber size={36} className="text-red-500" />
          }
        </div>

        {/* Message */}
        {isServerSleep ? (
          <>
            <h1 className="text-2xl font-black text-navy-900 mb-3">
              Backend waking up…
            </h1>
            <p className="text-slate-500 text-sm leading-relaxed mb-6">
              The Waka Charge server is starting up after a period of inactivity.
              This takes about 30–60 seconds on the free hosting tier.
            </p>

            {/* Animated wake-up progress */}
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-6 text-left">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <p className="text-amber-700 text-xs font-bold">Server is waking up</p>
              </div>
              <div className="h-1.5 bg-amber-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full"
                  style={{
                    width: retryCount > 0 ? '80%' : '30%',
                    transition: 'width 1s ease',
                    animation: 'pulse 2s ease-in-out infinite'
                  }}
                />
              </div>
              <p className="text-amber-600 text-xs mt-2">
                {retryCount === 0
                  ? 'Click retry in ~30 seconds'
                  : `Retry attempt ${retryCount} — try once more`
                }
              </p>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-black text-navy-900 mb-3">
              Something went wrong
            </h1>
            <p className="text-slate-500 text-sm leading-relaxed mb-6">
              An unexpected error occurred. This has been logged.
              Try refreshing the page.
            </p>

            {/* Error detail (collapsed) */}
            {error?.message && (
              <details className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-6 text-left">
                <summary className="text-xs font-bold text-slate-500 cursor-pointer select-none">
                  Technical details
                </summary>
                <p className="font-mono text-xs text-red-600 mt-2 break-all leading-relaxed">
                  {error.message}
                </p>
              </details>
            )}
          </>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            onClick={onRetry}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-green-500 text-white font-black text-sm hover:bg-green-400 transition-all"
          >
            <MdRefresh size={18} />
            {isServerSleep ? 'Retry connection' : 'Try again'}
          </button>
          <button
            onClick={() => {
              window.location.href = '/'
            }}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-all"
          >
            <MdHome size={18} />
            Go to homepage
          </button>
        </div>

        <p className="mt-8 text-slate-300 text-xs">
          ⚡ Waka Charge · If this persists, contact support
        </p>
      </div>
    </div>
  )
}

// ─── Inline error fallback for smaller components ─────────
export const InlineError = ({
  message,
  onRetry
}: {
  message?: string
  onRetry?: () => void
}) => (
  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
    <MdWarningAmber size={32} className="text-slate-300 mb-3" />
    <p className="text-sm font-semibold text-navy-800 mb-1">
      {message || 'Failed to load'}
    </p>
    <p className="text-xs text-slate-400 mb-4">
      Check your connection and try again
    </p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200 transition-colors"
      >
        <MdRefresh size={14} />
        Retry
      </button>
    )}
  </div>
)