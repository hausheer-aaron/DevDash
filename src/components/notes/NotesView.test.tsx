import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NotesView } from '@/components/notes/NotesView'
import { ConfirmProvider } from '@/components/ui/Confirm'
import { DEFAULT_SETTINGS, useStore } from '@/store/store'
import { dataState, t } from '@/test/factories'
import { createDefaultSyncState } from '@/sync/queue'

function renderNotes() {
  return render(
    <ConfirmProvider>
      <NotesView projectId="proj_1" />
    </ConfirmProvider>,
  )
}

function resetNotes() {
  const note = dataState().notes[0]
  useStore.setState({
    ...dataState({
      notes: [
        { ...note, id: 'note_1', title: 'First note', content: 'First content', updatedAt: t },
        { ...note, id: 'note_2', title: 'Second note', content: 'Second content', updatedAt: t + 1 },
      ],
    }),
    settings: DEFAULT_SETTINGS,
    sync: createDefaultSyncState(),
    lastRepositoryError: null,
  })
}

describe('NotesView autosave', () => {
  beforeEach(() => {
    resetNotes()
  })

  it('does not update the store on every keystroke and saves after the debounce', async () => {
    vi.useFakeTimers()
    renderNotes()
    const editor = screen.getByPlaceholderText('Start writing in Markdown…')

    fireEvent.change(editor, { target: { value: 'Changed draft' } })

    expect(useStore.getState().notes.find((note) => note.id === 'note_2')?.content).toBe(
      'Second content',
    )

    act(() => {
      vi.advanceTimersByTime(599)
    })
    expect(useStore.getState().notes.find((note) => note.id === 'note_2')?.content).toBe(
      'Second content',
    )

    act(() => {
      vi.advanceTimersByTime(1)
    })
    await act(async () => {
      await Promise.resolve()
    })
    expect(useStore.getState().notes.find((note) => note.id === 'note_2')?.content).toBe(
      'Changed draft',
    )
  })

  it('flushes pending changes when switching notes', async () => {
    renderNotes()
    const editor = screen.getByPlaceholderText('Start writing in Markdown…')

    fireEvent.change(editor, { target: { value: 'Flush on switch' } })
    fireEvent.click(screen.getByRole('button', { name: /First note/ }))

    await waitFor(() => {
      expect(useStore.getState().notes.find((note) => note.id === 'note_2')?.content).toBe(
        'Flush on switch',
      )
      expect(screen.getByPlaceholderText('Start writing in Markdown…')).toHaveValue('First content')
    })
  })
})
