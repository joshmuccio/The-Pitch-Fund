# Product Requirements Document (PRD) — The Pitch Fund Website (v1.0)

**Last updated:** June 24 2025

⸻

## 0. Executive Summary

Build a dynamic, investor-grade site at thepitch.fund that (1) converts visitors into LP leads and email subscribers, (2) showcases our portfolio companies with public-only info, and (3) grants existing LPs a secure portal for quarterly metrics and founder updates. MVP ships by July 31 2025 and is implemented solo in Cursor with AI pair-programming, using well-documented frameworks and minimal maintenance overhead.

⸻

## 1. Goals & Success Metrics

| Goal | KPI | MVP Target (monthly) |
|------|-----|---------------------|
| Generate qualified LP interest | Completed "Request Intro" forms | ≥ 10 |
| Grow mailing list | New Beehiv subscribers | ≥ 40 |
| Validate LP portal engagement | Avg. dwell time on LP-only pages | ≥ 2 min |
| Measure portfolio buzz | Clicks on "Share profile" & outbound links | Baseline → +20% MoM after launch |

⸻

## 2. Key Audiences & Top Jobs

| Segment | Key Job on Site | Access Tier |
|---------|----------------|-------------|
| Prospective LPs | Understand fund thesis → browse portfolio → request intro → join list | Public → Auth (post-approval) |
| Existing LPs | Review private KPIs, founder updates, documents | Auth |
| Founders / VCs / Media | Validate fund credibility, share company page | Public |
| Pitch Listeners | Discover startups, binge episodes | Public |

⸻

## 3. Scope — MVP Features

| # | Feature | Detail |
|---|---------|--------|
| 3.1 | Landing / Hero | Bold challenger copy, radial gold "dawn" gradient, email-capture CTA (Beehiv API). |
| 3.2 | Portfolio Directory | Filter + search (industry, stage, location). Cards pull from companies table. |
| 3.3 | Company Profile | **Public:** logo, tagline, tags, latest round, employees, status, blurb, deck link, podcast + YouTube embed, auto "In the News" feed.<br/>**Private:** quarterly KPIs graph, founder updates transcript + AI summary. |
| 3.4 | Request Intro Flow | Button → form (Supabase insert + email to intro@thepitch.fund). |
| 3.5 | Global Newsfeed | Home-page section scraping public funding/press hits (free SERP/RSS) into embeddings for v2 AI. |
| 3.6 | Auth & LP Portal | Supabase email-magic-link; manual role assignment (lp / admin). Row-Level Security for private data. |
| 3.7 | Admin / CMS | Supabase Studio + SQL seeds for content management. |
| 3.8 | Analytics | GA4 events: email_signup, intro_request, lp_login. |
| 3.9 | SEO | Clean slugs /portfolio/<slug>, OpenGraph, JSON-LD, prerendered static. |

**Out-of-scope (v1):** deal room, job board, founder self-service logins, paid datasets, AI Q&A interface.

⸻

## 4. Technical Architecture

| Layer | Choice | Reason |
|-------|--------|--------|
| Front-end | Next.js 14 (App Router, TS) + Tailwind + Custom Components | SEO-friendly SSG + dynamic routes; no vendor lock-in. |
| Auth & DB | Supabase (Postgres, RLS, Storage, pgvector) | All-in-one; CLI migrations; scalable. |
| UI/Design | Custom React Components + Tailwind Brand System | Full control; fast iteration; no complexity. |
| AI Utilities | OpenAI via Vercel AI SDK / LangChain | Email parsing, news summarisation, future Q&A. |
| Hosting | Vercel | Push-to-deploy, DNS for thepitch.fund. |
| Email | Beehiv API; intro alias intro@thepitch.fund | Single source of truth for comms. |
| Analytics | GA4 | Standardised reporting. |

⸻

## 5. Data Model (Supabase schema.sql implemented)

### Tables
- **profiles**(id uuid, role enum<admin|lp>)
- **companies** — public company metadata
- **kpis, kpi_values** — private metrics
- **founder_updates** — LP-only narratives + AI summaries
- **embeddings** — pgvector for future semantic search

### RLS Highlights
- Anyone can SELECT from companies.
- Only users with role in ('lp','admin') read private tables.
- Only admin writes across all tables.

⸻

## 6. Brand & Design System

| Token | Hex | Usage |
|-------|-----|--------|
| pitch-black | #0B0B0C | Primary background |
| graphite-gray | #1A1B1F | Section contrast |
| platinum-mist | #EAEAEA | Body text on dark |
| cobalt-pulse | #3E8FFF | CTAs, links |
| dawn-gold gradient | #F6C352 → #B48811 | Accent sheen / hover |
| error-alert | #FF4E1A | Validation |

**Typography:** Inter, bold headlines, generous tracking.  
**Imagery:** Podcast cover art, founder headshots; avoid stock.  
**Tone:** Bold challenger, transparent, no jargon.

⸻

## 7. Roadmap & Milestones

| Week (2025) | Deliverables |
|-------------|--------------|
| Jun 24-30 | ✅ Repo bootstrap, color tokens, Supabase schema + RLS live, DNS → Vercel. |
| Jul 1-7 | Homepage content, portfolio directory wireframes, component library expansion. |
| Jul 8-14 | Directory & profile pages wired to Supabase. |
| Jul 15-21 | Auth & LP gating, intro form + email workflow. |
| Jul 22-27 | Newsfeed scraper, GA4 events, Lighthouse ≥ 90, SEO pass. |
| Jul 28-31 | Content load, pilot LP test, prod deploy → **MVP Launch**. |

⸻

## 8. Open Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Solo dev + tight schedule | Slip launch date | Rely on AI pair-programming, scope freeze after Jul 7. |
| Scraper rate limits | Incomplete newsfeed | Cache results, use alternate RSS sources. |
| RLS mis-config exposes data | Major | Manual test plus automated Postman smoke tests before prod. |
| UI complexity without visual editor | Slower iteration | Use excellent Tailwind system + component library approach. |

⸻

## 9. Future (v2+) Parking Lot
- Integrated Deal Room (replace DocSend)
- AI Q&A chat over embeddings + transcripts
- Portfolio Job Board (public)
- Founder self-service update portal
- Real-time KPI dashboards (Supabase Realtime → charts.js)

⸻

## 10. Appendix

### Setup Scripts
- **schema.sql** — database & RLS
- **README.md** — dev checklist (clone → deploy)

### Architecture Decision
**Removed Plasmic** (June 24, 2025): Simplified to pure React + Tailwind for:
- Faster development velocity
- No vendor lock-in
- Full control over components
- Reduced complexity and dependencies

⸻

## Approval

| Role | Name | Sign-off |
|------|------|----------|
| Product Owner | Josh Muccio | ☐ |
| Tech Lead | (self-serve AI) | ✅ |
| Design | — | ☐ |
| Legal | — | ☐ |

**Next action:** Deploy to Vercel and continue with homepage content development using the clean React + Tailwind architecture. 