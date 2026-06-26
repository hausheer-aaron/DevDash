import type { ExportBundle } from '@/types'

/** Read a user-selected file as text. */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'))
    reader.readAsText(file)
  })
}

/** Parse + shallow-validate an export bundle. Throws on malformed input. */
export function parseBundle(text: string): Partial<ExportBundle> {
  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    throw new Error('That file is not valid JSON.')
  }
  if (typeof json !== 'object' || json === null) {
    throw new Error('Unexpected file format.')
  }
  const obj = json as Record<string, unknown>
  const arrays = ['projects', 'tasks', 'notes', 'snippets', 'commands', 'links', 'resources']
  const hasAnyArray = arrays.some((k) => Array.isArray(obj[k]))
  if (!hasAnyArray) {
    throw new Error('This file does not look like a DevDash export.')
  }
  for (const key of arrays) {
    if (obj[key] !== undefined && !Array.isArray(obj[key])) {
      throw new Error(`The "${key}" field is malformed.`)
    }
  }
  return json as Partial<ExportBundle>
}

export function bundleSummary(bundle: Partial<ExportBundle>) {
  return {
    projects: bundle.projects?.length ?? 0,
    tasks: bundle.tasks?.length ?? 0,
    notes: bundle.notes?.length ?? 0,
    snippets: bundle.snippets?.length ?? 0,
    commands: bundle.commands?.length ?? 0,
    links: bundle.links?.length ?? 0,
    resources: bundle.resources?.length ?? 0,
  }
}
