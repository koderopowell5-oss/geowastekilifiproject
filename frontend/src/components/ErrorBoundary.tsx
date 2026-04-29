import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('React Error Boundary caught:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: '#f3f4f6',
          padding: '20px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '30px',
            maxWidth: '500px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            textAlign: 'center',
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '20px',
            }}>
              ⚠️
            </div>
            
            <h1 style={{
              color: '#1f2937',
              fontSize: '24px',
              fontWeight: '700',
              margin: '0 0 10px 0',
            }}>
              Something went wrong
            </h1>
            
            <p style={{
              color: '#6b7280',
              fontSize: '14px',
              margin: '10px 0',
              lineHeight: '1.5',
            }}>
              The app encountered an unexpected error.
            </p>
            
            {this.state.error && (
              <details style={{
                marginTop: '20px',
                padding: '15px',
                backgroundColor: '#f9fafb',
                borderRadius: '4px',
                cursor: 'pointer',
                textAlign: 'left',
              }}>
                <summary style={{
                  color: '#374151',
                  fontWeight: '500',
                  userSelect: 'none',
                }}>
                  Error details
                </summary>
                <pre style={{
                  marginTop: '10px',
                  fontSize: '12px',
                  color: '#dc2626',
                  overflow: 'auto',
                  maxHeight: '200px',
                  fontFamily: 'monospace',
                }}>
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
            
            <div style={{
              marginTop: '20px',
              display: 'flex',
              gap: '10px',
              justifyContent: 'center',
            }}>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#16a34a',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                }}
              >
                Try again
              </button>
              
              <button
                onClick={() => {
                  window.location.href = '/';
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                }}
              >
                Reload app
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
