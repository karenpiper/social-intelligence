'use client';

/**
 * Social Intelligence Dashboard
 * 
 * Drop this into your v0/Next.js project.
 * It fetches data from the API routes and displays:
 * - Sentiment trend over time
 * - Top themes
 * - Competitor share of voice
 * - Active alerts
 * - Latest digest summary
 */

import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// Types
interface DashboardData {
  sentimentTrend: Array<{
    hour: string;
    platform_id: string;
    avg_sentiment: number;
    total_volume: number;
  }>;
  themes: Array<{
    name: string;
    description: string;
    frequency: number;
    sentiment_avg: number;
    audience_type: string;
    is_emerging: boolean;
  }>;
  competitorStats: Array<{
    competitor: string;
    mentions: number;
    avgSentiment: number;
  }>;
  alerts: Array<{
    id: string;
    alert_type: string;
    severity: string;
    title: string;
    description: string;
    created_at: string;
  }>;
  platformCounts: Record<string, number>;
  lastUpdated: string;
}

interface Digest {
  content: string;
  summary: string;
  key_insights: string[];
  generated_at: string;
}

// Colors
const COLORS = {
  claude: '#D97706',
  chatgpt: '#10B981',
  gemini: '#3B82F6',
  llama: '#8B5CF6',
  mistral: '#EC4899',
  other: '#6B7280',
  positive: '#10B981',
  neutral: '#6B7280',
  negative: '#EF4444'
};

const SEVERITY_COLORS = {
  low: 'bg-blue-100 text-blue-800 border-blue-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  critical: 'bg-red-100 text-red-800 border-red-200'
};

const PLATFORM_ICONS: Record<string, string> = {
  reddit: '🔴',
  hackernews: '🟠',
  bluesky: '🦋',
  twitter: '𝕏',
  linkedin: '🔵'
};

