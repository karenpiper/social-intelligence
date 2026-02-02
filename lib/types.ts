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
}

export interface CompetitorStat {
  competitor: string;
  mentions: number;
  avgSentiment: number;
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
  lastUpdated: string;
}

export interface Digest {
  id: string;
  type: 'daily' | 'weekly';
  key_insights: string[];
  content: string;
  created_at: string;
}
