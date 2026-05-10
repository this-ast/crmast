import { Component, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error) {
    console.error('[ErrorBoundary]', error)
  }

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
          <div className="max-w-md w-full bg-white rounded-2xl border border-red-100 p-8 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertTriangle size={20} className="text-red-600" />
              </div>
              <h1 className="text-lg font-semibold text-slate-900">Ошибка приложения</h1>
            </div>
            <p className="text-sm text-slate-600 mb-2">
              Произошла неожиданная ошибка. Попробуйте обновить страницу.
            </p>
            <details className="mb-6">
              <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-600 select-none">
                Подробности
              </summary>
              <pre className="mt-2 text-[11px] text-red-600 bg-red-50 rounded-lg p-3 overflow-auto whitespace-pre-wrap break-all">
                {this.state.error.message}
                {this.state.error.stack ? '\n\n' + this.state.error.stack : ''}
              </pre>
            </details>
            <button
              onClick={() => {
                this.setState({ error: null })
                window.location.reload()
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw size={14} />
              Перезагрузить страницу
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
