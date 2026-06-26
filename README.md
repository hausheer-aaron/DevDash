# DevDash

A modern, local-first **developer dashboard** for organizing everything about your
software projects in one fast, keyboard-driven place — tasks, notes, code snippets,
terminal commands, links and resources.

Built to feel like a real product (think Linear / Raycast / Vercel / GitHub), not a
tutorial project. Dark mode by default, responsive, and quick.

![DevDash](public/favicon.svg)

---

## Features

- **Dashboard** — at-a-glance stats, favorites/recent projects and upcoming tasks.
- **Projects** — create, edit, delete, favorite. Status, priority, tags, accent color
  and a Markdown overview per project.
- **Tasks** — drag-and-drop **Kanban board** (Backlog → To Do → In Progress → Done)
  with priorities, due dates and tags.
- **Notes** — rich **Markdown** notes with live preview, pinning and search.
- **Snippets** — reusable code snippets with **syntax highlighting** for 25+ languages
  and one-click copy. Available per-project or globally.
- **Commands** — store the terminal commands you keep forgetting, with copy-to-clipboard.
- **Links** — repositories, docs, deployments, design and issue trackers, grouped by type.
- **Resources** — bookmarks and reference material with Markdown notes.
- **Global search** — instant search across every entity (also in the command palette).
- **Command palette** (`⌘K` / `Ctrl+K`) — navigate, search and run actions from anywhere.
- **Keyboard shortcuts** — including chords (`g h`, `g p`, …). Press `?` for the cheatsheet.
- **Filtering & sorting** throughout (by status, priority, tag, language, favorites…).
- **Import / export** your entire workspace as JSON (merge or replace).
- **Automatic persistence** — everything is saved locally in your browser, instantly.
- **Settings** — theme (dark/light/system), accent color, reduce-motion and more.

Your data never leaves your machine — it lives in `localStorage`.

---

## Tech stack

| Concern            | Choice                                              |
| ------------------ | --------------------------------------------------- |
| Framework          | React 18 + TypeScript (strict)                      |
| Build tool         | Vite 5                                              |
| Styling            | Tailwind CSS with a CSS-variable design-token system |
| State + persistence| Zustand (`persist` middleware → `localStorage`)     |
| Routing            | React Router 6                                       |
| Animation          | Framer Motion                                        |
| Drag & drop        | dnd-kit                                              |
| Command palette    | cmdk                                                 |
| Markdown           | react-markdown + remark-gfm + rehype-highlight       |
| Syntax highlighting| highlight.js (curated language set)                 |
| Icons              | lucide-react                                         |

---

## Getting started

Requires **Node 18+**.

```bash
npm install      # install dependencies
npm run dev      # start the dev server (http://localhost:5173)
npm run build    # type-check + production build → dist/
npm run preview  # preview the production build
npm run lint     # run ESLint
npm run typecheck
```

On first launch the app loads a small set of **sample data** so it isn't empty. You can
replace it with your own, load it again, or erase everything from **Settings → Data**.

---

## Project structure

```
src/
├─ app/                 # router, theme watcher, shortcut definitions
├─ components/
│  ├─ ui/               # design-system primitives (Button, Modal, Input, Toast, …)
│  ├─ layout/           # AppShell, Sidebar, MobileBar, PageHeader
│  ├─ command/          # command palette + shortcuts dialog
│  ├─ projects/         # project cards, forms, avatar, overview
│  ├─ tasks/            # Kanban board, columns, cards, task form
│  ├─ notes/            # Markdown notes view
│  ├─ snippets/         # snippet view, card, form
│  ├─ commands/         # command view + form
│  ├─ links/            # links view + form
│  └─ resources/        # resources view + form
├─ pages/               # one component per route
├─ store/               # Zustand store, selectors, ephemeral UI store
├─ lib/                 # utils, constants, search, import/export, seed, hljs
├─ types/               # domain model (single source of truth)
├─ hooks/               # reusable hooks (shortcuts, media query)
├─ index.css           # design tokens + base styles + prose/code themes
└─ main.tsx            # entry point
```

### Architectural notes

- **Single source of truth for the domain** lives in `src/types/index.ts`. Every entity
  is a flat record with a string `id` and epoch-millis timestamps. The whole app state is
  one serializable object (`DataState`) — which is exactly the import/export unit.
- **The store** (`src/store/store.ts`) holds all data plus settings, exposes typed CRUD
  actions, and persists automatically via Zustand's `persist` middleware. Deleting a
  project cascades to its children.
- **Derived data** (progress, counts, stats) lives in memoized selector hooks
  (`src/store/selectors.ts`), never duplicated in state.
- **Design tokens** are CSS variables (`--bg`, `--surface`, `--accent`, …) mapped into
  Tailwind, so theming (dark/light + accent color) is a runtime variable swap.
- **`SCHEMA_VERSION`** gates persisted-state and import migrations for forward safety.

---

## Extending DevDash

The schema is **additive** — new features slot in without disturbing existing data:

1. Add an entity type to `src/types/index.ts` and include it in `DataState`.
2. Add an array + CRUD actions to the store (mirror an existing entity).
3. Build a view/form under `src/components/<feature>/` and a tab or page for it.
4. Add it to `searchAll` (`src/lib/search.ts`) and the command palette if searchable.

Designed with future integrations in mind — **GitHub**, **deployment monitoring**,
**CI/CD status**, **Docker management** and **AI-powered project assistance** can each be
added as a new entity type + project tab, reusing the existing UI primitives and store
patterns.

---

## Keyboard shortcuts

| Shortcut        | Action                |
| --------------- | --------------------- |
| `⌘K` / `Ctrl+K` | Command palette       |
| `/`             | Search everything     |
| `n`             | New project           |
| `?`             | Shortcuts cheatsheet  |
| `g` then `h`    | Dashboard             |
| `g` then `p`    | Projects              |
| `g` then `s`    | Snippets              |
| `g` then `c`    | Commands              |
| `g` then `,`    | Settings              |

---

## License

MIT — use it, fork it, make it yours.
