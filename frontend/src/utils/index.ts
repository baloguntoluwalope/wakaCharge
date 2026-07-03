import type { DeviceType } from '../types'

export const deviceLabel = (type: DeviceType): string => ({
  powerbank:   'Power Bank',
  studylamp:   'Study Lamp',
  survivalkit: 'Survival Kit',
  comfortkit:  'Comfort Kit',
}[type] || type)

export const deviceEmoji = (type: DeviceType): string => ({
  powerbank:   '🔋',
  studylamp:   '💡',
  survivalkit: '🎒',
  comfortkit:  '🛋️',
}[type] || '📦')

export const formatCurrency = (amount: number): string =>
  `₦${amount?.toLocaleString('en-NG') || '0'}`

export const formatDate = (date: string, short = false): string => {
  const d = new Date(date)
  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)

  if (d.toDateString() === now.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-NG', short
    ? { month: 'short', day: 'numeric' }
    : { weekday: 'short', month: 'short', day: 'numeric' }
  )
}

export const formatTime = (date: string): string =>
  new Date(date).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })

export const formatDateTime = (date: string): string =>
  new Date(date).toLocaleString('en-NG', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })

export const truncate = (str: string, n = 24): string =>
  str.length > n ? str.slice(0, n) + '…' : str

export const greeting = (): string => {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

export const maskEmail = (email: string): string => {
  const [local, domain] = email.split('@')
  return `${local.slice(0, 3)}****@${domain}`
}

export const groupByDate = <T extends { createdAt: string }>(items: T[]) => {
  return items.reduce((acc, item) => {
    const label = formatDate(item.createdAt)
    if (!acc[label]) acc[label] = []
    acc[label].push(item)
    return acc
  }, {} as Record<string, T[]>)
}