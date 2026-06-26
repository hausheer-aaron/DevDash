import { MotionConfig } from 'framer-motion'
import type { ReactNode } from 'react'
import { useStore } from '@/store/store'

/**
 * Drives Framer Motion's reduced-motion behavior from app settings:
 * - "always" hard-disables animation when the user enables Reduce Motion.
 * - "user" otherwise defers to the OS `prefers-reduced-motion` setting.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  const reduceMotion = useStore((s) => s.settings.reduceMotion)
  return <MotionConfig reducedMotion={reduceMotion ? 'always' : 'user'}>{children}</MotionConfig>
}
