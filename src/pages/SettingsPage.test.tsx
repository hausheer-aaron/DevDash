import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SettingsPage } from '@/pages/SettingsPage'
import { ConfirmProvider } from '@/components/ui/Confirm'
import { ToastProvider } from '@/components/ui/Toast'
import { DEFAULT_SETTINGS, useStore } from '@/store/store'
import { dataState, exportBundle } from '@/test/factories'
import { downloadJson } from '@/lib/utils'

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
    expect(useStore.getState().projects.map((p) => p.id)).toEqual(['proj_replacement'])
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
