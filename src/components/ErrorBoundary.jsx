import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('[JHAYRA] Unhandled component error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1.25rem',
          fontFamily: 'var(--fs, sans-serif)',
          padding: '2rem',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '1rem', color: 'var(--ink, #1A1208)', lineHeight: 1.6, maxWidth: '380px' }}>
            Something went wrong on this page. Please refresh to continue.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '.65rem 1.75rem',
              background: 'var(--gold, #B68D40)',
              color: '#fff',
              border: 'none',
              borderRadius: '999px',
              cursor: 'pointer',
              fontSize: '.9rem',
              fontWeight: 600,
            }}
          >
            Refresh Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
