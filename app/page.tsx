import Link from 'next/link';
import {
  Activity,
  Database,
  Sparkles,
  BarChart3,
  Bell,
  FileText,
  ArrowRight,
  MessageSquare,
  Cpu,
  LayoutDashboard,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <header className="border-b border-border">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-6">
            <Activity className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Social Intelligence
          </h1>
          <p className="mt-3 text-lg text-muted-foreground max-w-2xl mx-auto">
            Real-time social listening and analysis for the AI industry. We collect discourse from Reddit, Hacker News, and Bluesky, analyze it with Claude, and surface themes, sentiment, and competitive insights.
          </p>
          <Link
            href="/dashboard"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Enter dashboard
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      {/* Methodology */}
      <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-xl font-semibold text-foreground mb-8">
          How it works
        </h2>

        <ol className="space-y-12">
          {/* 1. Collection */}
          <li className="flex gap-6">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-semibold">
              1
            </span>
            <div>
              <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                Data collection
              </h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Posts are collected every 15 minutes from <strong className="text-foreground">Reddit</strong> (subreddits like r/LocalLLaMA, r/ChatGPT), <strong className="text-foreground">Hacker News</strong>, and <strong className="text-foreground">Bluesky</strong>. We track keywords such as &quot;claude&quot;, &quot;chatgpt&quot;, &quot;llm&quot;, &quot;ai assistant&quot;, and related terms. Only posts matching these topics are stored to keep the signal relevant.
              </p>
            </div>
          </li>

          {/* 2. Storage */}
          <li className="flex gap-6">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-semibold">
              2
            </span>
            <div>
              <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Database className="h-4 w-4 text-primary" />
                Storage
              </h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Raw posts are stored in <strong className="text-foreground">Supabase</strong> (Postgres). Duplicates are skipped by platform + external ID. Analysis results—themes, sentiment snapshots, competitor mentions, and alerts—are written to dedicated tables so the dashboard can query them efficiently.
              </p>
            </div>
          </li>

          {/* 3. AI analysis */}
          <li className="flex gap-6">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-semibold">
              3
            </span>
            <div>
              <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                AI analysis (Claude)
              </h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Batches of new posts are sent to <strong className="text-foreground">Claude</strong> for structured analysis. The model extracts: <em>themes</em> (with frequency and sentiment), <em>audience type</em> (developer, enterprise, researcher, etc.), <em>competitor mentions</em> (e.g. Claude vs ChatGPT), and <em>sentiment</em>. Rules can trigger <strong className="text-foreground">alerts</strong> when certain conditions are met (e.g. spike in negative sentiment or a new theme).
              </p>
            </div>
          </li>

          {/* 4. Outputs */}
          <li className="flex gap-6">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-semibold">
              4
            </span>
            <div>
              <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Cpu className="h-4 w-4 text-primary" />
                Outputs
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <LayoutDashboard className="h-3.5 w-3.5 text-primary shrink-0" />
                  <strong className="text-foreground">Dashboard</strong> — Sentiment trend, top themes, competitor share of voice, and active alerts.
                </li>
                <li className="flex items-center gap-2">
                  <Bell className="h-3.5 w-3.5 text-primary shrink-0" />
                  <strong className="text-foreground">Alerts</strong> — Notifications when thresholds or patterns are hit (e.g. emerging theme, sentiment shift).
                </li>
                <li className="flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
                  <strong className="text-foreground">Digests</strong> — Daily and weekly AI-generated briefs summarizing themes, sentiment, and competitive dynamics.
                </li>
              </ul>
            </div>
          </li>
        </ol>

        {/* CTA */}
        <div className="mt-16 pt-12 border-t border-border text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Ready to explore the data?
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <BarChart3 className="h-4 w-4" />
            Enter dashboard
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </main>

      <footer className="border-t border-border mt-16">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8 text-center text-xs text-muted-foreground">
          Social Intelligence — Collect → Analyze (Claude) → Store (Supabase) → Dashboard, Alerts, Digests
        </div>
      </footer>
    </div>
  );
}
