import type { ReactNode } from 'react'
import { Button } from './Button'

interface EmptyStateProps {
  icon: ReactNode
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
}

export const EmptyState = ({ icon, title, description, action }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
    <div className="mb-4 text-5xl text-slate-400">{icon}</div>
    <h3 className="text-lg font-bold text-navy-800 mb-2">{title}</h3>
    {description && <p className="text-sm text-slate-500 max-w-xs">{description}</p>}
    {action && (
      <Button
        variant="primary"
        size="sm"
        className="mt-6"
        onClick={action.onClick}
      >
        {action.label}
      </Button>
    )}
  </div>
)