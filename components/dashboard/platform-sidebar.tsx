import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface PlatformSidebarProps {
  platformCounts: Record<string, number>
}

const platformIcons: Record<string, string> = {
  reddit: '🔴',
  hackernews: '🟠',
  bluesky: '🔵',
}

const platformLabels: Record<string, string> = {
  reddit: 'Reddit',
  hackernews: 'Hacker News',
  bluesky: 'Bluesky',
}

export function PlatformSidebar({ platformCounts }: PlatformSidebarProps) {
  const total = Object.values(platformCounts).reduce((a, b) => a + b, 0)

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Platform Mix
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1" title="Post count by source in the last 24 hours (collected posts matching AI-industry keywords).">
          Post count by source (last 24h). 🔴 Reddit · 🟠 Hacker News · 🔵 Bluesky
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {Object.entries(platformCounts).map(([platform, count]) => {
          const percentage = total > 0 ? (count / total) * 100 : 0
          return (
            <div key={platform} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span>{platformIcons[platform] || '⚪'}</span>
                  <span className="text-foreground">
                    {platformLabels[platform] || platform}
                  </span>
                </span>
                <span className="text-muted-foreground font-mono">
                  {count.toLocaleString()}
                </span>
              </div>
              <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    platform === 'reddit' && 'bg-red-500',
                    platform === 'hackernews' && 'bg-orange-500',
                    platform === 'bluesky' && 'bg-blue-500'
                  )}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
