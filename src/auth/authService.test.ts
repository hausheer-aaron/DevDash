import { describe, expect, it, vi } from 'vitest'
import { SupabaseConfigurationError, type SupabaseClientResult } from '@/lib/supabase'
import { createSupabaseAuthService } from './authService'

type ConfiguredClientResult = Extract<SupabaseClientResult, { ok: true }>

function missingClient() {
  return {
    ok: false as const,
    error: new SupabaseConfigurationError(['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY']),
  }
}

function fakeClient(session: unknown = null, signUpSession: unknown = session): ConfiguredClientResult {
  const authSession = session
    ? { user: (session as { user: unknown }).user }
    : null
  return {
    ok: true as const,
    config: { url: 'https://example.supabase.co', anonKey: 'anon' },
    client: {
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session }, error: null }),
        signUp: vi.fn().mockResolvedValue({
          data: { session: signUpSession, user: signUpSession ? (signUpSession as { user: unknown }).user : null },
          error: null,
        }),
        signInWithPassword: vi.fn().mockResolvedValue({
          data: { session: authSession, user: authSession ? authSession.user : null },
          error: null,
        }),
        signOut: vi.fn().mockResolvedValue({ error: null }),
        onAuthStateChange: vi.fn().mockReturnValue({
          data: { subscription: { unsubscribe: vi.fn() } },
        }),
      },
    },
  } as unknown as ConfiguredClientResult
}

describe('Supabase auth service', () => {
  it('reports local-only mode when Supabase is not configured', async () => {
    const service = createSupabaseAuthService({ getClient: missingClient })

    await expect(service.getSnapshot()).resolves.toEqual({
      mode: 'local_only',
      configured: false,
      userId: null,
      userEmail: null,
    })
  })

  it('signs up with normalized email and password', async () => {
    const client = fakeClient({
      user: { id: 'user_1', email: 'user@example.com' },
    })
    const service = createSupabaseAuthService({ getClient: () => client })

    await expect(service.signUp({ email: ' USER@example.COM ', password: 'password123' })).resolves.toEqual({
      email: 'user@example.com',
      confirmationRequired: false,
    })
    expect(client.client.auth.signUp).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'password123',
    })
  })

  it('reports when sign up requires email confirmation', async () => {
    const client = fakeClient(null, null)
    const service = createSupabaseAuthService({ getClient: () => client })

    await expect(service.signUp({ email: 'user@example.com', password: 'password123' })).resolves.toEqual({
      email: 'user@example.com',
      confirmationRequired: true,
    })
  })

  it('signs in with email and password', async () => {
    const client = fakeClient({
      user: { id: 'user_1', email: 'user@example.com' },
    })
    const service = createSupabaseAuthService({ getClient: () => client })

    await expect(service.signIn({ email: ' USER@example.COM ', password: 'password123' })).resolves.toEqual({
      email: 'user@example.com',
      confirmationRequired: false,
    })
    expect(client.client.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'password123',
    })
  })

  it('maps Supabase sessions into signed-in auth state', async () => {
    const client = fakeClient({
      user: { id: 'user_1', email: 'user@example.com' },
    })
    const service = createSupabaseAuthService({ getClient: () => client })

    await expect(service.getSnapshot()).resolves.toEqual({
      mode: 'signed_in',
      configured: true,
      userId: 'user_1',
      userEmail: 'user@example.com',
    })
  })

  it('treats sign out as a no-op in local-only mode', async () => {
    const service = createSupabaseAuthService({ getClient: missingClient })

    await expect(service.signOut()).resolves.toBeUndefined()
  })
})
