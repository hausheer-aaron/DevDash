import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SettingsPage } from '@/pages/SettingsPage'
import { ConfirmProvider } from '@/components/ui/Confirm'
import { ToastProvider } from '@/components/ui/Toast'
import { DEFAULT_SETTINGS, useStore } from '@/store/store'
import { useAuthStore } from '@/store/auth'
import { dataState, exportBundle } from '@/test/factories'
import { downloadJson } from '@/lib/utils'
import { createDefaultSyncState } from '@/sync/queue'

vi.mock('@/lib/utils', async () => {
  const actual = await vi.importActual<typeof import('@/lib/utils')>('@/lib/utils')
  return { ...actual, downloadJson: vi.fn() }
})

function renderSettings() {
  return render(
    <ToastProvider>
      <ConfirmProvider>
        <SettingsPage />
      </ConfirmProvider>
    </ToastProvider>,
  )
}

function resetStore() {
  useStore.setState({
    ...dataState(),
    settings: DEFAULT_SETTINGS,
    sync: createDefaultSyncState(),
    lastRepositoryError: null,
  })
  useAuthStore.setState({
    mode: 'local_only',
    configured: false,
    loading: false,
    userId: null,
    userEmail: null,
    notice: null,
    error: null,
    signIn: vi.fn().mockResolvedValue(undefined),
    signUp: vi.fn().mockResolvedValue(undefined),
    signOut: vi.fn().mockResolvedValue(undefined),
  })
}

describe('SettingsPage import behavior', () => {
  beforeEach(() => {
    resetStore()
    vi.mocked(downloadJson).mockReset()
  })

  it('creates a backup before replacing existing data', async () => {
    renderSettings()
    const incoming = exportBundle({
      projects: [{ ...dataState().projects[0], id: 'proj_replacement', name: 'Replacement' }],
      tasks: [],
      notes: [],
      snippets: [],
      commands: [],
      links: [],
      resources: [],
    })
    const file = new File([JSON.stringify(incoming)], 'devdash.json', {
      type: 'application/json',
    })

    const input = document.querySelector<HTMLInputElement>('input[type="file"]')
    expect(input).not.toBeNull()
    fireEvent.change(input!, { target: { files: [file] } })

    await screen.findByText('Import data')
    fireEvent.click(screen.getByRole('button', { name: 'Replace all' }))

    await waitFor(() => {
      expect(vi.mocked(downloadJson)).toHaveBeenCalledWith(
        expect.stringContaining('devdash-backup-before-import'),
        expect.objectContaining({ projects: expect.any(Array) }),
      )
    })
    await waitFor(() => {
      expect(useStore.getState().projects.map((p) => p.id)).toEqual(['proj_replacement'])
    })
  })

  it('shows useful errors for invalid imports', async () => {
    renderSettings()
    const file = new File(['not json'], 'broken.json', { type: 'application/json' })
    const input = document.querySelector<HTMLInputElement>('input[type="file"]')

    fireEvent.change(input!, { target: { files: [file] } })

    expect(await screen.findByText('Import failed')).toBeInTheDocument()
    expect(screen.getByText('That file is not valid JSON.')).toBeInTheDocument()
    expect(useStore.getState().projects[0].id).toBe('proj_1')
  })
})

describe('SettingsPage auth status', () => {
  beforeEach(() => {
    resetStore()
  })

  it('shows local-only mode when Supabase auth is not configured', () => {
    renderSettings()

    expect(screen.getByText('Local-only mode')).toBeInTheDocument()
    expect(screen.getByText('Supabase is not configured. DevDash remains fully local.')).toBeInTheDocument()
  })

  it('submits email and password login when auth is configured', async () => {
    const signIn = vi.fn().mockResolvedValue(undefined)
    useAuthStore.setState({
      configured: true,
      mode: 'signed_out',
      signIn,
      signUp: vi.fn().mockResolvedValue(undefined),
    })
    renderSettings()

    fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
      target: { value: 'user@example.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'password123' },
    })
    const buttons = screen.getAllByRole('button', { name: 'Sign in' })
    fireEvent.click(buttons[1])

    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith('user@example.com', 'password123')
    })
  })

  it('validates password confirmation during sign up', async () => {
    const signUp = vi.fn().mockResolvedValue(undefined)
    useAuthStore.setState({
      configured: true,
      mode: 'signed_out',
      signIn: vi.fn().mockResolvedValue(undefined),
      signUp,
    })
    renderSettings()

    fireEvent.click(screen.getAllByRole('button', { name: 'Create account' })[0])
    fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
      target: { value: 'user@example.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'password123' },
    })
    fireEvent.change(screen.getByPlaceholderText('Confirm password'), {
      target: { value: 'password321' },
    })
    fireEvent.click(screen.getAllByRole('button', { name: 'Create account' })[1])

    expect(await screen.findByText('Passwords do not match.')).toBeInTheDocument()
    expect(signUp).not.toHaveBeenCalled()
  })
})
