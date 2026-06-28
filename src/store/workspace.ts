import { create } from 'zustand'
import {
  createWorkspaceService,
  type WorkspaceService,
} from '@/workspaces/workspaceService'
import type { Workspace, WorkspaceMember } from '@/workspaces/types'

interface WorkspaceState {
  loading: boolean
  workspace: Workspace | null
  membership: WorkspaceMember | null
  createdWorkspace: boolean
  error: string | null
  ensurePersonalWorkspace: (user: { id: string; email: string | null }) => Promise<void>
  clearWorkspace: () => void
}

const workspaceService = createWorkspaceService()

export const useWorkspaceStore = create<WorkspaceState>()((set) => ({
  loading: false,
  workspace: null,
  membership: null,
  createdWorkspace: false,
  error: null,

  ensurePersonalWorkspace: async (user) => {
    set({ loading: true, error: null })
    try {
      const session = await workspaceService.ensurePersonalWorkspace(user)
      set({
        loading: false,
        workspace: session.workspace,
        membership: session.membership,
        createdWorkspace: session.createdWorkspace,
        error: null,
      })
    } catch (error) {
      set({ loading: false, error: errorMessage(error) })
    }
  },

  clearWorkspace: () => {
    set({
      loading: false,
      workspace: null,
      membership: null,
      createdWorkspace: false,
      error: null,
    })
  },
}))

export function createWorkspaceStoreForTest(service: WorkspaceService) {
  return create<WorkspaceState>()((set) => ({
    loading: false,
    workspace: null,
    membership: null,
    createdWorkspace: false,
    error: null,

    ensurePersonalWorkspace: async (user) => {
      set({ loading: true, error: null })
      try {
        const session = await service.ensurePersonalWorkspace(user)
        set({
          loading: false,
          workspace: session.workspace,
          membership: session.membership,
          createdWorkspace: session.createdWorkspace,
          error: null,
        })
      } catch (error) {
        set({ loading: false, error: errorMessage(error) })
      }
    },

    clearWorkspace: () => {
      set({
        loading: false,
        workspace: null,
        membership: null,
        createdWorkspace: false,
        error: null,
      })
    },
  }))
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Workspace setup failed.'
}
