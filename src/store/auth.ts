import { create } from 'zustand'
import {
  createSupabaseAuthService,
  type AuthMode,
  type AuthService,
} from '@/auth/authService'
import { useWorkspaceStore } from '@/store/workspace'

interface AuthState {
  mode: AuthMode
  configured: boolean
  loading: boolean
  userId: string | null
  userEmail: string | null
  notice: string | null
  error: string | null
  initAuth: () => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const authService = createSupabaseAuthService()
let unsubscribeAuth: (() => void) | null = null

export const useAuthStore = create<AuthState>()((set, get) => ({
  mode: 'local_only',
  configured: false,
  loading: false,
  userId: null,
  userEmail: null,
  notice: null,
  error: null,

  initAuth: async () => {
    set({ loading: true, error: null })
    try {
      unsubscribeAuth?.()
      unsubscribeAuth = authService.subscribe((next) => {
        set({ ...next, loading: false, error: null })
        syncWorkspaceForAuthSnapshot(next)
      })

      const snapshot = await authService.getSnapshot()
      set({ ...snapshot, loading: false, error: null })
      syncWorkspaceForAuthSnapshot(snapshot)
    } catch (error) {
      set({ loading: false, error: formatAuthError(error) })
    }
  },

  signUp: async (email, password) => {
    const { loading } = get()
    if (loading) return

    set({ loading: true, error: null, notice: null })
    try {
      const result = await authService.signUp({ email, password })
      set({ loading: false, error: null, notice: result.confirmationRequired ? 'Account created. Check your email to confirm your account before signing in.' : null })
    } catch (error) {
      set({ loading: false, error: formatAuthError(error) })
      throw error
    }
  },

  signIn: async (email, password) => {
    const { loading } = get()
    if (loading) return

    set({ loading: true, error: null, notice: null })
    try {
      await authService.signIn({ email, password })
      set({ loading: false, error: null, notice: null })
    } catch (error) {
      set({ loading: false, error: formatAuthError(error) })
      throw error
    }
  },

  signOut: async () => {
    set({ loading: true, error: null })
    try {
      await authService.signOut()
      useWorkspaceStore.getState().clearWorkspace()
      set({
        mode: useAuthStore.getState().configured ? 'signed_out' : 'local_only',
        loading: false,
        userId: null,
        userEmail: null,
        notice: null,
        error: null,
      })
    } catch (error) {
      set({ loading: false, error: formatAuthError(error) })
      throw error
    }
  },
}))

function syncWorkspaceForAuthSnapshot(snapshot: {
  mode: AuthMode
  userId: string | null
  userEmail: string | null
}) {
  if (snapshot.mode === 'signed_in' && snapshot.userId) {
    void useWorkspaceStore.getState().ensurePersonalWorkspace({
      id: snapshot.userId,
      email: snapshot.userEmail,
    })
    return
  }

  useWorkspaceStore.getState().clearWorkspace()
}

export function createAuthStoreForTest(service: AuthService) {
  return create<AuthState>()((set, get) => ({
    mode: 'local_only',
    configured: false,
    loading: false,
    userId: null,
    userEmail: null,
    notice: null,
    error: null,

    initAuth: async () => {
      set({ loading: true, error: null })
      try {
        const snapshot = await service.getSnapshot()
        set({ ...snapshot, loading: false, error: null })
      } catch (error) {
        set({ loading: false, error: formatAuthError(error) })
      }
    },

    signUp: async (email, password) => {
      const { loading } = get()
      if (loading) return

      set({ loading: true, error: null, notice: null })
      try {
        const result = await service.signUp({ email, password })
        set({
          loading: false,
          error: null,
          notice: result.confirmationRequired
            ? 'Account created. Check your email to confirm your account before signing in.'
            : null,
        })
      } catch (error) {
        set({ loading: false, error: formatAuthError(error) })
        throw error
      }
    },

    signIn: async (email, password) => {
      const { loading } = get()
      if (loading) return

      set({ loading: true, error: null, notice: null })
      try {
        await service.signIn({ email, password })
        set({ loading: false, error: null, notice: null })
      } catch (error) {
        set({ loading: false, error: formatAuthError(error) })
        throw error
      }
    },

    signOut: async () => {
      set({ loading: true, error: null })
      try {
        await service.signOut()
        set({ mode: 'signed_out', loading: false, userId: null, userEmail: null, notice: null, error: null })
      } catch (error) {
        set({ loading: false, error: formatAuthError(error) })
        throw error
      }
    },
  }))
}

function formatAuthError(error: unknown) {
  const message = error instanceof Error ? error.message : 'Authentication failed.'
  const lower = message.toLowerCase()
  if (lower.includes('invalid login credentials')) return 'Incorrect email or password.'
  if (lower.includes('email not confirmed')) return 'Check your email to confirm your account before signing in.'
  if (lower.includes('already registered') || lower.includes('already exists')) {
    return 'An account already exists for this email.'
  }
  if (lower.includes('password should be at least') || lower.includes('password is too short')) {
    return 'Password must be at least 6 characters.'
  }
  if (lower.includes('invalid email')) return 'Enter a valid email address.'
  if (lower.includes('too many requests') || lower.includes('rate limit')) {
    return 'Too many attempts. Please wait a moment and try again.'
  }
  return message
}

export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Authentication failed.'
}
