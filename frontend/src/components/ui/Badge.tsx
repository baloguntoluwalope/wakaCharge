import type { ReactNode } from 'react'

type BadgeVariant = 'green' | 'amber' | 'red' | 'blue' | 'slate' | 'purple'
type BadgeSize = 'xs' | 'sm' | 'md'

interface BadgeProps {
  variant?: BadgeVariant
  size?: BadgeSize
  dot?: boolean
  children: ReactNode
  className?: string
}

const variants: Record<BadgeVariant, string> = {
  green:  'bg-green-50 text-green-700 border-green-100',
  amber:  'bg-amber-50 text-amber-700 border-amber-100',
  red:    'bg-red-50 text-red-600 border-red-100',
  blue:   'bg-sky-50 text-sky-700 border-sky-100',
  slate:  'bg-slate-100 text-slate-600 border-slate-200',
  purple: 'bg-purple-50 text-purple-700 border-purple-100',
}

const sizes: Record<BadgeSize, string> = {
  xs: 'px-1.5 py-0.5 text-[10px] rounded-md',
  sm: 'px-2.5 py-1 text-xs rounded-xl',
  md: 'px-3 py-1.5 text-sm rounded-xl',
}

const dotColors: Record<BadgeVariant, string> = {
  green: 'bg-green-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
  blue: 'bg-sky-500',
  slate: 'bg-slate-400',
  purple: 'bg-purple-500',
}

export const Badge = ({
  variant = 'slate',
  size = 'sm',
  dot = false,
  children,
  className = ''
}: BadgeProps) => (
  <span className={`
    inline-flex items-center gap-1.5 font-semibold
    border ${variants[variant]} ${sizes[size]} ${className}
  `}>
    {dot && (
      <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />
    )}
    {children}
  </span>
)

// Status pill specifically for rental/device status
export const StatusPill = ({ status }: { status: string }) => {
  const map: Record<string, { variant: BadgeVariant; label: string }> = {
    active:    { variant: 'green', label: 'Active' },
    returned:  { variant: 'slate', label: 'Returned' },
    overdue:   { variant: 'amber', label: 'Overdue' },
    cancelled: { variant: 'slate', label: 'Cancelled' },
    available: { variant: 'green', label: 'Available' },
    rented:    { variant: 'blue',  label: 'Rented' },
    damaged:   { variant: 'red',   label: 'Damaged' },
    charging:  { variant: 'amber', label: 'Charging' },
    success:   { variant: 'green', label: 'Success' },
    pending:   { variant: 'amber', label: 'Pending' },
    failed:    { variant: 'red',   label: 'Failed' },
  }
  const { variant, label } = map[status] || { variant: 'slate', label: status }
  return <Badge variant={variant} dot>{label}</Badge>
}