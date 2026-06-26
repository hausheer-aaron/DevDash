import { Code2 } from 'lucide-react'
import { useStore } from '@/store/store'
import { PageContainer, PageHeader } from '@/components/layout/PageHeader'
import { SnippetsView } from '@/components/snippets/SnippetsView'
import { pluralize } from '@/lib/utils'

export function SnippetsPage() {
  const count = useStore((s) => s.snippets.length)
  return (
    <PageContainer>
      <PageHeader
        title="Snippets"
        subtitle={`${pluralize(count, 'snippet')} across all projects`}
        icon={
          <div className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-surface text-accent">
            <Code2 className="h-5 w-5" />
          </div>
        }
      />
      <div className="mt-6">
        <SnippetsView />
      </div>
    </PageContainer>
  )
}
