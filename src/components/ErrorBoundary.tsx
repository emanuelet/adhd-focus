import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
            <h2 className="text-lg font-semibold text-[var(--text)] mb-2">Something went wrong</h2>
            <p className="text-sm text-[var(--muted)] mb-4">
              Try refreshing the page. If the problem persists, check your connection.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-5 py-2 rounded-lg text-sm font-medium bg-[var(--accent)] text-[var(--bg)] hover:brightness-110 cursor-pointer border-0"
            >
              Reload
            </button>
          </div>
        )
      )
    }
    return this.props.children
  }
}
