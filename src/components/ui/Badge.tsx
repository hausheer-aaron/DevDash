import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode
  /** Pre-composed Tailwind classes (e.g. from STATUS_META.badge). */
  tone?: string
  dot?: string
}

/** Small pill used for statuses, priorities and counts. */
export function Badge({ children, tone, dot, className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
        tone ?? 'bg-surface text-muted ring-border',
        className,
      )}
      {...props}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', dot)} />}
      {children}
    </span>
  )
}

/** A tag chip (lowercase, monospace-ish). */
export function Tag({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md bg-bg-subtle px-1.5 py-0.5 text-[0.6875rem] font-medium text-muted ring-1 ring-inset ring-border',
        className,
      )}
    >
      {children}
    </span>
  )
}
