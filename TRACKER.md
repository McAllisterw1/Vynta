# Vynta — Build Tracker

## Current State (as of 2026-05-18)

### Live
- Full 7-tab dashboard carousel (Stats, Requests, Reviews, Home, Goals, Reports, Settings)
- Plan-based feature gating via `canAccess()` across all tabs (Starter / Professional / Agency)
- UpgradeTooltip component dims locked features and shows lock badge + hover tooltip
- Landing page with ReputationAuditWidget in hero (replaces floating card animation)
- Review request flow (SMS campaigns), AI response generation, tone options
- OurReviewsScreen — log, edit, delete reviews; recovery mode; regenerate reply
- GoalsScreen — "Your Next Move" AI cards, AI Consultant chat, suggested prompts
- AnalyticsScreen — 5 stat cards, 6-month bar chart, Score Predictor (Pro+), Weekly Report (Agency+)
- ReportsScreen — monthly reports (Agency+), Competitor Manager, Sentiment Analysis (Agency+) with smart caching
- SettingsPanel — Google review URL, business name, default tone
- Training page — 5 modules + AI Business Consultant chat
- Privacy Policy and Terms of Service pages
- SMS consent page
- Pricing section (landing page) with updated plan cards
- FAQ section with updated "Can I cancel anytime?" answer
- Markdown rendering via shared `MarkdownContent` component (react-markdown)
- Vercel cron for auto-generating monthly reports on the 1st

### In Progress / Pending
- Nothing actively in flight

### Up Next (known backlog)
- Stripe price IDs for Professional ($990/yr) and Agency ($1,990/yr) need replacing (TODOs in `plans.ts`)
- Starter plan has no `price` field for yearly — to be addressed when Stripe is wired up
- Real Google review URL setting needs to be consumed somewhere meaningful (e.g. auto-open link after request sent)
- Competitor benchmarking feature (listed in plan features, no dedicated UI yet)
- White-label dashboard for Agency plan (listed in plan features, not implemented)
- Goals feature flag (`goals: true` for Agency) — GoalsScreen exists but isn't gated yet

---

## Day-by-Day Build Log

### Day 1 — Project Foundation
- Next.js 15 App Router setup
- Clerk authentication integrated
- Prisma + Neon PostgreSQL connected (PrismaPg adapter)
- Tailwind CSS configured with Vynta design tokens (cream, tobacco, teal palette)
- Basic landing page scaffolded (Navbar, Hero, Footer)

### Day 2 — Landing Page Sections
- `Pain` section
- `Features` section (with feature grid)
- `Voices` section (testimonials)
- `Results` section (social proof stats)
- `Trust` section (trust badges)
- `FAQ` component
- `Pricing` component with plan cards

### Day 3 — Dashboard Shell + Home Tab
- `DashboardShell` — carousel navigation with slide animations, bottom floating pill navbar
- `HomeScreen` — review request form: business name, customer name/phone, rating, tone selector
- AI response generation via `/api/consultant` (Anthropic SDK, `claude-sonnet-4-6`)
- SMS campaign logging to localStorage (`vynta_campaigns`)
- Response history saved to localStorage (`vynta_response_history`)

### Day 4 — Requests Tab + Analytics Foundation
- `RequestsScreen` — campaign history list, contact count, date
- `AnalyticsScreen` scaffolded — stat cards (Total Responses, Avg Rating, Requests Sent, This Month, Top Tone)
- Monthly usage tracking via `vynta_usage_YYYY_MM` key
- 6-month bar chart (SVG, rounded-top bars, current month highlighted)

### Day 5 — Review Training Page
- `/training` route with 5 learning modules:
  1. Why Reviews Matter
  2. The Perfect Ask
  3. Timing Is Everything
  4. How to Handle Bad Reviews
  5. How to Beat the Algorithm
- `TrainingConsultant` chat component at bottom of page
- Heading: "Vynta, Your AI Business Consultant"

