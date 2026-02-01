/**
 * Social Data Collectors
 * 
 * These functions fetch posts from various platforms.
 * Reddit and HN use public JSON endpoints (no API key needed for basic use).
 * Bluesky has an open API.
 * 
 * For production, you'll want to add rate limiting and error handling.
 */

// Keywords to search for
const KEYWORDS = [
  'claude',
  'anthropic', 
  'chatgpt',
  'openai',
  'gemini',
  'llama',
  'mistral',
  'ai assistant',
  'llm',
  'large language model'
];

// ============================================
// REDDIT COLLECTOR
// ============================================

interface RedditPost {
  platform_id: 'reddit';
  external_id: string;
  author: string;
  author_id: string;
  content: string;
  url: string;
  posted_at: string;
  engagement_score: number;
  reply_count: number;
  metadata: {
    subreddit: string;
    title: string;
    is_self: boolean;
    flair?: string;
  };
}

const REDDIT_SUBREDDITS = [
  'LocalLLaMA',
  'ChatGPT', 
  'artificial',
  'MachineLearning',
  'ClaudeAI',
  'singularity',
  'OpenAI',
  'Anthropic',
  'LanguageTechnology'
];

export async function collectReddit(): Promise<RedditPost[]> {
  const posts: RedditPost[] = [];
  
  for (const subreddit of REDDIT_SUBREDDITS) {
    try {
      // Fetch recent posts from subreddit
      const response = await fetch(
        `https://www.reddit.com/r/${subreddit}/new.json?limit=50`,
        {
          headers: {
            'User-Agent': 'SocialIntelligence/1.0'
          }
        }
      );
      
      if (!response.ok) {
        console.error(`Reddit ${subreddit}: ${response.status}`);
        continue;
      }
      
      const data = await response.json();
      
      for (const child of data.data.children) {
        const post = child.data;
        
        // Check if post contains any of our keywords
        const content = `${post.title} ${post.selftext || ''}`.toLowerCase();
        const hasKeyword = KEYWORDS.some(kw => content.includes(kw.toLowerCase()));
        
        if (hasKeyword) {
          posts.push({
            platform_id: 'reddit',
            external_id: post.id,
            author: post.author,
            author_id: post.author_fullname || post.author,
            content: `${post.title}\n\n${post.selftext || ''}`.trim(),
            url: `https://reddit.com${post.permalink}`,
            posted_at: new Date(post.created_utc * 1000).toISOString(),
            engagement_score: post.score,
            reply_count: post.num_comments,
            metadata: {
              subreddit: post.subreddit,
              title: post.title,
              is_self: post.is_self,
              flair: post.link_flair_text
            }
          });
        }
      }
      
      // Be nice to Reddit's servers
      await sleep(1000);
      
    } catch (error) {
      console.error(`Error collecting from r/${subreddit}:`, error);
    }
  }
  
  return posts;
}

// ============================================
// HACKER NEWS COLLECTOR
// ============================================

interface HNPost {
  platform_id: 'hackernews';
  external_id: string;
  author: string;
  author_id: string;
  content: string;
  url: string;
  posted_at: string;
  engagement_score: number;
  reply_count: number;
  metadata: {
    title: string;
    type: string;
    link_url?: string;
  };
}

export async function collectHackerNews(): Promise<HNPost[]> {
  const posts: HNPost[] = [];
  
  try {
    // Get top, new, and best stories
    const endpoints = ['topstories', 'newstories', 'beststories'];
    const allIds = new Set<number>();
    
    for (const endpoint of endpoints) {
      const response = await fetch(
        `https://hacker-news.firebaseio.com/v0/${endpoint}.json`
      );
      const ids: number[] = await response.json();
      ids.slice(0, 100).forEach(id => allIds.add(id));
    }
    
    // Fetch each story
    for (const id of allIds) {
      try {
        const response = await fetch(
          `https://hacker-news.firebaseio.com/v0/item/${id}.json`
        );
        const item = await response.json();
        
        if (!item || item.deleted || item.dead) continue;
        
        const content = `${item.title || ''} ${item.text || ''}`.toLowerCase();
        const hasKeyword = KEYWORDS.some(kw => content.includes(kw.toLowerCase()));
        
        if (hasKeyword) {
          posts.push({
            platform_id: 'hackernews',
            external_id: String(item.id),
            author: item.by || 'unknown',
            author_id: item.by || 'unknown',
            content: `${item.title || ''}\n\n${item.text || ''}`.trim(),
            url: `https://news.ycombinator.com/item?id=${item.id}`,
            posted_at: new Date(item.time * 1000).toISOString(),
            engagement_score: item.score || 0,
            reply_count: item.descendants || 0,
            metadata: {
              title: item.title || '',
              type: item.type,
              link_url: item.url
            }
          });
        }
      } catch (error) {
        // Skip individual item errors
      }
    }
    
  } catch (error) {
    console.error('Error collecting from Hacker News:', error);
  }
  
  return posts;
}

// ============================================
// BLUESKY COLLECTOR
// ============================================

interface BlueskyPost {
  platform_id: 'bluesky';
  external_id: string;
  author: string;
  author_id: string;
  content: string;
  url: string;
  posted_at: string;
  engagement_score: number;
  reply_count: number;
  metadata: {
    handle: string;
    display_name?: string;
    has_images: boolean;
  };
}

export async function collectBluesky(): Promise<BlueskyPost[]> {
  const posts: BlueskyPost[] = [];
  
  // Bluesky public API endpoint
  const BSKY_API = 'https://public.api.bsky.app';
  
  for (const keyword of KEYWORDS.slice(0, 5)) { // Limit to avoid rate limits
    try {
      const response = await fetch(
        `${BSKY_API}/xrpc/app.bsky.feed.searchPosts?q=${encodeURIComponent(keyword)}&limit=50`
      );
      
      if (!response.ok) {
        console.error(`Bluesky search error: ${response.status}`);
        continue;
      }
      
      const data = await response.json();
      
      for (const item of data.posts || []) {
        const post = item.post || item;
        const author = post.author;
        const record = post.record;
        
        posts.push({
          platform_id: 'bluesky',
          external_id: post.uri,
          author: author.displayName || author.handle,
          author_id: author.did,
          content: record.text || '',
          url: `https://bsky.app/profile/${author.handle}/post/${post.uri.split('/').pop()}`,
          posted_at: record.createdAt,
          engagement_score: (post.likeCount || 0) + (post.repostCount || 0),
          reply_count: post.replyCount || 0,
          metadata: {
            handle: author.handle,
            display_name: author.displayName,
            has_images: !!(record.embed?.images?.length)
          }
        });
      }
      
      await sleep(500);
      
    } catch (error) {
      console.error(`Error collecting Bluesky for "${keyword}":`, error);
    }
  }
  
  // Deduplicate by external_id
  const seen = new Set<string>();
  return posts.filter(post => {
    if (seen.has(post.external_id)) return false;
    seen.add(post.external_id);
    return true;
  });
}

// ============================================
// MAIN COLLECTOR
// ============================================

export type SocialPost = RedditPost | HNPost | BlueskyPost;

export async function collectAll(): Promise<SocialPost[]> {
  console.log('Starting collection from all platforms...');
  
  const [reddit, hn, bluesky] = await Promise.all([
    collectReddit(),
    collectHackerNews(),
    collectBluesky()
  ]);
  
  console.log(`Collected: Reddit(${reddit.length}), HN(${hn.length}), Bluesky(${bluesky.length})`);
  
  return [...reddit, ...hn, ...bluesky];
}

// Utility
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Export for testing
export { KEYWORDS, REDDIT_SUBREDDITS };
