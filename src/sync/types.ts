export type WorkspaceSyncMode = 'local_only' | 'cloud_synced' | 'cloud_readonly'

export type SyncOperationType = 'create' | 'update' | 'delete' | 'replace'

export type SyncEntityType =
  | 'project'
  | 'task'
  | 'note'
  | 'snippet'
  | 'command'
  | 'link'
  | 'resource'
  | 'settings'
  | 'bundle'

export interface SyncOperation {
  id: string
  entityType: SyncEntityType
  entityId: string | null
  operation: SyncOperationType
  payload: unknown
  createdAt: number
  attempts: number
  lastError: string | null
}

export interface SyncQueueState {
  operations: SyncOperation[]
}

export interface WorkspaceSyncState {
  mode: WorkspaceSyncMode
  queue: SyncQueueState
  lastSyncedAt: number | null
  lastError: string | null
}
