import { MessageSquare, TrendingUp, Bell, Building2, HelpCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface StatCardsProps {
  totalPosts: number
  avgSentiment: number
  activeAlerts: number
  topCompetitor: string
}

const statDefinitions = [
  {
    label: 'Posts (24h)',
    help: 'Number of posts collected from Reddit, Hacker News, and Bluesky in the last 24 hours (matching AI-industry keywords).',
  },
  {
    label: 'Avg Sentiment',
    help: 'Average sentiment score (-1 = negative, 0 = neutral, 1 = positive) across analyzed posts. Computed by Claude from post content.',
  },
  {
    label: 'Active Alerts',
    help: 'Unacknowledged alerts triggered by Claude when thresholds or patterns are met (e.g. emerging theme, sentiment shift).',
  },
  {
    label: 'Top Competitor',
    help: 'Competitor (e.g. Claude, ChatGPT, Gemini) with the most mentions in analyzed posts (share of voice).',
  },
]

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
    <TooltipProvider>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Card key={stat.label} className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className={cn('h-4 w-4', stat.color)} aria-hidden />
                <span className="text-xs text-muted-foreground uppercase tracking-wide">
                  {stat.label}
                </span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground focus:outline-none"
                      aria-label={`What does ${stat.label} mean?`}
                    >
                      <HelpCircle className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs text-xs">
                    {statDefinitions[i].help}
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className={cn('text-2xl font-semibold truncate', stat.color)}>
                {stat.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </TooltipProvider>
  )
}
