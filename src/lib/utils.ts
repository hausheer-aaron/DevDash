import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { customAlphabet } from 'nanoid'

/** Tailwind-aware className combiner. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const nano = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 12)

/** Short, URL-safe, collision-resistant id. */
export function uid(prefix = '') {
  return prefix ? `${prefix}_${nano()}` : nano()
}

/** A monotonically-increasing timestamp. Centralized so it can be faked in tests. */
export function now() {
  return Date.now()
}

/** Relative time like "3h ago", "just now", "in 2d". */
export function timeAgo(ts: number, ref = Date.now()): string {
  const diff = ts - ref
  const abs = Math.abs(diff)
  const sec = Math.round(abs / 1000)
  const min = Math.round(sec / 60)
  const hr = Math.round(min / 60)
  const day = Math.round(hr / 24)
  const wk = Math.round(day / 7)
  const mo = Math.round(day / 30)
  const yr = Math.round(day / 365)

  const fmt = (n: number, unit: string) =>
    diff < 0 ? `${n}${unit} ago` : `in ${n}${unit}`

  if (sec < 45) return 'just now'
  if (min < 60) return fmt(min, 'm')
  if (hr < 24) return fmt(hr, 'h')
  if (day < 7) return fmt(day, 'd')
  if (wk < 5) return fmt(wk, 'w')
  if (mo < 12) return fmt(mo, 'mo')
  return fmt(yr, 'y')
}

/** Absolute date, e.g. "Jun 12, 2026". */
export function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/** Date for <input type="date">, e.g. "2026-06-12". */
export function toDateInput(ts: number | null): string {
  if (!ts) return ''
  const d = new Date(ts)
  const off = d.getTimezoneOffset()
  return new Date(ts - off * 60_000).toISOString().slice(0, 10)
}

export function fromDateInput(value: string): number | null {
  if (!value) return null
  const ts = new Date(value + 'T00:00:00').getTime()
  return Number.isNaN(ts) ? null : ts
}

/** Derive a 2–4 char project key from a name (e.g. "Payments API" → "PA"). */
export function deriveKey(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return 'PR'
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase()
  return words
    .slice(0, 3)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

/** Deterministically pick an accent key from a string (for avatars without one). */
export function colorFromString(str: string, keys: string[]): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) | 0
  return keys[Math.abs(hash) % keys.length]
}

export function pluralize(n: number, singular: string, plural = singular + 's') {
  return `${n} ${n === 1 ? singular : plural}`
}

export function truncate(str: string, max: number) {
  return str.length > max ? str.slice(0, max - 1).trimEnd() + '…' : str
}

/** Parse a comma/space-separated tag string into a clean, de-duped array. */
export function parseTags(input: string): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of input.split(/[,\n]/)) {
    const t = raw.trim().replace(/\s+/g, '-').toLowerCase()
    if (t && !seen.has(t)) {
      seen.add(t)
      out.push(t)
    }
  }
  return out
}

export function isModKey(e: KeyboardEvent | React.KeyboardEvent) {
  return e.metaKey || e.ctrlKey
}

/** True when focus is in a text field, so global single-key shortcuts can bail. */
export function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null
  if (!el) return false
  const tag = el.tagName
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    el.isContentEditable === true
  )
}

export function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Fallback for non-secure contexts.
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand('copy')
      ta.remove()
      return ok
    } catch {
      return false
    }
  }
}
