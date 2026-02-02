/**
 * Social Intelligence Orchestrator
 * 
 * This is the main entry point that coordinates:
 * 1. Collecting posts from all platforms
 * 2. Sending batches to Claude for analysis
 * 3. Storing results in Supabase
 * 4. Generating alerts and digests
 * 
 * Run this on a schedule (e.g., every 15-30 minutes for near-real-time)
 */

import { collectAll, type SocialPost } from './collectors';
import { analyzePostBatch, generateDigest, shouldTriggerAlert } from './analyzer';
import { 
  savePosts, 
  getRecentPosts, 
  saveAnalysisBatch, 
  saveDigest,
  getDashboardData 
} from './database';

// ============================================
// MAIN PIPELINE
// ============================================

export interface PipelineResult {
  collected: number;
  analyzed: number;
  alerts: number;
  duration_ms: number;
  errors: string[];
}

export async function runPipeline(): Promise<PipelineResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  let collected = 0;
  let analyzed = 0;
  let alertCount = 0;
  
  console.log('🚀 Starting social intelligence pipeline...');
  
  // Step 1: Collect posts from all platforms
  console.log('📥 Collecting posts...');
  try {
    const posts = await collectAll();
    const { inserted, skipped } = await savePosts(posts);
    collected = inserted;
    console.log(`✅ Collected ${inserted} new posts (${skipped} duplicates)`);
  } catch (error) {
    const msg = `Collection error: ${error}`;
    console.error(msg);
    errors.push(msg);
  }
  
  // Step 2: Get recent posts for analysis
  console.log('🔍 Preparing posts for analysis...');
  let postsToAnalyze: any[] = [];
  try {
    postsToAnalyze = await getRecentPosts(1); // Last hour
    console.log(`Found ${postsToAnalyze.length} posts to analyze`);
  } catch (error) {
    const msg = `Fetch error: ${error}`;
    console.error(msg);
    errors.push(msg);
  }
  
  // Step 3: Analyze with Claude (if we have posts)
  if (postsToAnalyze.length > 0) {
    console.log('🧠 Analyzing with Claude...');
    try {
      const analysis = await analyzePostBatch({ posts: postsToAnalyze });
      analyzed = postsToAnalyze.length;
      
      // Get time range
      const timestamps = postsToAnalyze.map(p => new Date(p.posted_at).getTime());
      const timeRange = {
        start: new Date(Math.min(...timestamps)).toISOString(),
        end: new Date(Math.max(...timestamps)).toISOString()
      };
      
      // Save analysis results
      const batchId = await saveAnalysisBatch(
        analysis,
        postsToAnalyze.map(p => p.id),
        timeRange
      );
      
      console.log(`✅ Analysis saved (batch: ${batchId})`);
      
      // Check for alerts
      const alerts = shouldTriggerAlert(analysis);
      alertCount = alerts.length;
      if (alerts.length > 0) {
        console.log(`⚠️ Generated ${alerts.length} alerts`);
      }
      
    } catch (error) {
      const msg = `Analysis error: ${error}`;
      console.error(msg);
      errors.push(msg);
    }
  } else {
    console.log('ℹ️ No new posts to analyze');
  }
  
  const duration = Date.now() - startTime;
  console.log(`✨ Pipeline complete in ${duration}ms`);
  
  return {
    collected,
    analyzed,
    alerts: alertCount,
    duration_ms: duration,
    errors
  };
}

// ============================================
// DIGEST GENERATION
// ============================================

export async function runDailyDigest(): Promise<string> {
  console.log('📊 Generating daily digest...');
  
  // Get last 24 hours of data
  const dashboardData = await getDashboardData();
  
  const periodEnd = new Date();
  const periodStart = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  // Aggregate data for digest
  const digest = await generateDigest('daily', {
    themes: dashboardData.themes as any,
    sentiment: {
      overall: avgSentiment(dashboardData.sentimentTrend),
      positive_count: 0, // Would need to aggregate from raw data
      neutral_count: 0,
      negative_count: 0,
      key_drivers: []
    },
    competitors: dashboardData.competitorStats.map(c => ({
      competitor: c.competitor,
      mention_count: c.mentions,
      sentiment: c.avgSentiment,
      key_narratives: [],
      comparison_posts: []
    })),
    communities: (dashboardData as any).communities?.map((c: any) => ({
      name: c.name,
      description: c.description ?? '',
      primary_platform: c.primary_platform ?? '',
      audience_type: c.audience_type ?? 'general',
      size_indicator: c.estimated_size ?? 'medium',
      sentiment_toward_claude: c.sentiment_toward_claude ?? 0,
      key_concerns: c.notes_parsed?.key_concerns ?? [],
      opportunities: c.notes_parsed?.opportunities ?? [],
    })) ?? [],
    alerts: dashboardData.alerts as any,
    enterprise: {
      count: 0,
      topics: [],
      pain_points: [],
      evaluation_criteria: []
    },
    postCount: Object.values(dashboardData.platformCounts).reduce((a, b) => a + b, 0),
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString()
  });
  
  // Save the digest
  const digestId = await saveDigest(
    'daily',
    digest.content,
    digest.summary,
    digest.key_insights,
    periodStart.toISOString(),
    periodEnd.toISOString()
  );
  
  console.log(`✅ Daily digest generated (${digestId})`);
  return digestId;
}

export async function runWeeklyDigest(): Promise<string> {
  console.log('📊 Generating weekly digest...');
  
  // Similar to daily but with 7-day window
  // Implementation would be similar to runDailyDigest
  // but aggregating more data
  
  const periodEnd = new Date();
  const periodStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  const dashboardData = await getDashboardData();
  
  const digest = await generateDigest('weekly', {
    themes: dashboardData.themes as any,
    sentiment: {
      overall: avgSentiment(dashboardData.sentimentTrend),
      positive_count: 0,
      neutral_count: 0,
      negative_count: 0,
      key_drivers: []
    },
    competitors: dashboardData.competitorStats.map(c => ({
      competitor: c.competitor,
      mention_count: c.mentions,
      sentiment: c.avgSentiment,
      key_narratives: [],
      comparison_posts: []
    })),
    communities: (dashboardData as any).communities?.map((c: any) => ({
      name: c.name,
      description: c.description ?? '',
      primary_platform: c.primary_platform ?? '',
      audience_type: c.audience_type ?? 'general',
      size_indicator: c.estimated_size ?? 'medium',
      sentiment_toward_claude: c.sentiment_toward_claude ?? 0,
      key_concerns: c.notes_parsed?.key_concerns ?? [],
      opportunities: c.notes_parsed?.opportunities ?? [],
    })) ?? [],
    alerts: dashboardData.alerts as any,
    enterprise: {
      count: 0,
      topics: [],
      pain_points: [],
      evaluation_criteria: []
    },
    postCount: Object.values(dashboardData.platformCounts).reduce((a, b) => a + b, 0),
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString()
  });
  
  const digestId = await saveDigest(
    'weekly',
    digest.content,
    digest.summary,
    digest.key_insights,
    periodStart.toISOString(),
    periodEnd.toISOString()
  );
  
  console.log(`✅ Weekly digest generated (${digestId})`);
  return digestId;
}

// Helper
function avgSentiment(data: Array<{ overall_sentiment: number }>): number {
  if (data.length === 0) return 0;
  return data.reduce((sum, d) => sum + d.overall_sentiment, 0) / data.length;
}

// ============================================
// EXPORTS FOR API ROUTES
// ============================================

export { getDashboardData } from './database';
export { getActiveAlerts, acknowledgeAlert, getLatestDigest } from './database';
