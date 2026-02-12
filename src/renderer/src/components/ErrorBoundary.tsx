import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  handleReload = (): void => {
    window.location.reload()
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            gap: 16,
            padding: 32,
            background: 'var(--bg-primary)',
            color: 'var(--text-primary)'
          }}
        >
          <span style={{ fontSize: 32 }}>⚠</span>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-heading)' }}>
            Something went wrong
          </h2>
          <p
            style={{
              fontSize: 13,
              color: 'var(--text-secondary)',
              maxWidth: 400,
              textAlign: 'center',
              lineHeight: 1.5
            }}
          >
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button
            onClick={this.handleReload}
            style={{
              marginTop: 8,
              padding: '8px 20px',
              border: '1px solid var(--border-button)',
              borderRadius: 8,
              background: 'var(--accent)',
              color: '#fff',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 500
            }}
          >
            Reload
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
