/**
 * Database Operations
 * 
 * Handles all Supabase interactions for storing and retrieving
 * social intelligence data.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { SocialPost } from './collectors';
import type { AnalysisResult, Theme, Community, Alert } from './analyzer';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Use service role for server-side

let supabase: SupabaseClient;

export function getSupabase(): SupabaseClient {
  if (!supabase) {
    supabase = createClient(supabaseUrl, supabaseKey);
  }
  return supabase;
}

// ============================================
// POST OPERATIONS
// ============================================

export async function savePosts(posts: SocialPost[]): Promise<{ inserted: number; skipped: number }> {
  const db = getSupabase();
  let inserted = 0;
  let skipped = 0;
  
  // Use upsert to handle duplicates gracefully
  for (const post of posts) {
    const { error } = await db
      .from('posts')
      .upsert({
        platform_id: post.platform_id,
        external_id: post.external_id,
        author: post.author,
        author_id: post.author_id,
        content: post.content,
        url: post.url,
        posted_at: post.posted_at,
        engagement_score: post.engagement_score,
        reply_count: post.reply_count,
        metadata: post.metadata
      }, {
        onConflict: 'platform_id,external_id',
        ignoreDuplicates: true
      });
    
    if (error) {
      console.error('Error saving post:', error);
      skipped++;
    } else {
      inserted++;
    }
  }
  
  return { inserted, skipped };
}

export async function getUnanalyzedPosts(limit: number = 100): Promise<any[]> {
  const db = getSupabase();
  
  // Get posts that haven't been included in any analysis batch yet
  // This is a simplified version - you might want a more sophisticated tracking system
  const { data, error } = await db
    .from('posts')
    .select('*')
    .order('collected_at', { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  return data || [];
}

export async function getRecentPosts(hours: number = 24): Promise<any[]> {
  const db = getSupabase();
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  
  const { data, error } = await db
    .from('posts')
    .select('*')
    .gte('collected_at', since)
    .order('collected_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

// ============================================
// ANALYSIS OPERATIONS
// ============================================

export async function saveAnalysisBatch(
  analysis: AnalysisResult,
  postIds: string[],
  timeRange: { start: string; end: string }
): Promise<string> {
  const db = getSupabase();
  
  // Save the main batch record
  const { data: batch, error: batchError } = await db
    .from('analysis_batches')
    .insert({
      post_count: postIds.length,
      time_range_start: timeRange.start,
      time_range_end: timeRange.end,
      raw_analysis: analysis,
      processing_time_ms: analysis.processing_time_ms
    })
    .select('id')
    .single();
  
  if (batchError) throw batchError;
  const batchId = batch.id;
  
  // Save themes
  if (analysis.themes?.length > 0) {
    const themesData = analysis.themes.map(theme => ({
      batch_id: batchId,
      name: theme.name,
      description: theme.description,
      frequency: theme.frequency,
      sentiment_avg: theme.sentiment,
      audience_type: theme.audience_type,
      is_emerging: theme.is_emerging,
      example_posts: theme.example_post_ids
    }));
    
    await db.from('themes').insert(themesData);
  }
  
  // Save sentiment snapshot
  const sentimentData = {
    batch_id: batchId,
    overall_sentiment: analysis.sentiment_breakdown.overall,
    positive_count: analysis.sentiment_breakdown.positive_count,
    neutral_count: analysis.sentiment_breakdown.neutral_count,
    negative_count: analysis.sentiment_breakdown.negative_count,
    volume: postIds.length
  };
  
  await db.from('sentiment_snapshots').insert(sentimentData);
  
  // Save competitor mentions
  if (analysis.competitor_analysis?.length > 0) {
    const competitorData = analysis.competitor_analysis.flatMap(comp => 
      comp.comparison_posts.map(postId => ({
        batch_id: batchId,
        post_id: postId,
        competitor: comp.competitor,
        sentiment: comp.sentiment,
        is_comparison: true,
        mentioned_at: new Date().toISOString()
      }))
    );
    
    if (competitorData.length > 0) {
      await db.from('competitor_mentions').insert(competitorData);
    }
  }
  
  // Save alerts
  if (analysis.alerts?.length > 0) {
    const alertsData = analysis.alerts.map(alert => ({
      alert_type: alert.type,
      severity: alert.severity,
      title: alert.title,
      description: alert.description,
      related_posts: alert.related_post_ids,
      metadata: { recommended_action: alert.recommended_action }
    }));
    
    await db.from('alerts').insert(alertsData);
  }
  
  return batchId;
}

// ============================================
// DASHBOARD DATA
// ============================================

export async function getDashboardData() {
  const db = getSupabase();
  
  // Get sentiment trend (last 7 days)
  const { data: sentimentTrend } = await db
    .from('sentiment_snapshots')
    .select('timestamp, overall_sentiment, volume, platform_id')
    .gte('timestamp', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .order('timestamp', { ascending: true });
  
  // Get top themes
  const { data: themes } = await db
    .from('themes')
    .select('name, description, frequency, sentiment_avg, audience_type, is_emerging')
    .gte('last_seen_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .order('frequency', { ascending: false })
    .limit(10);
  
  // Get competitor share of voice
  const { data: competitors } = await db
    .from('competitor_mentions')
    .select('competitor, sentiment')
    .gte('mentioned_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
  
  // Aggregate competitor data
  const competitorStats = aggregateCompetitorStats(competitors || []);
  
  // Get unacknowledged alerts
  const { data: alerts } = await db
    .from('alerts')
    .select('*')
    .eq('is_acknowledged', false)
    .order('created_at', { ascending: false })
    .limit(10);
  
  // Get recent post count by platform
  const { data: postCounts } = await db
    .from('posts')
    .select('platform_id')
    .gte('collected_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
  
  const platformCounts = aggregatePlatformCounts(postCounts || []);
  
  return {
    sentimentTrend: sentimentTrend || [],
    themes: themes || [],
    competitorStats,
    alerts: alerts || [],
    platformCounts,
    lastUpdated: new Date().toISOString()
  };
}

function aggregateCompetitorStats(mentions: Array<{ competitor: string; sentiment: number }>) {
  const stats: Record<string, { count: number; totalSentiment: number }> = {};
  
  for (const m of mentions) {
    if (!stats[m.competitor]) {
      stats[m.competitor] = { count: 0, totalSentiment: 0 };
    }
    stats[m.competitor].count++;
    stats[m.competitor].totalSentiment += m.sentiment;
  }
  
  return Object.entries(stats).map(([competitor, data]) => ({
    competitor,
    mentions: data.count,
    avgSentiment: data.totalSentiment / data.count
  })).sort((a, b) => b.mentions - a.mentions);
}

function aggregatePlatformCounts(posts: Array<{ platform_id: string }>) {
  const counts: Record<string, number> = {};
  for (const p of posts) {
    counts[p.platform_id] = (counts[p.platform_id] || 0) + 1;
  }
  return counts;
}

// ============================================
// DIGEST OPERATIONS
// ============================================

export async function saveDigest(
  type: 'daily' | 'weekly',
  content: string,
  summary: string,
  keyInsights: string[],
  periodStart: string,
  periodEnd: string
): Promise<string> {
  const db = getSupabase();
  
  const { data, error } = await db
    .from('digests')
    .insert({
      digest_type: type,
      period_start: periodStart,
      period_end: periodEnd,
      content,
      summary,
      key_insights: keyInsights
    })
    .select('id')
    .single();
  
  if (error) throw error;
  return data.id;
}

export async function getLatestDigest(type: 'daily' | 'weekly') {
  const db = getSupabase();
  
  const { data, error } = await db
    .from('digests')
    .select('*')
    .eq('digest_type', type)
    .order('generated_at', { ascending: false })
    .limit(1)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
  return data;
}

// ============================================
// ALERT OPERATIONS
// ============================================

export async function acknowledgeAlert(alertId: string): Promise<void> {
  const db = getSupabase();
  
  await db
    .from('alerts')
    .update({ 
      is_acknowledged: true,
      acknowledged_at: new Date().toISOString()
    })
    .eq('id', alertId);
}

export async function getActiveAlerts() {
  const db = getSupabase();
  
  const { data, error } = await db
    .from('alerts')
    .select('*')
    .eq('is_acknowledged', false)
    .order('severity', { ascending: false })
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}
