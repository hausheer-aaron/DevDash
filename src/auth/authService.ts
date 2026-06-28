import type { Session } from '@supabase/supabase-js'
import {
  getSupabaseClient,
  type SupabaseClientResult,
  SupabaseConfigurationError,
} from '@/lib/supabase'

export type AuthMode = 'local_only' | 'signed_out' | 'signed_in'

export interface AuthSnapshot {
  mode: AuthMode
  configured: boolean
  userId: string | null
  userEmail: string | null
}

export interface AuthCredentials {
  email: string
  password: string
}

export interface AuthActionResult {
  email: string
  confirmationRequired: boolean
}

export interface AuthService {
  getSnapshot: () => Promise<AuthSnapshot>
  signUp: (credentials: AuthCredentials) => Promise<AuthActionResult>
  signIn: (credentials: AuthCredentials) => Promise<AuthActionResult>
  signOut: () => Promise<void>
  subscribe: (onSnapshot: (snapshot: AuthSnapshot) => void) => () => void
}

const localOnlySnapshot: AuthSnapshot = {
  mode: 'local_only',
  configured: false,
  userId: null,
  userEmail: null,
}

export function createSupabaseAuthService({
  getClient = getSupabaseClient,
}: {
  getClient?: () => SupabaseClientResult
} = {}): AuthService {
  const requireClient = () => {
    const client = getClient()
    if (!client.ok) throw client.error
    return client.client
  }

  return {
    async getSnapshot() {
      const client = getClient()
      if (!client.ok) return localOnlySnapshot

      const { data, error } = await client.client.auth.getSession()
      if (error) throw error
      return snapshotFromSession(data.session)
    },

    async signUp(credentials) {
      const client = requireClient()
      const { email, password } = normalizeCredentials(credentials)
      const { data, error } = await client.auth.signUp({
        email,
        password,
      })
      if (error) throw error
      return {
        email,
        confirmationRequired: !data.session,
      }
    },

    async signIn(credentials) {
      const client = requireClient()
      const { email, password } = normalizeCredentials(credentials)
      const { error } = await client.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      return {
        email,
        confirmationRequired: false,
      }
    },

    async signOut() {
      const client = getClient()
      if (!client.ok) {
        if (client.error instanceof SupabaseConfigurationError) return
        throw client.error
      }

      const { error } = await client.client.auth.signOut()
      if (error) throw error
    },

    subscribe(onSnapshot) {
      const client = getClient()
      if (!client.ok) {
        onSnapshot(localOnlySnapshot)
        return () => undefined
      }

      const { data } = client.client.auth.onAuthStateChange((_event, session) => {
        onSnapshot(snapshotFromSession(session))
      })
      return () => data.subscription.unsubscribe()
    },
  }
}

function snapshotFromSession(session: Session | null): AuthSnapshot {
  if (!session) {
    return {
      mode: 'signed_out',
      configured: true,
      userId: null,
      userEmail: null,
    }
  }

  return {
    mode: 'signed_in',
    configured: true,
    userId: session.user.id,
    userEmail: session.user.email ?? null,
  }
}

function normalizeCredentials(credentials: AuthCredentials) {
  const email = credentials.email.trim().toLowerCase()
  const password = credentials.password
  if (!email) throw new Error('Email is required.')
  if (!password) throw new Error('Password is required.')
  return { email, password }
}
