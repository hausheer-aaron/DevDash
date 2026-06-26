import { useNavigate } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'

export function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <PageContainer>
      <div className="flex min-h-[60vh] items-center justify-center">
        <EmptyState
          icon={Compass}
          title="Page not found"
          description="The page you're looking for doesn't exist or has moved."
          action={
            <Button variant="primary" onClick={() => navigate('/dashboard')}>
              Back to dashboard
            </Button>
          }
        />
      </div>
    </PageContainer>
  )
}
