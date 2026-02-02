'use client'

import { Users, MapPin, Lightbulb, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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

export function AudiencesTab({ communities }: AudiencesTabProps) {
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
          Each community has a primary platform, key concerns, and opportunities. Where available, we store &quot;gathering places&quot; (e.g. subreddits, hashtags) as seeds for future scraping or deeper intel (interests, other topics).
        </p>
        <p className="mt-2 text-xs">
          Future: enrich these with more intelligence (scraping, interests, related topics) to prioritize and understand each community better.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {communities.map((community) => {
          const notes = community.notes_parsed
          const gatheringPlaces = notes?.gathering_places ?? []
          const keyConcerns = notes?.key_concerns ?? []
          const opportunities = notes?.opportunities ?? []

          return (
            <Card key={community.id} className="bg-card border-border">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <CardTitle className="text-base font-medium text-foreground">
                    {community.name}
                  </CardTitle>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
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
                  {community.estimated_size && (
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      {community.estimated_size}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {community.description && (
                  <p className="text-sm text-muted-foreground">{community.description}</p>
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
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Topics: {community.key_topics.slice(0, 5).join(', ')}
                      {community.key_topics.length > 5 ? '…' : ''}
                    </p>
                  </div>
                )}

                <p className="text-xs text-muted-foreground pt-2 border-t border-border">
                  Last seen: {new Date(community.last_activity_at).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