export default function SocialIntelligenceDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [digest, setDigest] = useState<Digest | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'themes' | 'competitors' | 'digest'>('overview');
  const [runningPipeline, setRunningPipeline] = useState(false);

  // Fetch dashboard data
  useEffect(() => {
    fetchData();
    fetchDigest();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  async function fetchData() {
    try {
      const res = await fetch('/api/dashboard');
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchDigest() {
    try {
      const res = await fetch('/api/digests?type=daily');
      const json = await res.json();
      if (json.success && json.digest) {
        setDigest(json.digest);
      }
    } catch (error) {
      console.error('Failed to fetch digest:', error);
    }
  }

  async function runPipeline() {
    setRunningPipeline(true);
    try {
      const res = await fetch('/api/pipeline/run', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        // Refresh data after pipeline completes
        await fetchData();
      }
    } catch (error) {
      console.error('Pipeline failed:', error);
    } finally {
      setRunningPipeline(false);
    }
  }

  async function acknowledgeAlert(alertId: string) {
    try {
      await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId })
      });
      // Refresh data
      fetchData();
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-400 text-lg">Loading intelligence data...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-zinc-400 text-lg mb-4">No data available</div>
          <button
            onClick={runPipeline}
            disabled={runningPipeline}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-500 disabled:opacity-50"
          >
            {runningPipeline ? 'Running...' : 'Run Collection'}
          </button>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const sentimentChartData = prepareSentimentData(data.sentimentTrend);
  const competitorChartData = data.competitorStats.map(c => ({
    name: c.competitor,
    mentions: c.mentions,
    sentiment: c.avgSentiment
  }));

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Social Intelligence</h1>
            <p className="text-sm text-zinc-500 mt-1">
              AI discourse monitoring • Last updated {formatTime(data.lastUpdated)}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={runPipeline}
              disabled={runningPipeline}
              className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 disabled:opacity-50 text-sm"
            >
              {runningPipeline ? '⏳ Running...' : '🔄 Refresh Data'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <nav className="flex gap-1 mt-4">
          {(['overview', 'themes', 'competitors', 'digest'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm capitalize transition-colors ${
                activeTab === tab
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </header>

      <main className="p-6">
        {/* Alerts Banner */}
        {data.alerts.length > 0 && (
          <div className="mb-6 space-y-2">
            {data.alerts.slice(0, 3).map(alert => (
              <div
                key={alert.id}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  SEVERITY_COLORS[alert.severity as keyof typeof SEVERITY_COLORS] || SEVERITY_COLORS.medium
                }`}
              >
                <div>
                  <span className="font-medium">{alert.title}</span>
                  <p className="text-sm opacity-80 mt-1">{alert.description}</p>
                </div>
                <button
                  onClick={() => acknowledgeAlert(alert.id)}
                  className="text-sm opacity-60 hover:opacity-100"
                >
                  Dismiss
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-12 gap-6">
            {/* Stats Cards */}
            <div className="col-span-12 grid grid-cols-4 gap-4">
              <StatCard
                label="Posts (24h)"
                value={Object.values(data.platformCounts).reduce((a, b) => a + b, 0)}
                trend={null}
              />
              <StatCard
                label="Avg Sentiment"
                value={avgSentiment(data.sentimentTrend).toFixed(2)}
                trend={avgSentiment(data.sentimentTrend) > 0 ? 'up' : 'down'}
              />
              <StatCard
                label="Active Alerts"
                value={data.alerts.length}
                trend={data.alerts.length > 0 ? 'warning' : null}
              />
              <StatCard
                label="Top Competitor"
                value={data.competitorStats[0]?.competitor || 'N/A'}
                trend={null}
              />
            </div>

            {/* Sentiment Chart */}
            <div className="col-span-8 bg-zinc-900 rounded-xl p-6 border border-zinc-800">
              <h3 className="text-lg font-medium mb-4">Sentiment Trend (7 days)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={sentimentChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="time" stroke="#71717a" fontSize={12} />
                  <YAxis domain={[-1, 1]} stroke="#71717a" fontSize={12} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a' }}
                    labelStyle={{ color: '#a1a1aa' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="sentiment"
                    stroke="#d97706"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Platform Distribution */}
            <div className="col-span-4 bg-zinc-900 rounded-xl p-6 border border-zinc-800">
              <h3 className="text-lg font-medium mb-4">Platform Mix</h3>
              <div className="space-y-3">
                {Object.entries(data.platformCounts).map(([platform, count]) => (
                  <div key={platform} className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span>{PLATFORM_ICONS[platform] || '📱'}</span>
                      <span className="capitalize">{platform}</span>
                    </span>
                    <span className="text-zinc-400">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Themes */}
            <div className="col-span-12 bg-zinc-900 rounded-xl p-6 border border-zinc-800">
              <h3 className="text-lg font-medium mb-4">Trending Themes</h3>
              <div className="flex flex-wrap gap-2">
                {data.themes.slice(0, 8).map(theme => (
                  <span
                    key={theme.name}
                    className={`px-3 py-1.5 rounded-full text-sm ${
                      theme.is_emerging
                        ? 'bg-amber-900/50 text-amber-200 border border-amber-700'
                        : 'bg-zinc-800 text-zinc-300'
                    }`}
                  >
                    {theme.name}
                    {theme.is_emerging && ' 🔥'}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Themes Tab */}
        {activeTab === 'themes' && (
          <div className="space-y-4">
            {data.themes.map(theme => (
              <div
                key={theme.name}
                className="bg-zinc-900 rounded-xl p-6 border border-zinc-800"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-medium flex items-center gap-2">
                      {theme.name}
                      {theme.is_emerging && (
                        <span className="text-xs bg-amber-600 text-white px-2 py-0.5 rounded">
                          EMERGING
                        </span>
                      )}
                    </h3>
                    <p className="text-zinc-400 mt-1">{theme.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-semibold">{theme.frequency}</div>
                    <div className="text-sm text-zinc-500">mentions</div>
                  </div>
                </div>
                <div className="flex items-center gap-6 mt-4 text-sm">
                  <span className="flex items-center gap-2">
                    <span className={theme.sentiment_avg > 0 ? 'text-green-400' : 'text-red-400'}>
                      {theme.sentiment_avg > 0 ? '↑' : '↓'}
                    </span>
                    Sentiment: {theme.sentiment_avg?.toFixed(2) || 'N/A'}
                  </span>
                  <span className="text-zinc-500">
                    Audience: <span className="text-zinc-300 capitalize">{theme.audience_type}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Competitors Tab */}
        {activeTab === 'competitors' && (
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-8 bg-zinc-900 rounded-xl p-6 border border-zinc-800">
              <h3 className="text-lg font-medium mb-4">Share of Voice</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={competitorChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis type="number" stroke="#71717a" />
                  <YAxis type="category" dataKey="name" stroke="#71717a" width={80} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a' }}
                  />
                  <Bar
                    dataKey="mentions"
                    fill="#d97706"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="col-span-4 space-y-4">
              {data.competitorStats.map(comp => (
                <div
                  key={comp.competitor}
                  className="bg-zinc-900 rounded-xl p-4 border border-zinc-800"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium capitalize">{comp.competitor}</span>
                    <span
                      className={`text-sm ${
                        comp.avgSentiment > 0 ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {comp.avgSentiment > 0 ? '+' : ''}{comp.avgSentiment.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-2xl font-semibold mt-2">{comp.mentions}</div>
                  <div className="text-sm text-zinc-500">mentions this week</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Digest Tab */}
        {activeTab === 'digest' && (
          <div className="max-w-4xl">
            {digest ? (
              <div className="bg-zinc-900 rounded-xl p-8 border border-zinc-800">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-medium">Daily Intelligence Brief</h3>
                  <span className="text-sm text-zinc-500">
                    {formatTime(digest.generated_at)}
                  </span>
                </div>

                {/* Key Insights */}
                <div className="mb-8">
                  <h4 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3">
                    Key Insights
                  </h4>
                  <ul className="space-y-2">
                    {digest.key_insights.map((insight, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-amber-500">•</span>
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Full Content */}
                <div className="prose prose-invert prose-zinc max-w-none">
                  <div
                    dangerouslySetInnerHTML={{
                      __html: digest.content.replace(/\n/g, '<br />')
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-zinc-400 mb-4">No digest available yet</p>
                <button
                  onClick={async () => {
                    await fetch('/api/digests/generate?type=daily', { method: 'POST' });
                    fetchDigest();
                  }}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-500"
                >
                  Generate Daily Digest
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

// Helper Components
function StatCard({
  label,
  value,
  trend
}: {
  label: string;
  value: string | number;
  trend: 'up' | 'down' | 'warning' | null;
}) {
  return (
    <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
      <div className="text-sm text-zinc-400">{label}</div>
      <div className="text-2xl font-semibold mt-1 flex items-center gap-2">
        {value}
        {trend === 'up' && <span className="text-green-400 text-sm">↑</span>}
        {trend === 'down' && <span className="text-red-400 text-sm">↓</span>}
        {trend === 'warning' && <span className="text-amber-400 text-sm">⚠️</span>}
      </div>
    </div>
  );
}

// Helpers
function prepareSentimentData(raw: DashboardData['sentimentTrend']) {
  // Aggregate by hour
  const byHour: Record<string, { sum: number; count: number }> = {};
  
  for (const item of raw) {
    const hour = new Date(item.hour).toISOString().slice(0, 13);
    if (!byHour[hour]) {
      byHour[hour] = { sum: 0, count: 0 };
    }
    byHour[hour].sum += item.avg_sentiment;
    byHour[hour].count++;
  }
  
  return Object.entries(byHour)
    .map(([hour, data]) => ({
      time: new Date(hour).toLocaleDateString('en-US', { weekday: 'short', hour: 'numeric' }),
      sentiment: data.sum / data.count
    }))
    .slice(-48); // Last 48 hours
}

function avgSentiment(data: DashboardData['sentimentTrend']): number {
  if (data.length === 0) return 0;
  return data.reduce((sum, d) => sum + d.avg_sentiment, 0) / data.length;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}
