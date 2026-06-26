import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, Info, AlertTriangle, X, XCircle } from 'lucide-react'
import { cn, uid } from '@/lib/utils'

type ToastVariant = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: string
  message: string
  description?: string
  variant: ToastVariant
}

interface ToastContextValue {
  toast: (message: string, opts?: { description?: string; variant?: ToastVariant }) => void
  success: (message: string, description?: string) => void
  error: (message: string, description?: string) => void
  info: (message: string, description?: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>')
  return ctx
}

const ICONS: Record<ToastVariant, typeof Info> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
}

const ICON_COLOR: Record<ToastVariant, string> = {
  success: 'text-success',
  error: 'text-danger',
  info: 'text-info',
  warning: 'text-warning',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const push = useCallback(
    (message: string, opts?: { description?: string; variant?: ToastVariant }) => {
      const id = uid('toast')
      const t: Toast = {
        id,
        message,
        description: opts?.description,
        variant: opts?.variant ?? 'info',
      }
      setToasts((prev) => [...prev.slice(-3), t])
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), 4200),
      )
    },
    [dismiss],
  )

  const value = useMemo<ToastContextValue>(
    () => ({
      toast: push,
      success: (m, d) => push(m, { description: d, variant: 'success' }),
      error: (m, d) => push(m, { description: d, variant: 'error' }),
      info: (m, d) => push(m, { description: d, variant: 'info' }),
    }),
    [push],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[min(92vw,360px)] flex-col gap-2.5">
          <AnimatePresence initial={false}>
            {toasts.map((t) => {
              const Icon = ICONS[t.variant]
              return (
                <motion.div
                  key={t.id}
                  layout
                  initial={{ opacity: 0, y: 16, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 24, scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  className="pointer-events-auto flex items-start gap-3 rounded-xl border border-border bg-elevated/95 p-3.5 shadow-elevated backdrop-blur"
                >
                  <Icon className={cn('mt-0.5 h-[18px] w-[18px] shrink-0', ICON_COLOR[t.variant])} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-snug text-fg">{t.message}</p>
                    {t.description && (
                      <p className="mt-0.5 text-xs leading-snug text-muted">{t.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => dismiss(t.id)}
                    className="shrink-0 rounded-md p-0.5 text-faint transition hover:bg-surface-hover hover:text-fg"
                    aria-label="Dismiss"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  )
}
