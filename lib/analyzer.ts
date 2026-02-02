/**
 * Claude Analysis Engine
 * 
 * This module handles sending batches of social posts to Claude
 * for theme extraction, sentiment analysis, and community identification.
 */

import Anthropic from '@anthropic-ai/sdk';

// Initialize the client (uses ANTHROPIC_API_KEY env var)
const anthropic = new Anthropic();

// ============================================
// ANALYSIS PROMPTS
// ============================================

const ANALYSIS_SYSTEM_PROMPT = `You are a social intelligence analyst specializing in AI/ML industry discourse. Your job is to analyze batches of social media posts and extract actionable insights for an AI company tracking its market position.

You have deep expertise in:
- Identifying emerging themes and trends in tech discussions
- Detecting sentiment nuances (not just positive/negative, but WHY)
- Recognizing different audience segments (enterprise decision-makers, developers, hobbyists, researchers)
- Spotting competitive dynamics and market positioning
- Understanding the difference between noise and signal

Your analysis should be precise, data-driven, and actionable. Avoid generic observations.`;

const ANALYSIS_USER_PROMPT = `Analyze the following batch of social media posts about AI assistants and LLMs.

<posts>
{POSTS_JSON}
</posts>

Provide your analysis in the following JSON structure:

{
  "summary": "2-3 sentence executive summary of what's happening in this batch",
  
  "themes": [
    {
      "name": "Short theme name",
      "description": "What this theme is about",
      "frequency": <number of posts touching this theme>,
      "sentiment": <-1 to 1>,
      "audience_type": "enterprise|developer|hobbyist|researcher|general",
      "is_emerging": <true if this seems new/growing>,
      "example_post_ids": ["id1", "id2"],
      "why_it_matters": "Business relevance"
    }
  ],
  
  "sentiment_breakdown": {
    "overall": <-1 to 1>,
    "positive_count": <number>,
    "neutral_count": <number>,
    "negative_count": <number>,
    "key_drivers": ["What's driving positive sentiment", "What's driving negative sentiment"]
  },
  
  "competitor_analysis": [
    {
      "competitor": "claude|chatgpt|gemini|llama|mistral|other",
      "mention_count": <number>,
      "sentiment": <-1 to 1>,
      "key_narratives": ["What people are saying about this competitor"],
      "comparison_posts": ["post_ids where direct comparisons happen"]
    }
  ],
  
  "communities_identified": [
    {
      "name": "Community/segment name",
      "description": "Who they are",
      "primary_platform": "reddit|hackernews|bluesky",
      "audience_type": "enterprise|developer|hobbyist|researcher",
      "size_indicator": "small|medium|large",
      "sentiment_toward_claude": <-1 to 1>,
      "key_concerns": ["What they care about"],
      "opportunities": ["How to better serve them"],
      "gathering_places": ["Specific places where this community discusses: subreddit names (e.g. r/LocalLLaMA), Bluesky hashtags, HN keywords, etc. Use for future scraping/intel."]
    }
  ],
  
  "alerts": [
    {
      "type": "sentiment_spike|emerging_theme|viral_post|competitor_news|pr_risk",
      "severity": "low|medium|high|critical",
      "title": "Alert title",
      "description": "What happened and why it matters",
      "recommended_action": "What to do about it",
      "related_post_ids": ["id1"]
    }
  ],
  
  "enterprise_signals": {
    "count": <posts that seem enterprise-relevant>,
    "topics": ["What enterprise folks are discussing"],
    "pain_points": ["Problems they're trying to solve"],
    "evaluation_criteria": ["What they care about when choosing AI tools"]
  }
}

Be specific and cite post IDs where relevant. If you don't have enough data for a section, say so rather than making things up.`;

// ============================================
// ANALYSIS FUNCTIONS
// ============================================

interface AnalysisInput {
  posts: Array<{
    id: string;
    platform_id: string;
    content: string;
    author: string;
    engagement_score: number;
    posted_at: string;
    url: string;
    metadata: Record<string, any>;
  }>;
}

interface AnalysisResult {
  summary: string;
  themes: Theme[];
  sentiment_breakdown: SentimentBreakdown;
  competitor_analysis: CompetitorMention[];
  communities_identified: Community[];
  alerts: Alert[];
  enterprise_signals: EnterpriseSignals;
  raw_response: string;
  processing_time_ms: number;
}

interface Theme {
  name: string;
  description: string;
  frequency: number;
  sentiment: number;
  audience_type: string;
  is_emerging: boolean;
  example_post_ids: string[];
  why_it_matters: string;
}

interface SentimentBreakdown {
  overall: number;
  positive_count: number;
  neutral_count: number;
  negative_count: number;
  key_drivers: string[];
}

interface CompetitorMention {
  competitor: string;
  mention_count: number;
  sentiment: number;
  key_narratives: string[];
  comparison_posts: string[];
}

interface Community {
  name: string;
  description: string;
  primary_platform: string;
  audience_type: string;
  size_indicator: string;
  sentiment_toward_claude: number;
  key_concerns: string[];
  opportunities: string[];
  /** Where this community gathers (subreddits, hashtags, etc.) — seeds for future scraping/intel. */
  gathering_places?: string[];
}

interface Alert {
  type: string;
  severity: string;
  title: string;
  description: string;
  recommended_action: string;
  related_post_ids: string[];
}

interface EnterpriseSignals {
  count: number;
  topics: string[];
  pain_points: string[];
  evaluation_criteria: string[];
}

