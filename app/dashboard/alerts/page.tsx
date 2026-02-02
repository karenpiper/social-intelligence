'use client'

import { useCallback } from 'react'
import Link from 'next/link'
import useSWR, { mutate } from 'swr'
import { ArrowLeft, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AlertsBanner } from '@/components/dashboard/alerts-banner'
import { Alert } from '@/lib/types'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

function mapAlerts(raw: Array<{ id?: string; alert_type?: string; severity?: string; title?: string; description?: string; created_at?: string }>): Alert[] {
  return (raw ?? []).map((a) => ({
    id: a.id ?? '',
    alert_type: a.alert_type ?? 'info',
    severity: (a.severity ?? 'medium') as Alert['severity'],
    title: a.title ?? '',
    description: a.description ?? '',
    created_at: a.created_at ?? new Date().toISOString(),
  }))
}

export default function AlertsPage() {
  const { data, error, isLoading } = useSWR<{ success?: boolean; alerts?: unknown[] }>('/api/alerts', fetcher)
  const alerts = mapAlerts((data?.alerts ?? []) as Parameters<typeof mapAlerts>[0])

  const handleDismiss = useCallback(async (alertId: string) => {
    try {
      await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId }),
      })
      await mutate('/api/alerts')
      await mutate('/api/dashboard')
    } catch (e) {
      console.error('Failed to dismiss alert', e)
    }
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" aria-label="Back to dashboard">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-semibold text-foreground">Alerts</h1>
            </div>
          </div>
        </header>

        <p className="text-sm text-muted-foreground mb-6" title="Alerts are triggered by Claude when thresholds or patterns are met (e.g. emerging theme, sentiment shift).">
          Triggered by Claude from analyzed posts. Severity: Low (info) · Medium · High · Critical.
        </p>

        {error && (
          <p className="text-destructive text-sm">Failed to load alerts.</p>
        )}
        {isLoading && (
          <p className="text-muted-foreground text-sm">Loading…</p>
        )}
        {!error && !isLoading && alerts.length === 0 && (
          <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground text-sm">
            No active alerts.
          </div>
        )}
        {!error && !isLoading && alerts.length > 0 && (
          <AlertsBanner alerts={alerts} onDismiss={handleDismiss} />
        )}
      </div>
    </div>
  )
}
