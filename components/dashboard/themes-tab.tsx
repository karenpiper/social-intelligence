import { TrendingUp, TrendingDown, Flame } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Theme } from '@/lib/types'
import { cn } from '@/lib/utils'

interface ThemesTabProps {
  themes: Theme[]
}

const audienceColors: Record<string, string> = {
  enterprise: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  developer: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  hobbyist: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  researcher: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
}

export function ThemesTab({ themes }: ThemesTabProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {themes.map((theme) => (
        <Card
          key={theme.name}
          className={cn(
            'bg-card border-border transition-colors hover:border-border/80',
            theme.is_emerging && 'border-primary/30'
          )}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium text-foreground truncate">
                    {theme.name}
                  </h3>
                  {theme.is_emerging && (
                    <Badge
                      variant="outline"
                      className="bg-primary/10 text-primary border-primary/30 text-xs shrink-0"
                    >
                      <Flame className="h-3 w-3 mr-1" />
                      EMERGING
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {theme.description}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4">
              <div>
                <p className="text-3xl font-semibold text-foreground">
                  {theme.frequency.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">mentions</p>
              </div>

              <div className="text-right">
                <div
                  className={cn(
                    'flex items-center gap-1 text-sm font-medium',
                    theme.sentiment_avg >= 0 ? 'text-emerald-400' : 'text-red-400'
                  )}
                >
                  {theme.sentiment_avg >= 0 ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  {theme.sentiment_avg.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">sentiment</p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-border">
              <Badge
                variant="outline"
                className={cn(
                  'text-xs capitalize',
                  audienceColors[theme.audience_type] ||
                    'bg-secondary text-secondary-foreground'
                )}
              >
                {theme.audience_type}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
