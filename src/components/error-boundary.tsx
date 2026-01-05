'use client'

import { Component, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * Error Boundary Component
 *
 * Captura erros em componentes filhos e exibe uma UI de fallback
 * ao invés de quebrar toda a aplicação.
 *
 * Uso:
 * ```tsx
 * <ErrorBoundary>
 *   <ComponenteQuePodemQuebrar />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error Boundary capturou erro:', error, errorInfo)
    this.props.onError?.(error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-6 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Algo deu errado
            </h2>
          </div>

          <p className="text-gray-600 dark:text-gray-400 text-center mb-6 max-w-md">
            Ocorreu um erro inesperado. Tente recarregar a página ou entre em
            contato com o suporte se o problema persistir.
          </p>

          {this.state.error && (
            <details className="mb-6 w-full max-w-md">
              <summary className="cursor-pointer text-sm text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                Detalhes do erro
              </summary>
              <pre className="mt-2 p-4 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-auto max-h-48">
                {this.state.error.toString()}
              </pre>
            </details>
          )}

          <button
            onClick={this.handleReset}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Tentar novamente
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Error Boundary para páginas inteiras
 */
export function PageErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      onError={(error) => {
        // Aqui você pode adicionar logging para serviços como Sentry
        console.error('Page Error:', error)
      }}
    >
      {children}
    </ErrorBoundary>
  )
}

/**
 * Error Boundary para seções menores
 */
export function SectionErrorBoundary({
  children,
  section,
}: {
  children: ReactNode
  section: string
}) {
  return (
    <ErrorBoundary
      fallback={
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-800 dark:text-red-200">
            Erro ao carregar {section}
          </p>
        </div>
      }
      onError={(error) => {
        console.error(`${section} Error:`, error)
      }}
    >
      {children}
    </ErrorBoundary>
  )
}
