'use client'

import { X, AlertTriangle, Info, AlertCircle, Flame } from 'lucide-react'
import { Alert } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface AlertsBannerProps {
  alerts: Alert[]
  onDismiss: (alertId: string) => void
}

const severityConfig = {
  low: {
    bg: 'bg-blue-500/10 border-blue-500/30',
    text: 'text-blue-400',
    icon: Info,
  },
  medium: {
    bg: 'bg-yellow-500/10 border-yellow-500/30',
    text: 'text-yellow-400',
    icon: AlertTriangle,
  },
  high: {
    bg: 'bg-orange-500/10 border-orange-500/30',
    text: 'text-orange-400',
    icon: AlertCircle,
  },
  critical: {
    bg: 'bg-red-500/10 border-red-500/30',
    text: 'text-red-400',
    icon: Flame,
  },
}

export function AlertsBanner({ alerts, onDismiss }: AlertsBannerProps) {
  if (alerts.length === 0) return null

  return (
    <div className="space-y-2 mb-6">
      <p className="text-xs text-muted-foreground mb-2" title="Alerts are triggered by Claude when thresholds or patterns are met (e.g. emerging theme, sentiment shift).">
        Alerts: triggered by Claude from analyzed posts. Severity: Low (info) · Medium · High · Critical.
      </p>
      {alerts.map((alert) => {
        const config = severityConfig[alert.severity]
        const Icon = config.icon

        return (
          <div
            key={alert.id}
            className={cn(
              'flex items-start gap-3 p-3 rounded-lg border',
              config.bg
            )}
          >
            <Icon className={cn('h-5 w-5 mt-0.5 shrink-0', config.text)} />
            <div className="flex-1 min-w-0">
              <p className={cn('font-medium text-sm', config.text)}>
                {alert.title}
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {alert.description}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0 hover:bg-white/10"
              onClick={() => onDismiss(alert.id)}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Dismiss alert</span>
            </Button>
          </div>
        )
      })}
    </div>
  )
}
