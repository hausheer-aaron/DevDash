import { describe, expect, it, vi } from 'vitest'
import { createAuthStoreForTest } from './auth'
import type { AuthService } from '@/auth/authService'

function service(patch: Partial<AuthService>): AuthService {
  return {
    getSnapshot: vi.fn().mockResolvedValue({
      mode: 'local_only',
      configured: false,
      userId: null,
      userEmail: null,
    }),
    signUp: vi.fn().mockResolvedValue({ email: 'user@example.com', confirmationRequired: false }),
    signIn: vi.fn().mockResolvedValue({ email: 'user@example.com', confirmationRequired: false }),
    signOut: vi.fn().mockResolvedValue(undefined),
    subscribe: vi.fn().mockReturnValue(() => undefined),
    ...patch,
  }
}

describe('auth store', () => {
  it('keeps local-only state when Supabase is not configured', async () => {
    const store = createAuthStoreForTest(service({}))

    await store.getState().initAuth()

    expect(store.getState()).toMatchObject({
      mode: 'local_only',
      configured: false,
      userId: null,
      userEmail: null,
      error: null,
    })
  })

  it('stores the signed-in snapshot when a session exists', async () => {
    const store = createAuthStoreForTest(service({
      getSnapshot: vi.fn().mockResolvedValue({
        mode: 'signed_in',
        configured: true,
        userId: 'user_1',
        userEmail: 'user@example.com',
      }),
    }))

    await store.getState().initAuth()

    expect(store.getState()).toMatchObject({
      mode: 'signed_in',
      configured: true,
      userId: 'user_1',
      userEmail: 'user@example.com',
    })
  })

  it('signs up with a confirmation notice when the session is pending email verification', async () => {
    const store = createAuthStoreForTest(
      service({
        signUp: vi.fn().mockResolvedValue({
          email: 'user@example.com',
          confirmationRequired: true,
        }),
      }),
    )

    await store.getState().signUp('user@example.com', 'password123')

    expect(store.getState()).toMatchObject({
      loading: false,
      notice: 'Account created. Check your email to confirm your account before signing in.',
      error: null,
    })
  })

  it('signs in with email and password', async () => {
    const signIn = vi.fn().mockResolvedValue({ email: 'user@example.com', confirmationRequired: false })
    const store = createAuthStoreForTest(service({ signIn }))

    await store.getState().signIn('user@example.com', 'password123')

    expect(signIn).toHaveBeenCalledWith({ email: 'user@example.com', password: 'password123' })
    expect(store.getState()).toMatchObject({
      loading: false,
      error: null,
    })
  })
})
