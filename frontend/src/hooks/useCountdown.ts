import { useState, useEffect } from 'react'

export const useCountdown = (targetDate: string | null) => {
  const [timeLeft, setTimeLeft] = useState('')
  const [isOverdue, setIsOverdue] = useState(false)

  useEffect(() => {
    if (!targetDate) return

    const tick = () => {
      const diff = new Date(targetDate).getTime() - Date.now()
      if (diff <= 0) {
        setIsOverdue(true)
        const over = Math.abs(diff)
        const h = Math.floor(over / 3600000)
        const m = Math.floor((over % 3600000) / 60000)
        setTimeLeft(`${h}h ${m}m overdue`)
      } else {
        setIsOverdue(false)
        const h = Math.floor(diff / 3600000)
        const m = Math.floor((diff % 3600000) / 60000)
        const s = Math.floor((diff % 60000) / 1000)
        setTimeLeft(`${h}h ${m}m ${s}s`)
      }
    }

    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [targetDate])

  return { timeLeft, isOverdue }
}