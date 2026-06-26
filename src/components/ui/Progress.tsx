import { cn } from '@/lib/utils'

interface ProgressProps {
  value: number // 0–100
  className?: string
  barClassName?: string
}

export function Progress({ value, className, barClassName }: ProgressProps) {
  const pct = Math.max(0, Math.min(100, value))
  return (
    <div
      className={cn('h-1.5 w-full overflow-hidden rounded-full bg-bg-subtle', className)}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn(
          'h-full rounded-full bg-accent transition-[width] duration-500 ease-out',
          barClassName,
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