export async function analyzePostBatch(input: AnalysisInput): Promise<AnalysisResult> {
  const startTime = Date.now();
  
  // Prepare posts for analysis (trim to essential fields to save tokens)
  const postsForAnalysis = input.posts.map(p => ({
    id: p.id,
    platform: p.platform_id,
    content: p.content.slice(0, 2000), // Truncate very long posts
    author: p.author,
    engagement: p.engagement_score,
    posted_at: p.posted_at,
    metadata: p.metadata
  }));
  
  const userPrompt = ANALYSIS_USER_PROMPT.replace(
    '{POSTS_JSON}',
    JSON.stringify(postsForAnalysis, null, 2)
  );
  
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: ANALYSIS_SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: userPrompt }
      ]
    });
    
    const rawText = response.content[0].type === 'text' 
      ? response.content[0].text 
      : '';
    
    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = rawText;
    const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }
    
    const parsed = JSON.parse(jsonStr);
    
    return {
      ...parsed,
      raw_response: rawText,
      processing_time_ms: Date.now() - startTime
    };
    
  } catch (error) {
    console.error('Analysis error:', error);
    throw error;
  }
}

// ============================================
// DIGEST GENERATION
// ============================================

const DIGEST_SYSTEM_PROMPT = `You are a strategic communications analyst creating executive briefings on AI industry social sentiment. Write in a clear, engaging style that respects the reader's time while delivering genuine insights.

Your tone should be:
- Confident but not hyperbolic
- Data-informed but narrative-driven
- Strategic but accessible
- Direct about both opportunities and risks`;

export async function generateDigest(
  type: 'daily' | 'weekly',
  data: {
    themes: Theme[];
    sentiment: SentimentBreakdown;
    competitors: CompetitorMention[];
    communities: Community[];
    alerts: Alert[];
    enterprise: EnterpriseSignals;
    postCount: number;
    periodStart: string;
    periodEnd: string;
  }
): Promise<{ content: string; summary: string; key_insights: string[] }> {
  
  const prompt = `Generate a ${type} digest report based on the following social intelligence data from ${data.periodStart} to ${data.periodEnd}.

Total posts analyzed: ${data.postCount}

THEMES:
${JSON.stringify(data.themes, null, 2)}

SENTIMENT:
${JSON.stringify(data.sentiment, null, 2)}

COMPETITOR ANALYSIS:
${JSON.stringify(data.competitors, null, 2)}

COMMUNITIES:
${JSON.stringify(data.communities, null, 2)}

ALERTS:
${JSON.stringify(data.alerts, null, 2)}

ENTERPRISE SIGNALS:
${JSON.stringify(data.enterprise, null, 2)}

Create a report with:
1. Executive Summary (3-4 sentences, the absolute must-know)
2. Key Themes This ${type === 'daily' ? 'Day' : 'Week'} (narrative format, not bullet points)
3. Sentiment & Brand Health (what's driving perception)
4. Competitive Landscape (how we stack up)
5. Enterprise Opportunities (actionable insights)
6. Risks & Watch Items (what could become problems)
7. Recommended Actions (specific next steps)

Format in Markdown. Be specific and cite data points. End with a JSON block containing:
\`\`\`json
{
  "summary": "One paragraph TL;DR",
  "key_insights": ["Insight 1", "Insight 2", "Insight 3", "Insight 4", "Insight 5"]
}
\`\`\``;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: DIGEST_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }]
  });
  
  const rawText = response.content[0].type === 'text' 
    ? response.content[0].text 
    : '';
  
  // Extract the JSON metadata from the end
  const jsonMatch = rawText.match(/```json\s*([\s\S]*?)```\s*$/);
  let metadata = { summary: '', key_insights: [] as string[] };
  
  if (jsonMatch) {
    try {
      metadata = JSON.parse(jsonMatch[1]);
    } catch (e) {
      // Fall back to extracting from content
    }
  }
  
  // Remove the JSON block from the content
  const content = rawText.replace(/```json\s*[\s\S]*?```\s*$/, '').trim();
  
  return {
    content,
    summary: metadata.summary,
    key_insights: metadata.key_insights
  };
}

// ============================================
// ALERT DETECTION
// ============================================

export function shouldTriggerAlert(analysis: AnalysisResult): Alert[] {
  const alerts: Alert[] = [];
  
  // Check for significant negative sentiment
  if (analysis.sentiment_breakdown.overall < -0.3) {
    alerts.push({
      type: 'sentiment_spike',
      severity: analysis.sentiment_breakdown.overall < -0.5 ? 'high' : 'medium',
      title: 'Negative Sentiment Spike Detected',
      description: `Overall sentiment dropped to ${analysis.sentiment_breakdown.overall.toFixed(2)}. Key drivers: ${analysis.sentiment_breakdown.key_drivers.join(', ')}`,
      recommended_action: 'Review negative posts and assess if response is needed',
      related_post_ids: []
    });
  }
  
  // Check for emerging themes
  const emergingThemes = analysis.themes.filter(t => t.is_emerging && t.frequency >= 3);
  for (const theme of emergingThemes) {
    alerts.push({
      type: 'emerging_theme',
      severity: theme.sentiment < -0.2 ? 'high' : 'medium',
      title: `Emerging Theme: ${theme.name}`,
      description: theme.description,
      recommended_action: theme.why_it_matters,
      related_post_ids: theme.example_post_ids
    });
  }
  
  // Add any alerts from the analysis itself
  alerts.push(...analysis.alerts);
  
  return alerts;
}

export { type AnalysisResult, type Theme, type Community, type Alert };
