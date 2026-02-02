import { Flame } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Theme } from '@/lib/types'
import { cn } from '@/lib/utils'

interface TrendingThemesProps {
  themes: Theme[]
}

export function TrendingThemes({ themes }: TrendingThemesProps) {
  const topThemes = themes.slice(0, 8)

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Trending Themes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {topThemes.map((theme) => (
            <Badge
              key={theme.name}
              variant="outline"
              className={cn(
                'px-3 py-1.5 text-sm',
                theme.is_emerging &&
                  'border-primary/50 bg-primary/10 text-primary'
              )}
            >
              {theme.is_emerging && (
                <Flame className="h-3 w-3 mr-1 text-primary" />
              )}
              {theme.name}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
