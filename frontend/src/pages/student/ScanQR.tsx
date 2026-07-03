import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { rentalsApi } from '../../api/rentals.api'
import { TopBar } from '../../components/shared/TopBar'
import { Button } from '../../components/ui/Button'

export default function ScanQR() {
  const [scanning, setScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const navigate = useNavigate()

  const { data } = useQuery({
    queryKey: ['stations'],
    queryFn: () => rentalsApi.getStations(),
  })

  const stations = (data as any)?.stations || []

  const { mutate: scan } = useMutation({
    mutationFn: (stationId: string) => rentalsApi.scanStation(stationId),
    onSuccess: (res: any) => {
      navigate(`/stations/${res.station?._id || (res as any).stationId}`, {
        state: { scanned: true, station: res.station }
      })
    },
    onError: () => {
      setScanning(false)
      setScanProgress(0)
    }
  })

  const simulateScan = (stationId: string) => {
    setScanning(true)
    setScanProgress(0)
    let p = 0
    const id = setInterval(() => {
      p += 4
      setScanProgress(Math.min(100, p))
      if (p >= 100) {
        clearInterval(id)
        scan(stationId)
      }
    }, 40)
  }

  return (
    <div className="bg-slate-50 min-h-svh">
      <TopBar title="Scan QR Code" />
      <div className="px-5 py-5 flex flex-col gap-5">

        {/* Scanner viewport */}
        <div className="relative bg-navy-900 rounded-3xl overflow-hidden aspect-square max-w-sm mx-auto w-full">
          <AnimatePresence>
            {scanning ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 flex flex-col items-center justify-center"
              >
                {/* Scan line */}
                <motion.div
                  initial={{ top: '10%' }}
                  animate={{ top: '90%' }}
                  transition={{ duration: 1.5, repeat: Infinity, repeatType: 'reverse', ease: 'linear' }}
                  className="absolute left-4 right-4 h-0.5 bg-green-400"
                  style={{ boxShadow: '0 0 12px #1db954, 0 0 24px #1db954' }}
                />

                {/* Corner markers */}
                {['top-4 left-4', 'top-4 right-4', 'bottom-4 left-4', 'bottom-4 right-4'].map((pos, i) => (
                  <div key={i}
                    className={`absolute w-8 h-8 border-green-400 ${pos} ${
                      i < 2 ? 'border-t-2' : 'border-b-2'
                    } ${i % 2 === 0 ? 'border-l-2' : 'border-r-2'}`}
                  />
                ))}

                <span className="text-6xl">📷</span>
                <p className="text-green-400 font-semibold mt-4 text-sm">Scanning…</p>

                {/* Progress */}
                <div className="absolute bottom-6 left-6 right-6 h-1 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-400 transition-none rounded-full"
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 flex flex-col items-center justify-center p-8"
              >
                <div className="border-2 border-dashed border-white/20 rounded-2xl w-40 h-40 flex items-center justify-center mb-6">
                  <span className="text-5xl opacity-40">📷</span>
                </div>
                <p className="text-white/40 text-sm text-center">
                  Camera viewfinder appears here on device
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100">
          <p className="font-bold text-navy-900 mb-3">How to scan</p>
          {[
            'Walk up to any Waka Charge kiosk on campus',
            'Point your camera at the QR code on the front panel',
            'The station page opens instantly — select your device',
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3 mb-3 last:mb-0">
              <div className="w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5">
                {i + 1}
              </div>
              <p className="text-sm text-slate-600">{step}</p>
            </div>
          ))}
        </div>

        {/* Demo: pick a station */}
        {stations.length > 0 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
              Demo — tap to simulate scanning
            </p>
            <div className="flex flex-col gap-2">
              {stations.map((s: any) => (
                <Button
                  key={s._id}
                  variant="secondary"
                  fullWidth
                  onClick={() => simulateScan(s._id)}
                  disabled={scanning}
                >
                  ⚡ {s.name} — {s.location}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}