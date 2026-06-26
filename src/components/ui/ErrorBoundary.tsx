import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RotateCcw, RefreshCw } from 'lucide-react'
import { Button } from './Button'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/**
 * App-root error boundary. Catches render/lifecycle errors anywhere in the tree
 * and shows a recoverable fallback instead of white-screening the SPA. Since
 * state is persisted locally, "Reload" is the reliable escape hatch when an
 * error is deterministic (e.g. malformed imported data).
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // A telemetry/logging hook would live here in a real deployment.
    console.error('Unhandled error:', error, info)
  }

  private handleReset = () => this.setState({ error: null })
  private handleReload = () => window.location.reload()

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div className="flex min-h-screen items-center justify-center bg-bg p-6 text-fg">
        <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 text-center shadow-elevated">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-danger/10 text-danger">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-lg font-semibold tracking-tight">Something went wrong</h1>
          <p className="mt-1.5 text-sm text-muted">
            The app hit an unexpected error. Your data is stored locally and is safe.
          </p>
          {error.message && (
            <pre className="scrollbar-thin mt-3 max-h-32 overflow-auto rounded-lg border border-border bg-bg-subtle p-3 text-left text-xs text-faint">
              {error.message}
            </pre>
          )}
          <div className="mt-5 flex justify-center gap-2">
            <Button variant="secondary" onClick={this.handleReset}>
              <RotateCcw className="h-4 w-4" /> Try again
            </Button>
            <Button variant="primary" onClick={this.handleReload}>
              <RefreshCw className="h-4 w-4" /> Reload app
            </Button>
          </div>
        </div>
      </div>
    )
  }
}
