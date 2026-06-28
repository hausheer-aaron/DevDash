import { describe, expect, it, vi } from 'vitest'
import {
  checkSupabaseHealth,
  getSupabaseClient,
  getSupabaseConfig,
  SupabaseConfigurationError,
} from '@/lib/supabase'

const configuredEnv = {
  VITE_SUPABASE_URL: 'https://devdash.supabase.co/',
  VITE_SUPABASE_ANON_KEY: 'anon-key',
}

describe('Supabase configuration', () => {
  it('returns a clear error when env vars are missing', () => {
    const result = getSupabaseConfig({})

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toBeInstanceOf(SupabaseConfigurationError)
    expect(result.error.message).toContain('VITE_SUPABASE_URL')
    expect(result.error.message).toContain('VITE_SUPABASE_ANON_KEY')
  })

  it('normalizes configured env vars', () => {
    const result = getSupabaseConfig(configuredEnv)

    expect(result).toEqual({
      ok: true,
      config: {
        url: 'https://devdash.supabase.co',
        anonKey: 'anon-key',
      },
    })
  })

  it('creates a client only when configured', () => {
    const missing = getSupabaseClient({})
    expect(missing.ok).toBe(false)

    const configured = getSupabaseClient(configuredEnv)
    expect(configured.ok).toBe(true)
    if (!configured.ok) return
    expect(configured.client).toBeDefined()
    expect(configured.config.url).toBe('https://devdash.supabase.co')
  })
})

describe('Supabase health check', () => {
  it('stays local-only safe when Supabase is not configured', async () => {
    const result = await checkSupabaseHealth({ env: {}, fetcher: vi.fn() })

    expect(result.ok).toBe(false)
    expect(result.configured).toBe(false)
  })

  it('checks the Supabase auth health endpoint when configured', async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true, status: 200 })

    const result = await checkSupabaseHealth({ env: configuredEnv, fetcher })

    expect(result).toEqual({ ok: true, configured: true })
    expect(fetcher).toHaveBeenCalledWith('https://devdash.supabase.co/auth/v1/health', {
      headers: {
        apikey: 'anon-key',
        Authorization: 'Bearer anon-key',
      },
    })
  })

  it('returns an error for unsuccessful health responses', async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: false, status: 503 })

    const result = await checkSupabaseHealth({ env: configuredEnv, fetcher })

    expect(result.ok).toBe(false)
    expect(result.configured).toBe(true)
    if (result.ok || !result.configured) return
    expect(result.error.message).toContain('HTTP 503')
  })
})
