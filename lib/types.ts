export interface SentimentTrendItem {
  hour: string;
  platform_id: string;
  avg_sentiment: number;
  total_volume: number;
}

export interface Theme {
  name: string;
  description: string;
  frequency: number;
  sentiment_avg: number;
  audience_type: string;
  is_emerging: boolean;
  /** Post IDs cited for this theme (from Claude analysis). Use GET /api/posts?ids=... to fetch details. */
  example_post_ids?: string[];
  /** Last time this theme was seen in analyzed batches. */
  last_seen_at?: string;
}

export interface CompetitorStat {
  competitor: string;
  mentions: number;
  avgSentiment: number;
}

/** Audience/community segment identified from themes (who discusses them). Foundation for deeper intel (interests, scrape sources). */
export interface CommunitySummary {
  id: string;
  name: string;
  description: string | null;
  primary_platform: string | null;
  audience_type: string;
  estimated_size: string | null;
  key_topics: string[];
  sentiment_toward_claude: number | null;
  last_activity_at: string;
  /** key_concerns, opportunities, gathering_places (for future scraping/intel) */
  notes_parsed?: { key_concerns?: string[]; opportunities?: string[]; gathering_places?: string[] };
  /** Decision-making: trend vs previous 7-day period. */
  trend?: 'growing' | 'shrinking' | 'stable';
  /** Decision-making: volume / loudness (from size or activity). */
  volume_indicator?: 'loud' | 'medium' | 'quiet';
}

export interface Alert {
  id: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  created_at: string;
}

export interface DashboardData {
  sentimentTrend: SentimentTrendItem[];
  themes: Theme[];
  competitorStats: CompetitorStat[];
  alerts: Alert[];
  platformCounts: Record<string, number>;
  /** Audiences/communities discussing themes (foundation for deeper intel). */
  communities?: CommunitySummary[];
  /** When this dashboard payload was generated (server time). */
  lastUpdated: string;
  /** Timestamp of the most recent post in the database (data through / auditability). */
  latestPostAt?: string;
}

/** Post summary returned by GET /api/posts?ids=... for theme drill-down. */
export interface PostSummary {
  id: string;
  url: string | null;
  platform_id: string;
  posted_at: string;
  content_snippet: string;
  author: string;
}

export interface Digest {
  id: string;
  type: 'daily' | 'weekly';
  key_insights: string[];
  content: string;
  created_at: string;
}
