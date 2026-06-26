import type {
  LinkCategory,
  Priority,
  ProjectStatus,
  TaskStatus,
  ThemeMode,
} from '@/types'

export const STORAGE_KEY = 'devdash:store'

/* ── Status ───────────────────────────────────────────────────────────────
   `dot` / `text` use Tailwind classes; `solid` is an inline rgb for charts. */
export const STATUS_META: Record<
  ProjectStatus,
  { label: string; dot: string; text: string; badge: string }
> = {
  planning: {
    label: 'Planning',
    dot: 'bg-info',
    text: 'text-info',
    badge: 'bg-info/10 text-info ring-info/20',
  },
  active: {
    label: 'Active',
    dot: 'bg-success',
    text: 'text-success',
    badge: 'bg-success/10 text-success ring-success/20',
  },
  paused: {
    label: 'Paused',
    dot: 'bg-warning',
    text: 'text-warning',
    badge: 'bg-warning/10 text-warning ring-warning/20',
  },
  completed: {
    label: 'Completed',
    dot: 'bg-accent',
    text: 'text-accent',
    badge: 'bg-accent/10 text-accent ring-accent/20',
  },
  archived: {
    label: 'Archived',
    dot: 'bg-faint',
    text: 'text-faint',
    badge: 'bg-faint/10 text-faint ring-faint/20',
  },
}

export const PROJECT_STATUSES = Object.keys(STATUS_META) as ProjectStatus[]

/* ── Priority ─────────────────────────────────────────────────────────────*/
export const PRIORITY_META: Record<
  Priority,
  { label: string; text: string; badge: string; weight: number }
> = {
  low: { label: 'Low', text: 'text-faint', badge: 'bg-faint/10 text-faint ring-faint/20', weight: 0 },
  medium: {
    label: 'Medium',
    text: 'text-info',
    badge: 'bg-info/10 text-info ring-info/20',
    weight: 1,
  },
  high: {
    label: 'High',
    text: 'text-warning',
    badge: 'bg-warning/10 text-warning ring-warning/20',
    weight: 2,
  },
  urgent: {
    label: 'Urgent',
    text: 'text-danger',
    badge: 'bg-danger/10 text-danger ring-danger/20',
    weight: 3,
  },
}

export const PRIORITIES = Object.keys(PRIORITY_META) as Priority[]

/* ── Task status (Kanban columns) ─────────────────────────────────────────*/
export const TASK_STATUS_META: Record<
  TaskStatus,
  { label: string; dot: string; accent: string }
> = {
  backlog: { label: 'Backlog', dot: 'bg-faint', accent: 'text-faint' },
  todo: { label: 'To Do', dot: 'bg-info', accent: 'text-info' },
  in_progress: { label: 'In Progress', dot: 'bg-warning', accent: 'text-warning' },
  done: { label: 'Done', dot: 'bg-success', accent: 'text-success' },
}

export const TASK_STATUSES = Object.keys(TASK_STATUS_META) as TaskStatus[]

/* ── Link categories ──────────────────────────────────────────────────────*/
export const LINK_CATEGORY_META: Record<
  LinkCategory,
  { label: string; icon: string }
> = {
  repository: { label: 'Repository', icon: 'GitBranch' },
  documentation: { label: 'Documentation', icon: 'BookOpen' },
  deployment: { label: 'Deployment', icon: 'Rocket' },
  design: { label: 'Design', icon: 'Figma' },
  issue: { label: 'Issue Tracker', icon: 'CircleDot' },
  other: { label: 'Other', icon: 'Link' },
}

export const LINK_CATEGORIES = Object.keys(LINK_CATEGORY_META) as LinkCategory[]

/* ── Accent swatches for project avatars ──────────────────────────────────*/
export const ACCENT_SWATCHES: Record<string, { label: string; from: string; to: string }> = {
  indigo: { label: 'Indigo', from: '#818cf8', to: '#6366f1' },
  violet: { label: 'Violet', from: '#a78bfa', to: '#7c3aed' },
  blue: { label: 'Blue', from: '#60a5fa', to: '#2563eb' },
  cyan: { label: 'Cyan', from: '#22d3ee', to: '#0891b2' },
  emerald: { label: 'Emerald', from: '#34d399', to: '#059669' },
  amber: { label: 'Amber', from: '#fbbf24', to: '#d97706' },
  rose: { label: 'Rose', from: '#fb7185', to: '#e11d48' },
  pink: { label: 'Pink', from: '#f472b6', to: '#db2777' },
  slate: { label: 'Slate', from: '#94a3b8', to: '#475569' },
}

export const ACCENT_KEYS = Object.keys(ACCENT_SWATCHES)

export const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
  { value: 'system', label: 'System' },
]

/** Common languages offered in the snippet editor (highlight.js identifiers). */
export const SNIPPET_LANGUAGES = [
  'typescript',
  'javascript',
  'tsx',
  'jsx',
  'python',
  'go',
  'rust',
  'java',
  'kotlin',
  'swift',
  'ruby',
  'php',
  'c',
  'cpp',
  'csharp',
  'sql',
  'bash',
  'shell',
  'json',
  'yaml',
  'toml',
  'html',
  'css',
  'scss',
  'graphql',
  'dockerfile',
  'markdown',
  'plaintext',
] as const
