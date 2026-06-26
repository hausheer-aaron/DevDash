import { Navigate } from 'react-router-dom'
import { useStore } from '@/store/store'

/** The index route ("/") redirects to the user's configured default view. */
export function IndexRedirect() {
  const defaultView = useStore((s) => s.settings.defaultView)
  return <Navigate to={defaultView === 'projects' ? '/projects' : '/dashboard'} replace />
}
