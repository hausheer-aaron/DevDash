import { describe, expect, it, vi } from 'vitest'
import { createWorkspaceService } from './workspaceService'
import type { SupabaseClientResult } from '@/lib/supabase'
import type { WorkspaceRows } from './types'

type ConfiguredClientResult = Extract<SupabaseClientResult, { ok: true }>

const profileRow: WorkspaceRows['profile'] = {
  id: 'user_1',
  email: 'user@example.com',
  display_name: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

const workspaceRow: WorkspaceRows['workspace'] = {
  id: 'workspace_1',
  owner_id: 'user_1',
  name: "user's workspace",
  settings: {},
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

const memberRow: WorkspaceRows['member'] = {
  workspace_id: 'workspace_1',
  user_id: 'user_1',
  role: 'owner',
  created_at: '2026-01-01T00:00:00Z',
}

function chain(result: unknown) {
  const query = {
    upsert: vi.fn(() => query),
    insert: vi.fn(() => query),
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    order: vi.fn(() => query),
    limit: vi.fn(() => query),
    single: vi.fn().mockResolvedValue({ data: result, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: result, error: null }),
  }
  return query
}

function clientWithExistingWorkspace() {
  const profile = chain(profileRow)
  const membership = chain({ ...memberRow, workspaces: workspaceRow })
  const from = vi.fn((table: string) => {
    if (table === 'profiles') return profile
    if (table === 'workspace_members') return membership
    throw new Error(`Unexpected table ${table}`)
  })
  return { from, profile, membership }
}

function clientWithoutWorkspace() {
  const profile = chain(profileRow)
  const existingMembership = chain(null)
  const workspace = chain(workspaceRow)
  const ownerMembership = chain(memberRow)
  const workspaceMembersCalls = [existingMembership, ownerMembership]
  const from = vi.fn((table: string) => {
    if (table === 'profiles') return profile
    if (table === 'workspaces') return workspace
    if (table === 'workspace_members') return workspaceMembersCalls.shift()
    throw new Error(`Unexpected table ${table}`)
  })
  return { from, profile, existingMembership, workspace, ownerMembership }
}

function configuredClient(client: unknown): SupabaseClientResult {
  return {
    ok: true,
    config: { url: 'https://example.supabase.co', anonKey: 'anon' },
    client,
  } as unknown as ConfiguredClientResult
}

describe('workspace service', () => {
  it('loads an existing personal workspace for a signed-in user', async () => {
    const fake = clientWithExistingWorkspace()
    const service = createWorkspaceService({ getClient: () => configuredClient(fake) })

    const session = await service.ensurePersonalWorkspace({ id: 'user_1', email: 'user@example.com' })

    expect(session.createdWorkspace).toBe(false)
    expect(session.profile.id).toBe('user_1')
    expect(session.workspace.id).toBe('workspace_1')
    expect(session.membership.role).toBe('owner')
    expect(fake.from).toHaveBeenCalledWith('profiles')
    expect(fake.from).toHaveBeenCalledWith('workspace_members')
  })

  it('creates a default owner workspace when none exists', async () => {
    const fake = clientWithoutWorkspace()
    const service = createWorkspaceService({ getClient: () => configuredClient(fake) })

    const session = await service.ensurePersonalWorkspace({ id: 'user_1', email: 'user@example.com' })

    expect(session.createdWorkspace).toBe(true)
    expect(session.workspace.name).toBe("user's workspace")
    expect(fake.workspace.insert).toHaveBeenCalledWith({
      owner_id: 'user_1',
      name: "user's workspace",
    })
    expect(fake.ownerMembership.insert).toHaveBeenCalledWith({
      workspace_id: 'workspace_1',
      user_id: 'user_1',
      role: 'owner',
    })
  })
})
