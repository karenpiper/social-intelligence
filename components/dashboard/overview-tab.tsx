import { StatCards } from './stat-cards'
import { SentimentChart } from './sentiment-chart'
import { PlatformSidebar } from './platform-sidebar'
import { TrendingThemes } from './trending-themes'
import { DashboardData } from '@/lib/types'

interface OverviewTabProps {
  data: DashboardData
}

export function OverviewTab({ data }: OverviewTabProps) {
  const totalPosts = Object.values(data.platformCounts).reduce((a, b) => a + b, 0)
  
  const avgSentiment =
    data.sentimentTrend.length > 0
      ? data.sentimentTrend.reduce((sum, item) => sum + item.avg_sentiment, 0) /
        data.sentimentTrend.length
      : 0

  const topCompetitor =
    data.competitorStats.length > 0
      ? [...data.competitorStats].sort((a, b) => b.mentions - a.mentions)[0]
          .competitor
      : ''

  return (
    <div className="space-y-6">
      <StatCards
        totalPosts={totalPosts}
        avgSentiment={avgSentiment}
        activeAlerts={data.alerts.length}
        topCompetitor={topCompetitor}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <SentimentChart data={data.sentimentTrend} />
        <div className="space-y-4">
          <PlatformSidebar platformCounts={data.platformCounts} />
          <TrendingThemes themes={data.themes} />
        </div>
      </div>
    </div>
  )
}
