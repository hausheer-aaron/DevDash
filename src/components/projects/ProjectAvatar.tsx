import { ACCENT_SWATCHES, ACCENT_KEYS } from '@/lib/constants'
import { cn, colorFromString } from '@/lib/utils'

interface ProjectAvatarProps {
  name: string
  colorKey?: string
  label?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const SIZES = {
  sm: 'h-7 w-7 text-[0.625rem] rounded-lg',
  md: 'h-9 w-9 text-xs rounded-lg',
  lg: 'h-11 w-11 text-sm rounded-xl',
  xl: 'h-14 w-14 text-lg rounded-2xl',
}

/** Gradient tile showing a project's key/initials. */
export function ProjectAvatar({ name, colorKey, label, size = 'md', className }: ProjectAvatarProps) {
  const key = colorKey && ACCENT_SWATCHES[colorKey] ? colorKey : colorFromString(name, ACCENT_KEYS)
  const swatch = ACCENT_SWATCHES[key]
  const text = label ?? name.slice(0, 2).toUpperCase()
  return (
    <div
      className={cn(
        'grid shrink-0 place-items-center font-semibold text-black/80 shadow-soft ring-1 ring-inset ring-white/10',
        SIZES[size],
        className,
      )}
      style={{ backgroundImage: `linear-gradient(135deg, ${swatch.from}, ${swatch.to})` }}
      aria-hidden
    >
      {text}
    </div>
  )
}
