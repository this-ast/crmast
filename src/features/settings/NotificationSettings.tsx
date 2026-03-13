import { useState, useEffect } from 'react'
import { Card, CardHeader, Button } from '@/components/ui'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

interface NotificationToggle {
  id: string
  label: string
  description: string
  enabled: boolean
}

const defaultToggles: NotificationToggle[] = [
  {
    id: 'new_client',
    label: 'Новые клиенты',
    description: 'Уведомления о новых заявках и клиентах',
    enabled: true,
  },
  {
    id: 'deal_status',
    label: 'Статус сделки',
    description: 'Уведомления при изменении статуса сделки',
    enabled: true,
  },
  {
    id: 'price_change',
    label: 'Изменение цены',
    description: 'Уведомления при изменении цены объекта',
    enabled: true,
  },
  {
    id: 'reminders',
    label: 'Напоминания',
    description: 'Напоминания о запланированных событиях',
    enabled: true,
  },
  {
    id: 'email_notifications',
    label: 'Email уведомления',
    description: 'Дублирование уведомлений на email',
    enabled: false,
  },
]

export function NotificationSettings() {
  const { profile, refreshProfile } = useAuth()
  const [toggles, setToggles] = useState(defaultToggles)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const prefs = (profile?.settings as Record<string, boolean>) || {}
    setToggles((prev) =>
      prev.map((t) => ({
        ...t,
        enabled: prefs[t.id] !== undefined ? prefs[t.id] : t.enabled,
      }))
    )
  }, [profile?.settings])

  const handleToggle = (id: string) => {
    setToggles((prev) =>
      prev.map((t) => (t.id === id ? { ...t, enabled: !t.enabled } : t))
    )
    setSaved(false)
  }

  const handleSave = async () => {
    if (!profile) return
    setSaving(true)
    const prefs: Record<string, boolean> = {}
    toggles.forEach((t) => { prefs[t.id] = t.enabled })

    const currentSettings = (profile.settings as Record<string, unknown>) || {}
    await supabase
      .from('profiles')
      .update({ settings: { ...currentSettings, ...prefs } })
      .eq('id', profile.id)

    await refreshProfile()
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <Card>
      <CardHeader
        title="Уведомления"
        description="Настройте какие уведомления вы хотите получать"
      />

      <div className="space-y-4">
        {toggles.map((toggle) => (
          <div
            key={toggle.id}
            className="flex items-center justify-between rounded-lg border border-border p-4"
          >
            <div>
              <p className="text-sm font-medium text-text-primary">
                {toggle.label}
              </p>
              <p className="text-sm text-text-secondary">
                {toggle.description}
              </p>
            </div>
            <button
              onClick={() => handleToggle(toggle.id)}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                toggle.enabled ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform shadow-sm ${
                  toggle.enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-end gap-3">
        {saved && (
          <span className="text-sm text-green-600">Сохранено!</span>
        )}
        <Button onClick={handleSave} loading={saving}>
          Сохранить
        </Button>
      </div>
    </Card>
  )
}
