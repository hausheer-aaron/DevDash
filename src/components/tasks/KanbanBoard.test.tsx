import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { KanbanBoard } from '@/components/tasks/KanbanBoard'
import { ConfirmProvider } from '@/components/ui/Confirm'
import { DEFAULT_SETTINGS, useStore } from '@/store/store'
import { dataState } from '@/test/factories'

function renderBoard() {
  return render(
    <ConfirmProvider>
      <KanbanBoard projectId="proj_1" />
    </ConfirmProvider>,
  )
}

describe('KanbanBoard', () => {
  beforeEach(() => {
    useStore.setState({
      ...dataState(),
      settings: { ...DEFAULT_SETTINGS, showCompletedTasks: false },
    })
  })

  it('keeps task completion intuitive when completed tasks are hidden', () => {
    renderBoard()

    expect(screen.queryByRole('heading', { name: 'Done' })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Complete' })).toBeInTheDocument()
    expect(screen.getByText('Drop here to mark done')).toBeInTheDocument()
  })
})
