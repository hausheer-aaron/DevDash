import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useUI } from '@/store/ui'
import { useAuthStore } from '@/store/auth'
import { useGlobalShortcuts } from '@/hooks/useGlobalShortcuts'
import { ConfirmProvider } from '@/components/ui/Confirm'
import { Sidebar } from './Sidebar'
import { MobileBar } from './MobileBar'
import { CommandPalette } from '@/components/command/CommandPalette'
import { ShortcutsDialog } from '@/components/command/ShortcutsDialog'
import { NewProjectModal } from '@/components/projects/NewProjectModal'

export function AppShell() {
  useGlobalShortcuts()
  const initAuth = useAuthStore((s) => s.initAuth)
  const mobileNavOpen = useUI((s) => s.mobileNavOpen)
  const setMobileNav = useUI((s) => s.setMobileNav)
  const location = useLocation()

  useEffect(() => {
    void initAuth()
  }, [initAuth])

  return (
    <ConfirmProvider>
      <div className="flex min-h-screen w-full">
        {/* Desktop sidebar */}
        <aside className="fixed inset-y-0 left-0 z-20 hidden w-[244px] border-r border-border bg-bg-subtle/60 lg:block">
          <Sidebar />
        </aside>

        {/* Mobile drawer */}
        <AnimatePresence>
          {mobileNavOpen && (
            <div className="fixed inset-0 z-40 lg:hidden">
              <motion.div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileNav(false)}
              />
              <motion.aside
                className="absolute inset-y-0 left-0 w-[270px] border-r border-border bg-bg shadow-elevated"
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', stiffness: 380, damping: 36 }}
              >
                <button
                  onClick={() => setMobileNav(false)}
                  className="absolute right-3 top-4 z-10 rounded-lg p-1.5 text-faint hover:bg-surface-hover hover:text-fg"
                  aria-label="Close menu"
                >
                  <X className="h-4 w-4" />
                </button>
                <Sidebar />
              </motion.aside>
            </div>
          )}
        </AnimatePresence>

        {/* Main column */}
        <div className="flex min-h-screen w-full flex-col lg:pl-[244px]">
          <MobileBar />
          <main className="flex-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>
        </div>

        {/* Global overlays */}
        <CommandPalette />
        <ShortcutsDialog />
        <NewProjectModal />
      </div>
    </ConfirmProvider>
  )
}