### Day 6 — OurReviewsScreen (Reviews Tab)
- Added Reviews tab (6th tab) to carousel
- `OurReviewsScreen` — review cards with star display, date, responded badge
- Log review modal — star rating picker (amber/gold stars), review text, date
- Edit modal — same form pre-filled
- Delete with confirmation
- Recovery Mode toggle — surfaces unresponded reviews with orange highlight
- "Generate Reply" button per review card — calls `/api/consultant`
- "Regenerate" button replaces "Copy Review" after reply generated
- Modal z-index fixed to 9999 (was below nav bar)

### Day 7 — GoalsScreen (Goals Tab)
- Added Goals tab to carousel (7th tab, default active: Home)
- `GoalsScreen` — "Your Next Move" AI cards: 3 rotating action suggestions
- AI Consultant chat box — full message thread, suggested prompt chips
- Scroll-to-top on mount fixed (50ms setTimeout to override `scrollIntoView`)
- AI Consultant gated behind `canAccess(plan, "aiConsultant")` (Pro+)

### Day 8 — Score Predictor + Weekly Report (AnalyticsScreen)
- Score Predictor card (Pro+) — target rating slider (−/+ 0.1), calculates 5-star reviews needed
- Weekly Reputation Report card (Agency+) — 4 stat rows (reviews, requests, responses, unresponded), Claude tip of the week
- Weekly tip fetched from `/api/consultant` on mount, shown as MarkdownContent
- Competitor context injected into weekly tip prompt if competitors exist

### Day 9 — ReportsScreen (Reports Tab)
- `ReportsScreen` — Monthly Reports tab, Agency-gated via UpgradeTooltip
- Report list — tappable rows showing month, avg rating, review count
- Detail modal — bottom sheet with handle, stats grid (6 cells), AI Summary, Competitor Comparison
- Manual "Generate This Month's Report" button
- `/api/reports/generate` route — builds AI summary + competitor comparison, saves to Prisma `MonthlyReport`
- `/api/reports/list` route — fetches reports by userId
- Vercel cron (`/api/cron/monthly-reports`) — runs on 1st of each month
- `MonthlyReport` added to Prisma schema, `npx prisma generate` run after

### Day 10 — Competitor Manager
- Competitor Manager collapsible section inside ReportsScreen
- Add competitor form: name, rating (1–5), review count
- Competitor list with delete button (trash icon)
- Max 5 competitors enforced
- Persisted to localStorage (`vynta_competitors`)
- Competitor data injected into monthly report generation and weekly tip API calls

### Day 11 — Plan Gating System
- `src/lib/plans.ts` — `PLANS`, `PLAN_FEATURES`, `getPlanFeatures`, `canAccess` exports
- Plans: Starter ($49), Professional ($990/yr), Agency ($1,990/yr), Growth (grandfathered)
- `UpgradeTooltip` component — dims children to 45% opacity, lock badge, hover tooltip with requiredPlan
- `FeatureKey` type — all feature flags typed
- Feature flags applied across: AnalyticsScreen (scorePredictor, weeklyReport), GoalsScreen (aiConsultant), ReportsScreen (monthlyReports, sentimentAnalysis)
- `getPlanFeatures` falls back to starter for unknown plans
- Dev route `/api/dev/set-agency` created, used, and deleted (twice) for manual plan testing

### Day 12 — Markdown Rendering + Polish
- `MarkdownContent` component — react-markdown with custom renderers matching Vynta styles
- Applied to: weekly tip, AI Consultant responses, monthly report AI summary, training consultant
- Copy improvements across dashboard (spelling, empty states, suggested prompts)
- OurReviewsScreen star rating colors updated (amber/gold)
- Review card action buttons reorganised ("Regenerate" added, "Copy Review" removed)
- `/pricing` 404 fixed — all links updated to `/#pricing`
- Google Review URL setting added to SettingsPanel, saved to `vynta_default_google_url` localStorage

### Day 13 — Landing Page Overhaul
- `ReputationAuditWidget` component — 4-step interactive audit on landing page
  - Step 1: 50 business types in scrollable 3-col grid (420px max height)
  - Step 2: Business details — name (optional), two-box rating input (`[4].[7]` format)
  - Step 3: Loading animation
  - Step 4: Results — score, headline, 3 findings, recommendation, urgency badge
