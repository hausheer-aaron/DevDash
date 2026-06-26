import { TerminalSquare } from 'lucide-react'
import { useStore } from '@/store/store'
import { PageContainer, PageHeader } from '@/components/layout/PageHeader'
import { CommandsView } from '@/components/commands/CommandsView'
import { pluralize } from '@/lib/utils'

export function CommandsPage() {
  const count = useStore((s) => s.commands.length)
  return (
    <PageContainer>
      <PageHeader
        title="Commands"
        subtitle={`${pluralize(count, 'command')} across all projects`}
        icon={
          <div className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-surface text-accent">
            <TerminalSquare className="h-5 w-5" />
          </div>
        }
      />
      <div className="mt-6">
        <CommandsView />
      </div>
    </PageContainer>
  )
}
