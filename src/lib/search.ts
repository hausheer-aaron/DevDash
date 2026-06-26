import type { DataState, SearchEntity } from '@/types'

/**
 * Lightweight global search.
 *
 * Tokenizes the query and scores each entity by how well its searchable text
 * matches. Cheap enough to run on every keystroke over thousands of records;
 * no external dependency. Results are sorted by score, then recency.
 */

interface Indexed {
  entity: SearchEntity
  haystack: string
  updatedAt: number
}

function buildIndex(data: DataState): Indexed[] {
  const out: Indexed[] = []
  for (const p of data.projects)
    out.push({
      entity: { type: 'project', item: p },
      haystack: `${p.name} ${p.key} ${p.description} ${p.tags.join(' ')}`.toLowerCase(),
      updatedAt: p.updatedAt,
    })
  for (const t of data.tasks)
    out.push({
      entity: { type: 'task', item: t },
      haystack: `${t.title} ${t.description} ${t.tags.join(' ')}`.toLowerCase(),
      updatedAt: t.updatedAt,
    })
  for (const n of data.notes)
    out.push({
      entity: { type: 'note', item: n },
      haystack: `${n.title} ${n.content}`.toLowerCase(),
      updatedAt: n.updatedAt,
    })
  for (const s of data.snippets)
    out.push({
      entity: { type: 'snippet', item: s },
      haystack: `${s.title} ${s.description} ${s.language} ${s.code} ${s.tags.join(' ')}`.toLowerCase(),
      updatedAt: s.updatedAt,
    })
  for (const c of data.commands)
    out.push({
      entity: { type: 'command', item: c },
      haystack: `${c.title} ${c.description} ${c.command} ${c.tags.join(' ')}`.toLowerCase(),
      updatedAt: c.updatedAt,
    })
  for (const l of data.links)
    out.push({
      entity: { type: 'link', item: l },
      haystack: `${l.label} ${l.url} ${l.category}`.toLowerCase(),
      updatedAt: l.updatedAt,
    })
  for (const r of data.resources)
    out.push({
      entity: { type: 'resource', item: r },
      haystack: `${r.title} ${r.notes} ${r.url}`.toLowerCase(),
      updatedAt: r.updatedAt,
    })
  return out
}

function scoreMatch(haystack: string, tokens: string[]): number {
  let score = 0
  for (const tok of tokens) {
    const idx = haystack.indexOf(tok)
    if (idx === -1) return 0 // every token must appear
    // Earlier matches and word-boundary matches score higher.
    score += 10
    if (idx === 0 || haystack[idx - 1] === ' ') score += 5
    score += Math.max(0, 6 - idx / 12)
  }
  return score
}

export function searchAll(
  data: DataState,
  query: string,
  limit = 40,
): { entity: SearchEntity; score: number }[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const tokens = q.split(/\s+/).filter(Boolean)
  const index = buildIndex(data)

  const scored: { entity: SearchEntity; score: number; updatedAt: number }[] = []
  for (const row of index) {
    const score = scoreMatch(row.haystack, tokens)
    if (score > 0) scored.push({ entity: row.entity, score, updatedAt: row.updatedAt })
  }
  scored.sort((a, b) => b.score - a.score || b.updatedAt - a.updatedAt)
  return scored.slice(0, limit).map(({ entity, score }) => ({ entity, score }))
}