- `/api/audit` route — public endpoint, calls Claude, returns structured JSON audit
- Added `/api/audit` to Clerk middleware public routes in `src/proxy.ts`
- Widget embedded in `Hero.tsx` right column (replaces floating review cards)
- CSS animations: `pulse-glow` on widget wrapper, `bounce-x` on arrow, `fade-in-up` on mount
- Rating input: two `<input>` boxes separated by a period (`ratingWhole` / `ratingDecimal` state)
- `ReviewTrainingSection` added to landing page between Trust and Pricing

### Day 14 — Sentiment Analysis (Move + Cache)
- Sentiment analysis removed from `AnalyticsScreen`
- Sentiment analysis added to `ReportsScreen` (after generate button)
- `sentimentAnalysis` plan flag changed from Professional → Agency-only (`plans.ts`)
- Smart cache: `vynta_sentiment_cache` + `vynta_sentiment_cache_key` in localStorage
- Cache key: joined review IDs (falls back to count + first/last text if IDs missing)
- On mount: if cache key matches → auto-load results, no button shown
- Refresh button: "Up to date" (green) if key matches, "New reviews detected" (amber) if stale
- Three animated horizontal bars: Positive (#2D9B8A), Neutral (#C4874A), Negative (#C0392B)
- 6 keyword pills (#E8DCC8 bg, #2C1A0E text)
- One-sentence summary line below pills

---

## Key Architecture Notes

### Data storage
All user data lives in **localStorage** (no user-specific DB tables except MonthlyReport):
| Key | Contents |
|---|---|
| `vynta_response_history` | AI response log (id, createdAt, rating, tone) |
| `vynta_requests_sent` | Total SMS requests sent (integer) |
| `vynta_usage_YYYY_MM` | Monthly AI response count |
| `vynta_stats` | `{ totalReviews, avgRating }` from HomeScreen form |
| `vynta_our_reviews` | Logged reviews (id, text, date, rating, responded, reply) |
| `vynta_campaigns` | SMS campaigns (id, createdAt, contacts[]) |
| `vynta_competitors` | Competitor list (id, name, rating, reviewCount) |
| `vynta_sentiment_cache` | Last sentiment JSON result |
| `vynta_sentiment_cache_key` | Cache key string for above |
| `vynta_default_business` | Business name |
| `vynta_default_google_url` | Google review URL |
| `vynta_default_tone` | Default tone (friendly/professional/etc.) |

### Auth & plans
- Clerk handles auth; `publicMetadata.plan` stores the plan key
- `src/proxy.ts` is the middleware file (not `middleware.ts`)
- Public routes: `/`, `/sign-in(.*)`, `/sign-up(.*)`, `/success`, `/api/checkout`, `/api/webhooks/stripe`, `/api/audit`

### API routes
| Route | Method | Purpose |
|---|---|---|
| `/api/consultant` | POST | All Claude calls (system + messages[]) |
| `/api/audit` | POST | Public reputation audit for landing widget |
| `/api/reports/generate` | POST | Generate + save monthly report |
| `/api/reports/list` | GET | Fetch reports by userId |
| `/api/cron/monthly-reports` | GET | Vercel cron — runs 1st of month |
| `/api/checkout` | POST | Stripe checkout session |
| `/api/webhooks/stripe` | POST | Stripe webhook handler |

### Dashboard tabs
| Index | Tab | Default |
|---|---|---|
| 0 | Stats (AnalyticsScreen) | |
| 1 | Requests (RequestsScreen) | |
| 2 | Reviews (OurReviewsScreen) | |
| 3 | Home (HomeScreen) | ✓ |
| 4 | Goals (GoalsScreen) | |
| 5 | Reports (ReportsScreen) | |
| 6 | Settings (SettingsPanel) | |

### Stripe price IDs (TODO)
- Professional yearly: `price_1TTYgRFVvYQFnNKtkLbjDOre` — needs replacing with real ID
- Agency yearly: `price_1TTYlGFVvYQFnNKtl6DXtrYm` — needs replacing with real ID
