import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import jsQR from 'jsqr'
import {
  MdQrCodeScanner,
  MdFlashOn,
  MdFlashOff,
  MdCameraswitch,
  MdLocationOn,
  MdArrowForward,
  MdErrorOutline,
} from 'react-icons/md'
import { rentalsApi } from '../../api/rentals.api'
import { TopBar } from '../../components/shared/TopBar'
import { useToast } from '../../components/ui/Toast'

type ScanMode = 'camera' | 'manual' | 'scanning' | 'success' | 'error'

export default function ScanQR() {
  const navigate = useNavigate()
  const { toast } = useToast()

  const [mode, setMode] = useState<ScanMode>('camera')
  const [hasCamera, setHasCamera] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [torch, setTorch] = useState(false)
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment')
  const [scanProgress, setScanProgress] = useState(0)
  const [scannedCode, setScannedCode] = useState('')

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animFrameRef = useRef<number>(0)

  // Fetch stations for manual fallback
  const { data: stationsData } = useQuery({
    queryKey: ['stations'],
    queryFn: rentalsApi.getStations,
  })
  const stations = (stationsData as any)?.stations || []

  // Scan and navigate to station
  const { mutate: scanStation, isPending: scanning } = useMutation({
    mutationFn: (stationId: string) => rentalsApi.scanStation(stationId),
    onSuccess: (res: any) => {
      setMode('success')
      setTimeout(() => {
        navigate(`/stations/${res.station?._id}`, {
          state: { scanned: true, station: res.station },
        })
      }, 800)
    },
    onError: (err: any) => {
      setMode('error')
      setCameraError(err.response?.data?.message || 'Station not found')
      setTimeout(() => setMode('camera'), 2000)
    },
  })

  // ── Start camera ─────────────────────────────
  const startCamera = async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })

      streamRef.current = stream
      setHasCamera(true)
      setCameraError(null)

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        startQRScanning()
      }
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setCameraError('Camera permission denied. Use manual station selection below.')
      } else if (err.name === 'NotFoundError') {
        setCameraError('No camera found on this device.')
      } else {
        setCameraError('Camera unavailable. Use manual station selection below.')
      }
      setHasCamera(false)
      setMode('manual')
    }
  }

  // ── QR scanning loop using jsQR ──────────────
  const startQRScanning = () => {
    const tick = () => {
      const video = videoRef.current
      const canvas = canvasRef.current

      if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
        animFrameRef.current = requestAnimationFrame(tick)
        return
      }

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      const ctx = canvas.getContext('2d')!
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      })

      if (code?.data) {
        handleQRResult(code.data)
        return // Stop scanning
      }

      animFrameRef.current = requestAnimationFrame(tick)
    }

    animFrameRef.current = requestAnimationFrame(tick)
  }

  // ── Handle QR code result ────────────────────
  const handleQRResult = (data: string) => {
    cancelAnimationFrame(animFrameRef.current)

    let stationId = data

    if (data.includes('/stations/')) {
      stationId = data.split('/stations/')[1]?.split('?')[0]
    } else if (data.includes('stationId=')) {
      stationId = new URLSearchParams(data.split('?')[1]).get('stationId') || data
    } else if (data.includes('id=')) {
      stationId = new URLSearchParams(data.split('?')[1]).get('id') || data
    }

    setScannedCode(stationId)
    setMode('scanning')

    let p = 0
    const id = setInterval(() => {
      p += 6
      setScanProgress(Math.min(100, p))
      if (p >= 100) {
        clearInterval(id)
        scanStation(stationId)
      }
    }, 30)
  }

  // ── Manual simulate scan ─────────────────────
  const handleManualScan = (stationId: string) => {
    setMode('scanning')
    setScanProgress(0)
    let p = 0
    const id = setInterval(() => {
      p += 5
      setScanProgress(Math.min(100, p))
      if (p >= 100) {
        clearInterval(id)
        scanStation(stationId)
      }
    }, 30)
  }

  // ── Toggle torch ─────────────────────────────
  const toggleTorch = async () => {
    if (!streamRef.current) return
    const track = streamRef.current.getVideoTracks()[0]
    try {
      await (track as any).applyConstraints({
        advanced: [{ torch: !torch }],
      })
      setTorch(t => !t)
    } catch {
      toast('Torch not available on this device', 'info')
    }
  }

  // ── Switch camera ────────────────────────────
  const switchCamera = () => {
    setFacingMode(f => f === 'environment' ? 'user' : 'environment')
  }

  // ── Start camera on mount and when facingMode changes ──
  useEffect(() => {
    if (mode === 'camera' || mode === 'scanning') {
      startCamera()
    }
    return () => {
      cancelAnimationFrame(animFrameRef.current)
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [facingMode])

  useEffect(() => {
    startCamera()
    return () => {
      cancelAnimationFrame(animFrameRef.current)
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [])

  return (
    <div className="bg-slate-50 min-h-svh flex flex-col">
      <TopBar title="Scan Station QR" />

      {/* ── Camera viewport ──────────────────── */}
      <div className="relative bg-navy-950 mx-5 mt-5 rounded-3xl overflow-hidden"
        style={{ aspectRatio: '1/1', maxWidth: 480, alignSelf: 'center', width: '100%' }}
      >
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          playsInline
          muted
          autoPlay
        />

        <canvas ref={canvasRef} className="hidden" />

        <AnimatePresence mode="wait">
          {(mode === 'camera' || mode === 'scanning') && hasCamera && (
            <motion.div
              key="scanner"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
            >
              <div className="absolute inset-0"
                style={{
                  background: `
                    radial-gradient(
                      ellipse 55% 55% at 50% 50%,
                      transparent 0%,
                      rgba(0,0,0,0.55) 100%
                    )
                  `
                }}
              />

              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-52 h-52">
                  {[
                    'top-0 left-0 border-t-2 border-l-2 rounded-tl-xl',
                    'top-0 right-0 border-t-2 border-r-2 rounded-tr-xl',
                    'bottom-0 left-0 border-b-2 border-l-2 rounded-bl-xl',
                    'bottom-0 right-0 border-b-2 border-r-2 rounded-br-xl',
                  ].map((cls, i) => (
                    <div key={i} className={`absolute w-8 h-8 border-green-400 ${cls}`} />
                  ))}

                  <motion.div
                    className="absolute left-1 right-1 h-0.5 rounded-full"
                    style={{
                      background: 'linear-gradient(90deg, transparent, #1db954, transparent)',
                      boxShadow: '0 0 8px #1db954, 0 0 16px #1db954',
                    }}
                    animate={{ top: ['8%', '88%', '8%'] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                </div>
              </div>

              {mode === 'scanning' && (
                <div className="absolute bottom-6 left-6 right-6">
                  <p className="text-green-400 text-xs font-bold text-center mb-2">
                    QR code detected — connecting to station…
                  </p>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-green-400 rounded-full"
                      style={{ width: `${scanProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {mode === 'camera' && (
                <p className="absolute bottom-6 left-0 right-0 text-center text-white/50 text-xs">
                  Point at a Waka Charge QR code
                </p>
              )}
            </motion.div>
          )}

          {(mode === 'manual' || !hasCamera) && (
            <motion.div
              key="no-camera"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 flex flex-col items-center justify-center p-6"
            >
              <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-4">
                <MdQrCodeScanner size={36} className="text-white/40" />
              </div>
              <p className="text-white/60 text-sm text-center font-medium">
                {cameraError || 'Camera unavailable'}
              </p>
              <p className="text-white/30 text-xs text-center mt-1">
                Select a station manually below
              </p>
            </motion.div>
          )}

          {mode === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-navy-950"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 14 }}
                className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center mb-4"
              >
                <MdQrCodeScanner size={40} className="text-white" />
              </motion.div>
              <p className="text-green-400 font-black text-lg">Station found!</p>
              <p className="text-white/40 text-sm mt-1">Opening station…</p>
            </motion.div>
          )}

          {mode === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-navy-950"
            >
              <MdErrorOutline size={48} className="text-red-400 mb-3" />
              <p className="text-red-400 font-bold">{cameraError}</p>
              <p className="text-white/30 text-xs mt-1">Retrying camera…</p>
            </motion.div>
          )}
        </AnimatePresence>

        {hasCamera && (mode === 'camera' || mode === 'scanning') && (
          <div className="absolute top-4 right-4 flex flex-col gap-2">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={toggleTorch}
              className="w-10 h-10 rounded-2xl bg-black/40 backdrop-blur flex items-center justify-center"
            >
              {torch
                ? <MdFlashOn size={20} className="text-amber-400" />
                : <MdFlashOff size={20} className="text-white/60" />
              }
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={switchCamera}
              className="w-10 h-10 rounded-2xl bg-black/40 backdrop-blur flex items-center justify-center"
            >
              <MdCameraswitch size={20} className="text-white/60" />
            </motion.button>
          </div>
        )}
      </div>

      {/* ── Content below camera ─────────────── */}
      <div className="flex-1 px-5 py-5 flex flex-col gap-5">
        {!hasCamera && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={startCamera}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-green-500 text-white font-bold text-sm hover:bg-green-400 transition-all"
          >
            <MdQrCodeScanner size={18} />
            Enable camera
          </motion.button>
        )}

        <div className="bg-white rounded-3xl border border-slate-100 p-5">
          <p className="font-bold text-navy-900 text-sm mb-4">How to scan</p>
          <div className="flex flex-col gap-3">
            {[
              {
                n: 1,
                text: 'Walk up to any Waka Charge kiosk on your campus',
                color: '#1db954',
              },
              {
                n: 2,
                text: 'Point this camera at the QR code on the kiosk front panel',
                color: '#0ea5e9',
              },
              {
                n: 3,
                text: 'Station opens automatically — choose your device and duration',
                color: '#8b5cf6',
              },
            ].map(s => (
              <div key={s.n} className="flex items-start gap-3">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-black flex-shrink-0 mt-0.5"
                  style={{ background: s.color }}
                >
                  {s.n}
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">{s.text}</p>
              </div>
            ))}
          </div>
        </div>

        {stations.length > 0 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
              Or select a station manually
            </p>
            <div className="flex flex-col gap-2">
              {stations.map((s: any) => (
                <motion.button
                  key={s._id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleManualScan(s._id)}
                  disabled={scanning || mode === 'scanning'}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-white border border-slate-200 hover:border-green-300 hover:bg-green-50/50 transition-all disabled:opacity-40 text-left"
                >
                  <div className="w-10 h-10 rounded-2xl bg-green-100 flex items-center justify-center flex-shrink-0">
                    <MdLocationOn size={20} className="text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-navy-900 text-sm">{s.name}</p>
                    <p className="text-xs text-slate-400 truncate">{s.location}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      s.isActive ? 'bg-green-500' : 'bg-slate-300'
                    }`} />
                    <MdArrowForward size={16} className="text-slate-300" />
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}