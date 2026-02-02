import { MessageSquare, TrendingUp, Bell, Building2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatCardsProps {
  totalPosts: number
  avgSentiment: number
  activeAlerts: number
  topCompetitor: string
}

export function StatCards({
  totalPosts,
  avgSentiment,
  activeAlerts,
  topCompetitor,
}: StatCardsProps) {
  const stats = [
    {
      label: 'Posts (24h)',
      value: totalPosts.toLocaleString(),
      icon: MessageSquare,
      color: 'text-primary',
    },
    {
      label: 'Avg Sentiment',
      value: avgSentiment.toFixed(2),
      icon: TrendingUp,
      color: avgSentiment >= 0 ? 'text-emerald-400' : 'text-red-400',
    },
    {
      label: 'Active Alerts',
      value: activeAlerts.toString(),
      icon: Bell,
      color: activeAlerts > 0 ? 'text-orange-400' : 'text-muted-foreground',
    },
    {
      label: 'Top Competitor',
      value: topCompetitor || 'N/A',
      icon: Building2,
      color: 'text-primary',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className={cn('h-4 w-4', stat.color)} />
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                {stat.label}
              </span>
            </div>
            <p className={cn('text-2xl font-semibold truncate', stat.color)}>
              {stat.value}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
