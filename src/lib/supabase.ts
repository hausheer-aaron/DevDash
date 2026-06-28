import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export const SUPABASE_URL_ENV = 'VITE_SUPABASE_URL'
export const SUPABASE_ANON_KEY_ENV = 'VITE_SUPABASE_ANON_KEY'

export interface SupabaseConfig {
  url: string
  anonKey: string
}

export interface SupabaseEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
}

export class SupabaseConfigurationError extends Error {
  constructor(readonly missing: string[]) {
    super(`Supabase is not configured. Missing: ${missing.join(', ')}.`)
    this.name = 'SupabaseConfigurationError'
  }
}

export type SupabaseConfigResult =
  | { ok: true; config: SupabaseConfig }
  | { ok: false; error: SupabaseConfigurationError }

export type SupabaseClientResult =
  | { ok: true; client: SupabaseClient; config: SupabaseConfig }
  | { ok: false; error: SupabaseConfigurationError }

export type SupabaseHealthResult =
  | { ok: true; configured: true }
  | { ok: false; configured: false; error: SupabaseConfigurationError }
  | { ok: false; configured: true; error: Error }

let cachedClient: SupabaseClient | null = null
let cachedKey: string | null = null

export function getSupabaseConfig(env: SupabaseEnv = import.meta.env): SupabaseConfigResult {
  const url = env.VITE_SUPABASE_URL?.trim() ?? ''
  const anonKey = env.VITE_SUPABASE_ANON_KEY?.trim() ?? ''
  const missing = [
    url ? null : SUPABASE_URL_ENV,
    anonKey ? null : SUPABASE_ANON_KEY_ENV,
  ].filter((value): value is string => Boolean(value))

  if (missing.length) return { ok: false, error: new SupabaseConfigurationError(missing) }
  return { ok: true, config: { url: trimTrailingSlash(url), anonKey } }
}

export function createSupabaseClient(config: SupabaseConfig): SupabaseClient {
  return createClient(config.url, config.anonKey, {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      persistSession: true,
    },
  })
}

export function getSupabaseClient(env: SupabaseEnv = import.meta.env): SupabaseClientResult {
  const config = getSupabaseConfig(env)
  if (!config.ok) return config

  const cacheKey = `${config.config.url}:${config.config.anonKey}`
  if (!cachedClient || cachedKey !== cacheKey) {
    cachedClient = createSupabaseClient(config.config)
    cachedKey = cacheKey
  }

  return { ok: true, client: cachedClient, config: config.config }
}

export async function checkSupabaseHealth({
  env = import.meta.env,
  fetcher = globalThis.fetch,
}: {
  env?: SupabaseEnv
  fetcher?: typeof fetch
} = {}): Promise<SupabaseHealthResult> {
  const config = getSupabaseConfig(env)
  if (!config.ok) return { ok: false, configured: false, error: config.error }
  if (!fetcher) {
    return {
      ok: false,
      configured: true,
      error: new Error('Supabase health check requires fetch support.'),
    }
  }

  try {
    const response = await fetcher(`${config.config.url}/auth/v1/health`, {
      headers: {
        apikey: config.config.anonKey,
        Authorization: `Bearer ${config.config.anonKey}`,
      },
    })
    if (response.ok) return { ok: true, configured: true }
    return {
      ok: false,
      configured: true,
      error: new Error(`Supabase health check failed with HTTP ${response.status}.`),
    }
  } catch (error) {
    return {
      ok: false,
      configured: true,
      error: error instanceof Error ? error : new Error('Supabase health check failed.'),
    }
  }
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '')
}
