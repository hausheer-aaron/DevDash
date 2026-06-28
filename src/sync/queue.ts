import { now, uid } from '@/lib/utils'
import type {
  SyncEntityType,
  SyncOperation,
  SyncOperationType,
  SyncQueueState,
  WorkspaceSyncMode,
  WorkspaceSyncState,
} from './types'

export const DEFAULT_SYNC_MODE: WorkspaceSyncMode = 'local_only'

export function createEmptySyncQueue(): SyncQueueState {
  return { operations: [] }
}

export function createDefaultSyncState(): WorkspaceSyncState {
  return {
    mode: DEFAULT_SYNC_MODE,
    queue: createEmptySyncQueue(),
    lastSyncedAt: null,
    lastError: null,
  }
}

export function createSyncOperation(input: {
  entityType: SyncEntityType
  entityId: string | null
  operation: SyncOperationType
  payload: unknown
}): SyncOperation {
  return {
    id: uid('sync'),
    createdAt: now(),
    attempts: 0,
    lastError: null,
    ...input,
  }
}

export function enqueueSyncOperation(
  queue: SyncQueueState,
  operation: SyncOperation,
): SyncQueueState {
  return { operations: [...queue.operations, operation] }
}

export function dequeueSyncOperation(queue: SyncQueueState, id: string): SyncQueueState {
  return { operations: queue.operations.filter((operation) => operation.id !== id) }
}

export function normalizeWorkspaceSyncState(input: unknown): WorkspaceSyncState {
  if (!isRecord(input)) return createDefaultSyncState()
  const mode = input.mode
  const queue = input.queue
  const lastSyncedAt = input.lastSyncedAt
  const lastError = input.lastError

  return {
    mode: mode === 'cloud_synced' || mode === 'cloud_readonly' ? mode : DEFAULT_SYNC_MODE,
    queue: normalizeSyncQueue(queue),
    lastSyncedAt: typeof lastSyncedAt === 'number' && Number.isFinite(lastSyncedAt)
      ? lastSyncedAt
      : null,
    lastError: typeof lastError === 'string' ? lastError : null,
  }
}

function normalizeSyncQueue(input: unknown): SyncQueueState {
  if (!isRecord(input) || !Array.isArray(input.operations)) return createEmptySyncQueue()
  return {
    operations: input.operations.filter(isSyncOperation),
  }
}

function isSyncOperation(input: unknown): input is SyncOperation {
  if (!isRecord(input)) return false
  return (
    typeof input.id === 'string' &&
    typeof input.entityType === 'string' &&
    (typeof input.entityId === 'string' || input.entityId === null) &&
    typeof input.operation === 'string' &&
    typeof input.createdAt === 'number' &&
    Number.isFinite(input.createdAt) &&
    typeof input.attempts === 'number' &&
    Number.isFinite(input.attempts) &&
    (typeof input.lastError === 'string' || input.lastError === null)
  )
}

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === 'object' && input !== null && !Array.isArray(input)
}
