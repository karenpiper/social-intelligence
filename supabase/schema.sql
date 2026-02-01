-- Social Intelligence System Schema
-- Run this in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CORE TABLES
-- ============================================

-- Platforms we're tracking
CREATE TABLE platforms (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO platforms (id, name, icon) VALUES
    ('reddit', 'Reddit', '🔴'),
    ('hackernews', 'Hacker News', '🟠'),
    ('bluesky', 'Bluesky', '🦋'),
    ('twitter', 'Twitter/X', '𝕏'),
    ('linkedin', 'LinkedIn', '🔵'),
    ('discord', 'Discord', '💬'),
    ('youtube', 'YouTube', '▶️');

-- Raw posts collected from platforms
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    platform_id TEXT REFERENCES platforms(id),
    external_id TEXT NOT NULL, -- ID from the source platform
    author TEXT,
    author_id TEXT,
    content TEXT NOT NULL,
    url TEXT,
    posted_at TIMESTAMPTZ,
    collected_at TIMESTAMPTZ DEFAULT NOW(),
    engagement_score INTEGER DEFAULT 0, -- likes, upvotes, etc.
    reply_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}', -- platform-specific data
    
    UNIQUE(platform_id, external_id)
);

-- Index for efficient querying
CREATE INDEX idx_posts_platform ON posts(platform_id);
CREATE INDEX idx_posts_posted_at ON posts(posted_at DESC);
CREATE INDEX idx_posts_collected_at ON posts(collected_at DESC);

-- Claude's analysis of posts (batch processed)
CREATE TABLE analysis_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    analyzed_at TIMESTAMPTZ DEFAULT NOW(),
    post_count INTEGER,
    time_range_start TIMESTAMPTZ,
    time_range_end TIMESTAMPTZ,
    raw_analysis JSONB, -- Full Claude response
    processing_time_ms INTEGER
);

-- Extracted themes from analysis
CREATE TABLE themes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID REFERENCES analysis_batches(id),
    name TEXT NOT NULL,
    description TEXT,
    frequency INTEGER DEFAULT 1, -- How often this theme appeared
    sentiment_avg DECIMAL(3,2), -- -1 to 1
    audience_type TEXT, -- 'enterprise', 'developer', 'hobbyist', 'researcher', 'general'
    is_emerging BOOLEAN DEFAULT false,
    first_seen_at TIMESTAMPTZ DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ DEFAULT NOW(),
    example_posts UUID[] -- Array of post IDs
);

CREATE INDEX idx_themes_name ON themes(name);
CREATE INDEX idx_themes_audience ON themes(audience_type);
CREATE INDEX idx_themes_emerging ON themes(is_emerging) WHERE is_emerging = true;

-- Sentiment tracking over time
CREATE TABLE sentiment_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID REFERENCES analysis_batches(id),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    platform_id TEXT REFERENCES platforms(id),
    overall_sentiment DECIMAL(3,2), -- -1 to 1
    positive_count INTEGER,
    neutral_count INTEGER,
    negative_count INTEGER,
    volume INTEGER -- total posts in this snapshot
);

CREATE INDEX idx_sentiment_time ON sentiment_snapshots(timestamp DESC);
CREATE INDEX idx_sentiment_platform ON sentiment_snapshots(platform_id);

-- Competitor mentions
CREATE TABLE competitor_mentions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES posts(id),
    batch_id UUID REFERENCES analysis_batches(id),
    competitor TEXT NOT NULL, -- 'claude', 'chatgpt', 'gemini', 'llama', etc.
    context TEXT, -- Why was it mentioned
    sentiment DECIMAL(3,2),
    is_comparison BOOLEAN DEFAULT false, -- Direct comparison between competitors
    mentioned_at TIMESTAMPTZ
);

CREATE INDEX idx_competitor_name ON competitor_mentions(competitor);
CREATE INDEX idx_competitor_time ON competitor_mentions(mentioned_at DESC);

-- Community/audience segments identified
CREATE TABLE communities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    primary_platform TEXT REFERENCES platforms(id),
    audience_type TEXT,
    estimated_size TEXT, -- 'small', 'medium', 'large'
    key_topics TEXT[],
    sentiment_toward_claude DECIMAL(3,2),
    first_identified_at TIMESTAMPTZ DEFAULT NOW(),
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT
);

-- Alerts for significant events
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    alert_type TEXT NOT NULL, -- 'sentiment_spike', 'emerging_theme', 'viral_post', 'competitor_news'
    severity TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    title TEXT NOT NULL,
    description TEXT,
    related_posts UUID[],
    related_themes UUID[],
    is_acknowledged BOOLEAN DEFAULT false,
    acknowledged_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_alerts_unack ON alerts(is_acknowledged, created_at DESC) WHERE NOT is_acknowledged;

-- Daily/weekly digest storage
CREATE TABLE digests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    digest_type TEXT NOT NULL, -- 'daily', 'weekly'
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    content TEXT, -- Markdown content generated by Claude
    summary TEXT, -- TL;DR
    key_insights JSONB,
    sent_at TIMESTAMPTZ,
    sent_to TEXT[]
);

CREATE INDEX idx_digests_type ON digests(digest_type, period_start DESC);

-- ============================================
-- VIEWS FOR DASHBOARD
-- ============================================

-- Recent sentiment trend (last 7 days, hourly)
CREATE VIEW v_sentiment_trend AS
SELECT 
    date_trunc('hour', timestamp) as hour,
    platform_id,
    AVG(overall_sentiment) as avg_sentiment,
    SUM(volume) as total_volume
FROM sentiment_snapshots
WHERE timestamp > NOW() - INTERVAL '7 days'
GROUP BY date_trunc('hour', timestamp), platform_id
ORDER BY hour DESC;

-- Top themes this week
CREATE VIEW v_top_themes AS
SELECT 
    name,
    description,
    SUM(frequency) as total_mentions,
    AVG(sentiment_avg) as avg_sentiment,
    audience_type,
    bool_or(is_emerging) as has_emerging,
    MIN(first_seen_at) as first_seen
FROM themes
WHERE last_seen_at > NOW() - INTERVAL '7 days'
GROUP BY name, description, audience_type
ORDER BY total_mentions DESC
LIMIT 20;

-- Competitor share of voice
CREATE VIEW v_competitor_share AS
SELECT 
    competitor,
    COUNT(*) as mention_count,
    AVG(sentiment) as avg_sentiment,
    COUNT(*) FILTER (WHERE is_comparison) as comparison_count
FROM competitor_mentions
WHERE mentioned_at > NOW() - INTERVAL '7 days'
GROUP BY competitor
ORDER BY mention_count DESC;

-- ============================================
-- ROW LEVEL SECURITY (optional but recommended)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sentiment_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE digests ENABLE ROW LEVEL SECURITY;

-- For now, allow all access (adjust based on your auth setup)
-- You'll want to create proper policies based on your user roles

CREATE POLICY "Allow all access to posts" ON posts FOR ALL USING (true);
CREATE POLICY "Allow all access to analysis_batches" ON analysis_batches FOR ALL USING (true);
CREATE POLICY "Allow all access to themes" ON themes FOR ALL USING (true);
CREATE POLICY "Allow all access to sentiment_snapshots" ON sentiment_snapshots FOR ALL USING (true);
CREATE POLICY "Allow all access to competitor_mentions" ON competitor_mentions FOR ALL USING (true);
CREATE POLICY "Allow all access to communities" ON communities FOR ALL USING (true);
CREATE POLICY "Allow all access to alerts" ON alerts FOR ALL USING (true);
CREATE POLICY "Allow all access to digests" ON digests FOR ALL USING (true);
