import { describe, expect, it, vi } from 'vitest'
import { createWorkspaceStoreForTest } from './workspace'
import type { WorkspaceSession } from '@/workspaces/types'

const session: WorkspaceSession = {
  profile: {
    id: 'user_1',
    email: 'user@example.com',
    displayName: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  workspace: {
    id: 'workspace_1',
    ownerId: 'user_1',
    name: "user's workspace",
    settings: {},
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  membership: {
    workspaceId: 'workspace_1',
    userId: 'user_1',
    role: 'owner',
    createdAt: '2026-01-01T00:00:00Z',
  },
  createdWorkspace: true,
}

describe('workspace store', () => {
  it('stores the ensured personal workspace', async () => {
    const store = createWorkspaceStoreForTest({
      ensurePersonalWorkspace: vi.fn().mockResolvedValue(session),
    })

    await store.getState().ensurePersonalWorkspace({ id: 'user_1', email: 'user@example.com' })

    expect(store.getState()).toMatchObject({
      loading: false,
      workspace: session.workspace,
      membership: session.membership,
      createdWorkspace: true,
      error: null,
    })
  })

  it('can clear cloud workspace state for local-only or sign-out', () => {
    const store = createWorkspaceStoreForTest({
      ensurePersonalWorkspace: vi.fn().mockResolvedValue(session),
    })
    store.setState({ workspace: session.workspace, membership: session.membership })

    store.getState().clearWorkspace()

    expect(store.getState()).toMatchObject({
      workspace: null,
      membership: null,
      createdWorkspace: false,
      error: null,
    })
  })
})
