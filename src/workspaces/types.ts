export type WorkspaceRole = 'owner' | 'admin' | 'editor' | 'viewer'

export interface CloudProfile {
  id: string
  email: string | null
  displayName: string | null
  createdAt: string
  updatedAt: string
}

export interface Workspace {
  id: string
  ownerId: string
  name: string
  settings: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface WorkspaceMember {
  workspaceId: string
  userId: string
  role: WorkspaceRole
  createdAt: string
}

export interface WorkspaceSession {
  profile: CloudProfile
  workspace: Workspace
  membership: WorkspaceMember
  createdWorkspace: boolean
}

export interface WorkspaceRows {
  profile: {
    id: string
    email: string | null
    display_name: string | null
    created_at: string
    updated_at: string
  }
  workspace: {
    id: string
    owner_id: string
    name: string
    settings: Record<string, unknown>
    created_at: string
    updated_at: string
  }
  member: {
    workspace_id: string
    user_id: string
    role: WorkspaceRole
    created_at: string
  }
}
