import { create } from 'zustand'

/**
 * Ephemeral UI state (not persisted): overlays that any component can open
 * without prop-drilling — command palette, the global "new project" modal and
 * the keyboard-shortcut cheatsheet.
 */
interface UIState {
  commandOpen: boolean
  newProjectOpen: boolean
  shortcutsOpen: boolean
  /** Sidebar visibility on mobile. */
  mobileNavOpen: boolean

  openCommand: () => void
  closeCommand: () => void
  toggleCommand: () => void

  openNewProject: () => void
  closeNewProject: () => void

  toggleShortcuts: () => void
  closeShortcuts: () => void

  setMobileNav: (open: boolean) => void
}

export const useUI = create<UIState>((set) => ({
  commandOpen: false,
  newProjectOpen: false,
  shortcutsOpen: false,
  mobileNavOpen: false,

  openCommand: () => set({ commandOpen: true }),
  closeCommand: () => set({ commandOpen: false }),
  toggleCommand: () => set((s) => ({ commandOpen: !s.commandOpen })),

  openNewProject: () => set({ newProjectOpen: true }),
  closeNewProject: () => set({ newProjectOpen: false }),

  toggleShortcuts: () => set((s) => ({ shortcutsOpen: !s.shortcutsOpen })),
  closeShortcuts: () => set({ shortcutsOpen: false }),

  setMobileNav: (open) => set({ mobileNavOpen: open }),
}))
