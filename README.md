# Social Intelligence System

A real-time social listening and analysis platform that uses Claude to track AI industry discourse, identify emerging themes, and monitor competitive sentiment across Reddit, Hacker News, and Bluesky.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Data Sources                              │
├─────────────┬─────────────┬─────────────┬─────────────┬────────┤
│   Reddit    │ Hacker News │   Bluesky   │  Twitter*   │  etc.  │
└──────┬──────┴──────┬──────┴──────┬──────┴──────┬──────┴────────┘
       │             │             │             │
       └─────────────┴──────┬──────┴─────────────┘
                            │
                    ┌───────▼───────┐
                    │   Collectors  │  (every 15 min)
                    └───────┬───────┘
                            │
                    ┌───────▼───────┐
                    │   Supabase    │  posts table
                    └───────┬───────┘
                            │
                    ┌───────▼───────┐
                    │    Claude     │  Theme extraction
                    │   Analyzer    │  Sentiment analysis
                    │               │  Community ID
                    └───────┬───────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼───────┐   ┌───────▼───────┐   ┌───────▼───────┐
│   Dashboard   │   │    Alerts     │   │   Digests     │
│   (v0/React)  │   │   (Slack?)    │ │ (Daily/Weekly)│
└───────────────┘   └───────────────┘   └───────────────┘
```

## Quick Start

### 1. Set up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the contents of `supabase/schema.sql`
3. Copy your project URL and service role key

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJI...
ANTHROPIC_API_KEY=sk-ant-...
CRON_SECRET=any-random-string-for-security
```

### 3. Install & Run

```bash
npm install
npm run dev
```

### 4. Deploy to Vercel

```bash
vercel
```

The `vercel.json` includes cron configurations that will:
- Run data collection every 15 minutes
- Generate daily digest at 9 AM
- Generate weekly digest on Mondays at 9 AM

## Project Structure

```
social-intelligence/
├── app/
│   └── api/
│       ├── pipeline/run/     # Trigger collection + analysis
│       ├── dashboard/        # Dashboard data endpoint
│       ├── alerts/           # Get/acknowledge alerts
│       └── digests/          # Get/generate digests
├── components/
│   └── Dashboard.tsx         # Main dashboard component
├── lib/
│   ├── collectors.ts         # Platform data collectors
│   ├── analyzer.ts           # Claude analysis engine
│   ├── database.ts           # Supabase operations
│   └── orchestrator.ts       # Main pipeline coordinator
├── supabase/
│   └── schema.sql            # Database schema
└── vercel.json               # Cron job configuration
```

## Customization

### Adding Keywords

Edit `lib/collectors.ts`:
```typescript
const KEYWORDS = [
  'claude',
  'your-product-name',
  // add more...
];
```

### Adding Subreddits

```typescript
const REDDIT_SUBREDDITS = [
  'LocalLLaMA',
  'YourIndustrySubreddit',
];
```

### Adding Platforms

To add Twitter/X or LinkedIn:
1. Create a collector function in `lib/collectors.ts`
2. Add platform to Supabase `platforms` table
3. Call the collector in `collectAll()`

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/pipeline/run` | POST | Trigger collection + analysis |
| `/api/dashboard` | GET | Get all dashboard data |
| `/api/alerts` | GET | Get active alerts |
| `/api/alerts` | POST | Acknowledge an alert |
| `/api/digests?type=daily` | GET | Get latest digest |
| `/api/digests/generate` | POST | Generate new digest |

## Cost Estimate

At ~1000 posts/day:
- **Supabase**: $0 (free tier)
- **Claude**: ~$5-15/month
- **Vercel**: $0 (free tier)

## License

MIT
