import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseClient, type SupabaseClientResult } from '@/lib/supabase'
import type {
  CloudProfile,
  Workspace,
  WorkspaceMember,
  WorkspaceRole,
  WorkspaceRows,
  WorkspaceSession,
} from './types'

interface SignedInUser {
  id: string
  email: string | null
}

export interface WorkspaceService {
  ensurePersonalWorkspace: (user: SignedInUser) => Promise<WorkspaceSession>
}

export function createWorkspaceService({
  getClient = getSupabaseClient,
  defaultWorkspaceName = defaultPersonalWorkspaceName,
}: {
  getClient?: () => SupabaseClientResult
  defaultWorkspaceName?: (user: SignedInUser) => string
} = {}): WorkspaceService {
  const requireClient = () => {
    const client = getClient()
    if (!client.ok) throw client.error
    return client.client
  }

  return {
    async ensurePersonalWorkspace(user) {
      const client = requireClient()
      const profile = await upsertProfile(client, user)
      const existing = await fetchFirstMembership(client, user.id)
      if (existing) {
        return {
          profile,
          workspace: mapWorkspace(existing.workspaces),
          membership: mapMember(existing),
          createdWorkspace: false,
        }
      }

      const workspace = await createWorkspace(client, user, defaultWorkspaceName(user))
      const membership = await createOwnerMembership(client, workspace.id, user.id)
      return {
        profile,
        workspace,
        membership,
        createdWorkspace: true,
      }
    },
  }
}

async function upsertProfile(client: SupabaseClient, user: SignedInUser): Promise<CloudProfile> {
  const { data, error } = await client
    .from('profiles')
    .upsert({
      id: user.id,
      email: user.email,
    }, { onConflict: 'id' })
    .select('id,email,display_name,created_at,updated_at')
    .single()

  if (error) throw error
  return mapProfile(data as WorkspaceRows['profile'])
}

async function fetchFirstMembership(client: SupabaseClient, userId: string): Promise<(WorkspaceRows['member'] & {
  workspaces: WorkspaceRows['workspace']
}) | null> {
  const { data, error } = await client
    .from('workspace_members')
    .select('workspace_id,user_id,role,created_at,workspaces(id,owner_id,name,settings,created_at,updated_at)')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data as (WorkspaceRows['member'] & { workspaces: WorkspaceRows['workspace'] }) | null
}

async function createWorkspace(
  client: SupabaseClient,
  user: SignedInUser,
  name: string,
): Promise<Workspace> {
  const { data, error } = await client
    .from('workspaces')
    .insert({
      owner_id: user.id,
      name,
    })
    .select('id,owner_id,name,settings,created_at,updated_at')
    .single()

  if (error) throw error
  return mapWorkspace(data as WorkspaceRows['workspace'])
}

async function createOwnerMembership(
  client: SupabaseClient,
  workspaceId: string,
  userId: string,
): Promise<WorkspaceMember> {
  const { data, error } = await client
    .from('workspace_members')
    .insert({
      workspace_id: workspaceId,
      user_id: userId,
      role: 'owner' satisfies WorkspaceRole,
    })
    .select('workspace_id,user_id,role,created_at')
    .single()

  if (error) throw error
  return mapMember(data as WorkspaceRows['member'])
}

function mapProfile(row: WorkspaceRows['profile']): CloudProfile {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapWorkspace(row: WorkspaceRows['workspace']): Workspace {
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    settings: row.settings,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapMember(row: WorkspaceRows['member']): WorkspaceMember {
  return {
    workspaceId: row.workspace_id,
    userId: row.user_id,
    role: row.role,
    createdAt: row.created_at,
  }
}

function defaultPersonalWorkspaceName(user: SignedInUser) {
  return user.email ? `${user.email.split('@')[0]}'s workspace` : 'Personal workspace'
}
