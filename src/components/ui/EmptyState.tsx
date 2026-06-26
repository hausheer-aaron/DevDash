import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: ReactNode
  className?: string
  compact?: boolean
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  compact,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-border text-center',
        compact ? 'gap-3 px-6 py-10' : 'gap-4 px-6 py-16',
        className,
      )}
    >
      <div className="relative">
        <div className="absolute inset-0 -z-10 rounded-full bg-accent/10 blur-xl" />
        <div className="grid h-12 w-12 place-items-center rounded-xl border border-border bg-surface text-muted">
          <Icon className="h-6 w-6" />
        </div>
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-fg">{title}</h3>
        {description && (
          <p className="mx-auto max-w-sm text-sm text-muted">{description}</p>
        )}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  )
}
