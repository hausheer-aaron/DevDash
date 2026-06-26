import { useMemo } from 'react'
import { useStore } from './store'
import type { Project, Task } from '@/types'

/** Lookup a single project. */
export function useProject(id: string | undefined): Project | undefined {
  return useStore((s) => (id ? s.projects.find((p) => p.id === id) : undefined))
}

/** Tasks for a project, sorted by column order. */
export function useProjectTasks(projectId: string): Task[] {
  const tasks = useStore((s) => s.tasks)
  return useMemo(
    () =>
      tasks
        .filter((t) => t.projectId === projectId)
        .sort((a, b) => a.order - b.order),
    [tasks, projectId],
  )
}

export interface ProjectStats {
  total: number
  done: number
  inProgress: number
  todo: number
  backlog: number
  /** 0–100 completion percentage. */
  progress: number
  notes: number
  snippets: number
  commands: number
  links: number
  resources: number
}

export function useProjectStats(projectId: string): ProjectStats {
  return useStore((s) => {
    const tasks = s.tasks.filter((t) => t.projectId === projectId)
    const done = tasks.filter((t) => t.status === 'done').length
    return {
      total: tasks.length,
      done,
      inProgress: tasks.filter((t) => t.status === 'in_progress').length,
      todo: tasks.filter((t) => t.status === 'todo').length,
      backlog: tasks.filter((t) => t.status === 'backlog').length,
      progress: tasks.length ? Math.round((done / tasks.length) * 100) : 0,
      notes: s.notes.filter((n) => n.projectId === projectId).length,
      snippets: s.snippets.filter((x) => x.projectId === projectId).length,
      commands: s.commands.filter((x) => x.projectId === projectId).length,
      links: s.links.filter((x) => x.projectId === projectId).length,
      resources: s.resources.filter((x) => x.projectId === projectId).length,
    }
  })
}

export interface DashboardStats {
  totalProjects: number
  activeProjects: number
  favoriteProjects: number
  openTasks: number
  completedTasks: number
  dueSoon: number
  totalSnippets: number
  totalCommands: number
}

export function useDashboardStats(): DashboardStats {
  const projects = useStore((s) => s.projects)
  const tasks = useStore((s) => s.tasks)
  const snippets = useStore((s) => s.snippets)
  const commands = useStore((s) => s.commands)

  return useMemo(() => {
    const soon = Date.now() + 3 * 86_400_000
    return {
      totalProjects: projects.length,
      activeProjects: projects.filter((p) => p.status === 'active').length,
      favoriteProjects: projects.filter((p) => p.favorite).length,
      openTasks: tasks.filter((t) => t.status !== 'done').length,
      completedTasks: tasks.filter((t) => t.status === 'done').length,
      dueSoon: tasks.filter(
        (t) => t.status !== 'done' && t.dueDate != null && t.dueDate <= soon,
      ).length,
      totalSnippets: snippets.length,
      totalCommands: commands.length,
    }
  }, [projects, tasks, snippets, commands])
}

/** All unique tags across projects, with usage counts (desc). */
export function useAllProjectTags(): { tag: string; count: number }[] {
  const projects = useStore((s) => s.projects)
  return useMemo(() => {
    const counts = new Map<string, number>()
    for (const p of projects) for (const t of p.tags) counts.set(t, (counts.get(t) ?? 0) + 1)
    return [...counts.entries()]
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
  }, [projects])
}
