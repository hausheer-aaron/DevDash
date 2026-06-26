import type { DataState } from '@/types'
import { uid } from './utils'

/**
 * Seed data used on first launch so the app feels alive instead of empty.
 * Timestamps are spread across the recent past for realistic "updated" times.
 * Users can wipe this from Settings → Data.
 */
export function createSeedData(): DataState {
  const t = Date.now()
  const days = (n: number) => t - n * 86_400_000
  const hrs = (n: number) => t - n * 3_600_000

  const webId = uid('proj')
  const apiId = uid('proj')
  const cliId = uid('proj')

  const projects: DataState['projects'] = [
    {
      id: webId,
      name: 'Aurora Web App',
      key: 'WEB',
      description:
        'Customer-facing dashboard built with React, TanStack Query and a design system shared across products.',
      status: 'active',
      priority: 'high',
      tags: ['react', 'typescript', 'frontend'],
      color: 'indigo',
      favorite: true,
      readme:
        '# Aurora Web App\n\nThe primary customer dashboard. Ships weekly behind a feature-flag gate.\n\n## Stack\n\n- **React 18** + Vite\n- **TanStack Query** for server state\n- **Tailwind** + internal design system\n\n## Conventions\n\n- Feature folders under `src/features/*`\n- Co-locate tests with components\n- All network access goes through `lib/api`\n\n> Reach out in `#aurora` before touching the billing flow.',
      createdAt: days(64),
      updatedAt: hrs(5),
    },
    {
      id: apiId,
      name: 'Core API',
      key: 'API',
      description:
        'Go service exposing the public REST + gRPC API. Owns auth, billing and the events pipeline.',
      status: 'active',
      priority: 'urgent',
      tags: ['go', 'backend', 'postgres'],
      color: 'emerald',
      favorite: true,
      readme:
        '# Core API\n\nGo monolith (for now) behind an API gateway.\n\n## Running locally\n\n```bash\nmake dev        # starts postgres + the service\nmake migrate    # apply migrations\n```\n\n## Notes\n\n- Auth uses short-lived JWTs + refresh tokens\n- Background jobs via the `worker` binary',
      createdAt: days(120),
      updatedAt: hrs(28),
    },
    {
      id: cliId,
      name: 'devctl CLI',
      key: 'CLI',
      description: 'Internal command-line tool for scaffolding services and managing environments.',
      status: 'planning',
      priority: 'medium',
      tags: ['rust', 'tooling', 'dx'],
      color: 'amber',
      favorite: false,
      readme:
        '# devctl\n\nOne CLI to rule the inner loop. Written in Rust for fast startup.\n\n## Goals\n\n- `devctl new <template>` scaffolds a service\n- `devctl env` manages local env vars\n- `devctl deploy` triggers a preview deploy',
      createdAt: days(14),
      updatedAt: days(2),
    },
  ]

  const tasks: DataState['tasks'] = [
    mkTask(webId, 'Polish the empty states', 'in_progress', 'medium', 0, days(1), ['ui']),
    mkTask(webId, 'Wire up command palette', 'done', 'high', 0, days(3), ['ux']),
    mkTask(webId, 'Audit bundle size', 'todo', 'low', 0, null, ['perf']),
    mkTask(webId, 'Dark mode contrast pass', 'backlog', 'low', 0, null, ['a11y']),
    mkTask(apiId, 'Rotate signing keys', 'todo', 'urgent', 0, days(-2), ['security']),
    mkTask(apiId, 'Add rate limiting to /auth', 'in_progress', 'high', 1, days(2), ['security']),
    mkTask(apiId, 'Migrate events to outbox pattern', 'backlog', 'medium', 0, null, ['arch']),
    mkTask(cliId, 'Design the plugin API', 'todo', 'medium', 0, null, ['design']),
    mkTask(cliId, 'Pick an arg-parsing crate', 'done', 'low', 0, days(5), []),
  ]

  const notes: DataState['notes'] = [
    {
      id: uid('note'),
      projectId: webId,
      title: 'Release checklist',
      content:
        '## Pre-release\n\n- [x] Update changelog\n- [x] Run visual regression suite\n- [ ] Smoke test billing flow\n- [ ] Bump version & tag\n\n## Post-release\n\n- [ ] Announce in `#releases`\n- [ ] Watch error rate for 30m',
      pinned: true,
      createdAt: days(10),
      updatedAt: hrs(6),
    },
    {
      id: uid('note'),
      projectId: apiId,
      title: 'Incident notes — 2026-06-18',
      content:
        '**Summary:** elevated 5xx on `/billing/charge` for ~12 minutes.\n\n**Root cause:** connection pool exhaustion after a deploy reset max conns.\n\n**Fix:** raised pool size, added a pre-warm step.\n\n**Follow-ups:**\n\n1. Alert on pool saturation\n2. Document the deploy → pool interaction',
      pinned: false,
      createdAt: days(8),
      updatedAt: days(8),
    },
  ]

  const snippets: DataState['snippets'] = [
    {
      id: uid('snip'),
      projectId: webId,
      title: 'useDebouncedValue hook',
      description: 'Debounce a fast-changing value (search inputs, resize, etc.).',
      language: 'typescript',
      code: 'import { useEffect, useState } from \'react\'\n\nexport function useDebouncedValue<T>(value: T, delay = 200): T {\n  const [debounced, setDebounced] = useState(value)\n  useEffect(() => {\n    const id = setTimeout(() => setDebounced(value), delay)\n    return () => clearTimeout(id)\n  }, [value, delay])\n  return debounced\n}',
      tags: ['react', 'hooks'],
      favorite: true,
      createdAt: days(20),
      updatedAt: days(20),
    },
    {
      id: uid('snip'),
      projectId: null,
      title: 'Graceful HTTP shutdown (Go)',
      description: 'Drain in-flight requests before exiting.',
      language: 'go',
      code: 'srv := &http.Server{Addr: ":8080", Handler: mux}\n\ngo func() {\n\tif err := srv.ListenAndServe(); err != http.ErrServerClosed {\n\t\tlog.Fatal(err)\n\t}\n}()\n\nstop := make(chan os.Signal, 1)\nsignal.Notify(stop, os.Interrupt, syscall.SIGTERM)\n<-stop\n\nctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)\ndefer cancel()\n_ = srv.Shutdown(ctx)',
      tags: ['go', 'http'],
      favorite: false,
      createdAt: days(40),
      updatedAt: days(40),
    },
  ]

  const commands: DataState['commands'] = [
    {
      id: uid('cmd'),
      projectId: apiId,
      title: 'Tail production logs',
      description: 'Stream structured logs filtered to the api service.',
      command: 'kubectl logs -f -l app=core-api --since=10m | jq .',
      tags: ['k8s', 'ops'],
      favorite: true,
      createdAt: days(30),
      updatedAt: days(30),
    },
    {
      id: uid('cmd'),
      projectId: null,
      title: 'Prune merged git branches',
      description: 'Delete local branches whose remote is gone.',
      command: "git fetch -p && git branch -vv | awk '/: gone]/{print $1}' | xargs -r git branch -D",
      tags: ['git'],
      favorite: true,
      createdAt: days(50),
      updatedAt: days(50),
    },
    {
      id: uid('cmd'),
      projectId: webId,
      title: 'Analyze bundle',
      description: 'Build with the visualizer enabled.',
      command: 'ANALYZE=1 npm run build && open dist/stats.html',
      tags: ['perf', 'build'],
      favorite: false,
      createdAt: days(12),
      updatedAt: days(12),
    },
  ]

  const links: DataState['links'] = [
    mkLink(webId, 'GitHub repo', 'https://github.com/acme/aurora-web', 'repository'),
    mkLink(webId, 'Production', 'https://app.acme.com', 'deployment'),
    mkLink(webId, 'Figma — design system', 'https://figma.com/file/acme-ds', 'design'),
    mkLink(apiId, 'GitHub repo', 'https://github.com/acme/core-api', 'repository'),
    mkLink(apiId, 'API reference', 'https://docs.acme.com/api', 'documentation'),
    mkLink(apiId, 'Grafana', 'https://grafana.acme.com/d/core-api', 'deployment'),
  ]

  const resources: DataState['resources'] = [
    {
      id: uid('res'),
      projectId: webId,
      title: 'Design system Storybook',
      url: 'https://storybook.acme.com',
      notes: 'Canonical reference for components and tokens. Check before building new UI.',
      createdAt: days(22),
      updatedAt: days(22),
    },
    {
      id: uid('res'),
      projectId: apiId,
      title: 'Architecture decision records',
      url: 'https://github.com/acme/core-api/tree/main/docs/adr',
      notes: 'Read ADR-0007 (auth) and ADR-0012 (events) before changing those areas.',
      createdAt: days(18),
      updatedAt: days(18),
    },
  ]

  return { projects, tasks, notes, snippets, commands, links, resources }
}

function mkTask(
  projectId: string,
  title: string,
  status: DataState['tasks'][number]['status'],
  priority: DataState['tasks'][number]['priority'],
  order: number,
  dueDate: number | null,
  tags: string[],
): DataState['tasks'][number] {
  const t = Date.now()
  return {
    id: uid('task'),
    projectId,
    title,
    description: '',
    status,
    priority,
    order,
    tags,
    dueDate,
    createdAt: t,
    updatedAt: t,
  }
}

function mkLink(
  projectId: string,
  label: string,
  url: string,
  category: DataState['links'][number]['category'],
): DataState['links'][number] {
  const t = Date.now()
  return { id: uid('link'), projectId, label, url, category, createdAt: t, updatedAt: t }
}
