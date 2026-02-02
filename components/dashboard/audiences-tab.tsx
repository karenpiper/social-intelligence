'use client'

import { useState } from 'react'
import { Users, MapPin, Lightbulb, AlertCircle, ChevronDown, ChevronRight, TrendingUp, TrendingDown, Minus, Volume2, Volume1, VolumeX } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { CommunitySummary } from '@/lib/types'
import { cn } from '@/lib/utils'

interface AudiencesTabProps {
  communities: CommunitySummary[]
}

const audienceColors: Record<string, string> = {
  enterprise: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  developer: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  hobbyist: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  researcher: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  general: 'bg-secondary text-secondary-foreground',
}

const trendConfig = {
  growing: { label: 'Growing', icon: TrendingUp, className: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30' },
  shrinking: { label: 'Shrinking', icon: TrendingDown, className: 'text-amber-500 bg-amber-500/10 border-amber-500/30' },
  stable: { label: 'Stable', icon: Minus, className: 'text-muted-foreground bg-secondary border-border' },
}

const volumeConfig = {
  loud: { label: 'Loud', icon: Volume2, className: 'text-primary' },
  medium: { label: 'Medium', icon: Volume1, className: 'text-muted-foreground' },
  quiet: { label: 'Quiet', icon: VolumeX, className: 'text-muted-foreground/70' },
}

export function AudiencesTab({ communities }: AudiencesTabProps) {
  const [openIds, setOpenIds] = useState<Set<string>>(new Set())

  const toggleOpen = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (communities.length === 0) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-border bg-card/50 p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground mb-1">Audiences / Communities</p>
          <p>
            Communities are audience segments that Claude identifies from the same posts we use for themes.
            The goal is to define <strong className="text-foreground">who</strong> is discussing each theme,
            then later add deeper intelligence (interests, other topics they discuss, where they gather — e.g. subreddits, hashtags — for scraping or enrichment).
          </p>
          <p className="mt-2 text-xs">
            No communities identified yet. Run the pipeline to collect and analyze posts; Claude will surface audiences discussing AI-industry themes.
          </p>
        </div>
        <Card className="bg-card border-border">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-sm">No audiences or communities in the last 7 days.</p>
            <p className="text-xs text-muted-foreground mt-1">Data will appear after analysis runs.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card/50 p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-1">Audiences / Communities</p>
        <p>
          These are audience segments Claude identified from collected posts — <strong className="text-foreground">who</strong> is discussing the themes we track.
          All communities are stored in the database; this page shows only those <strong className="text-foreground">active in the last 7 days</strong>.
          Use <strong className="text-foreground">trend</strong> (growing / shrinking / stable vs. previous 7 days) and <strong className="text-foreground">volume</strong> (loud / medium / quiet) for decision-making.
          Expand a row for full details.
        </p>
      </div>

      <div className="space-y-2">
        {communities.map((community) => {
          const notes = community.notes_parsed
          const gatheringPlaces = notes?.gathering_places ?? []
          const keyConcerns = notes?.key_concerns ?? []
          const opportunities = notes?.opportunities ?? []
          const isOpen = openIds.has(community.id)
          const trend = community.trend ?? 'stable'
          const volume = community.volume_indicator ?? 'medium'
          const TrendIcon = trendConfig[trend].icon
          const VolumeIcon = volumeConfig[volume].icon

          return (
            <Collapsible
              key={community.id}
              open={isOpen}
              onOpenChange={() => toggleOpen(community.id)}
            >
              <Card className="bg-card border-border">
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className="w-full text-left focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-lg"
                  >
                    <CardHeader className="py-3 px-4 flex flex-row items-center gap-3">
                      <span className="text-muted-foreground shrink-0">
                        {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </span>
                      <div className="flex-1 min-w-0 flex flex-wrap items-center gap-2">
                        <span className="font-medium text-foreground">{community.name}</span>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-xs capitalize',
                            audienceColors[community.audience_type] ?? 'bg-secondary text-secondary-foreground'
                          )}
                        >
                          {community.audience_type}
                        </Badge>
                        {community.primary_platform && (
                          <Badge variant="outline" className="text-xs">
                            {community.primary_platform}
                          </Badge>
                        )}
                        <Badge variant="outline" className={cn('text-xs', trendConfig[trend].className)}>
                          <TrendIcon className="h-3 w-3 mr-1" />
                          {trendConfig[trend].label}
                        </Badge>
                        <Badge variant="outline" className="text-xs text-muted-foreground">
                          <VolumeIcon className="h-3 w-3 mr-1" />
                          {volumeConfig[volume].label}
                        </Badge>
                        {community.estimated_size && (
                          <span className="text-xs text-muted-foreground">{community.estimated_size}</span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        Last seen: {new Date(community.last_activity_at).toLocaleDateString()}
                      </span>
                    </CardHeader>
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0 px-4 pb-4 border-t border-border space-y-4">
                    {community.description && (
                      <p className="text-sm text-muted-foreground pt-3">{community.description}</p>
                    )}

                    {community.sentiment_toward_claude != null && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Sentiment toward Claude:</span>
                        <span
                          className={cn(
                            'font-medium',
                            community.sentiment_toward_claude >= 0 ? 'text-emerald-400' : 'text-red-400'
                          )}
                        >
                          {community.sentiment_toward_claude.toFixed(2)}
                        </span>
                      </div>
                    )}

                    {keyConcerns.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-foreground mb-1 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Key concerns
                        </p>
                        <ul className="text-xs text-muted-foreground list-disc list-inside space-y-0.5">
                          {keyConcerns.slice(0, 5).map((c, i) => (
                            <li key={i}>{c}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {opportunities.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-foreground mb-1 flex items-center gap-1">
                          <Lightbulb className="h-3 w-3" />
                          Opportunities
                        </p>
                        <ul className="text-xs text-muted-foreground list-disc list-inside space-y-0.5">
                          {opportunities.slice(0, 5).map((o, i) => (
                            <li key={i}>{o}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {gatheringPlaces.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-foreground mb-1 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          Where they gather (seeds for future intel)
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {gatheringPlaces.map((g, i) => (
                            <Badge key={i} variant="secondary" className="text-xs font-normal">
                              {g}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {community.key_topics.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Topics: {community.key_topics.slice(0, 5).join(', ')}
                        {community.key_topics.length > 5 ? '…' : ''}
                      </p>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          )
        })}
      </div>
    </div>
  )
}
