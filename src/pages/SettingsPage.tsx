import { useState } from 'react'
import { Database, Globe, Shield, Info, CheckCircle2 } from 'lucide-react'

export default function SettingsPage() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
  const proxyUrl = import.meta.env.VITE_SUPABASE_PROXY_URL as string

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : ''
  const isUsingProxy =
    !currentOrigin.includes('localhost') && !currentOrigin.includes('127.0.0.1')

  const activeUrl = isUsingProxy
    ? `${currentOrigin}/supabase-proxy`
    : proxyUrl || supabaseUrl

  const [copied, setCopied] = useState('')

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(''), 2000)
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Настройки</h1>
        <p className="text-sm text-slate-500 mt-0.5">Конфигурация подключения и системная информация</p>
      </div>

      <div className="space-y-4">
        {/* Connection */}
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
              <Database size={18} className="text-blue-600" />
            </div>
            <h2 className="text-sm font-semibold text-slate-800">База данных Supabase</h2>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-xs text-slate-400 mb-1">Supabase URL</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-slate-50 text-slate-700 px-3 py-2 rounded-lg font-mono truncate">
                  {supabaseUrl || '— не задан —'}
                </code>
                {supabaseUrl && (
                  <button
                    onClick={() => copy(supabaseUrl, 'url')}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium shrink-0"
                  >
                    {copied === 'url' ? '✓ Скопировано' : 'Копировать'}
                  </button>
                )}
              </div>
            </div>

            <div>
              <p className="text-xs text-slate-400 mb-1">Активное подключение</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-slate-50 text-slate-700 px-3 py-2 rounded-lg font-mono truncate">
                  {activeUrl || '— не задан —'}
                </code>
                {activeUrl && (
                  <button
                    onClick={() => copy(activeUrl, 'active')}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium shrink-0"
                  >
                    {copied === 'active' ? '✓ Скопировано' : 'Копировать'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Proxy */}
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Globe size={18} className="text-emerald-600" />
            </div>
            <h2 className="text-sm font-semibold text-slate-800">Прокси для России</h2>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
            <div className={`w-2 h-2 rounded-full shrink-0 ${isUsingProxy ? 'bg-emerald-500' : 'bg-slate-300'}`} />
            <div>
              <p className="text-sm font-medium text-slate-800">
                {isUsingProxy ? 'Прокси активен' : 'Прокси не используется'}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {isUsingProxy
                  ? `Запросы идут через ${currentOrigin}/supabase-proxy → Nginx → Supabase`
                  : 'Прямое подключение к Supabase (localhost)'}
              </p>
            </div>
          </div>

          {proxyUrl && (
            <div className="mt-3">
              <p className="text-xs text-slate-400 mb-1">Railway прокси</p>
              <code className="block text-xs bg-slate-50 text-slate-700 px-3 py-2 rounded-lg font-mono truncate">
                {proxyUrl}
              </code>
            </div>
          )}
        </div>

        {/* RLS */}
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center">
              <Shield size={18} className="text-purple-600" />
            </div>
            <h2 className="text-sm font-semibold text-slate-800">Безопасность (RLS)</h2>
          </div>
          <div className="space-y-2">
            {['clients', 'properties'].map((table) => (
              <div key={table} className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg">
                <span className="text-sm text-slate-700 font-mono">{table}</span>
                <div className="flex items-center gap-1.5 text-emerald-600">
                  <CheckCircle2 size={14} />
                  <span className="text-xs font-medium">RLS включён</span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-3">
            Политика: allow_all — полный доступ без авторизации (для внутреннего использования)
          </p>
        </div>

        {/* About */}
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center">
              <Info size={18} className="text-slate-500" />
            </div>
            <h2 className="text-sm font-semibold text-slate-800">О системе</h2>
          </div>
          <div className="space-y-2 text-sm">
            {[
              { label: 'Версия', value: '1.0.0' },
              { label: 'Frontend', value: 'React 18 + TypeScript + Vite' },
              { label: 'UI', value: 'Tailwind CSS' },
              { label: 'База данных', value: 'Supabase (PostgreSQL)' },
              { label: 'State', value: 'Zustand + React Query' },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between py-1.5 border-b border-slate-50 last:border-0">
                <span className="text-slate-500">{label}</span>
                <span className="text-slate-800 font-medium">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
