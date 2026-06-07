# Price/Benefits App — Architecture & PRD

## Overview
The project pivoted from a personal task-management system to a **public Hebrew/RTL price-comparison + benefits-finder web app** (replaces the old task system entirely). Stack: Next.js 14 (App Router) + TypeScript, Prisma, Supabase Postgres, NextAuth (Google OAuth), Tailwind + shadcn/ui. Two data sources: **official Israeli price-transparency feeds** for supermarket prices (not HTML scraping) and **BrightData** for benefits (clubs/malls/birthday). PRD v3.0 lives at repo-root `PRD-price-benefits-finder.md` and is intended to feed Claude Code Plan Mode. This topic also covers the planned `.claude/` architecture redesign (CLAUDE.md slimming, new skills, 3 sub-agents).

## Open Questions
- Exact price-portal URLs + credentials per chain — user will provide later (blocks real price ingestion, Phase 3).
- `scrape_targets` for benefit sources not yet discovered (`scrape-target-builder` agent).
- Representative branch vs aggregation per chain for MVP prices — user deferred.
- Supabase project + `DATABASE_URL`/`DIRECT_URL` not provisioned → `prisma migrate`/seed not yet run.
- Google OAuth credentials not provided → login not runnable yet.
- BrightData fetch endpoint not yet wired (`lib/brightdata.ts` throws) → benefits return cached/empty until integrated.
- `headroom-ai` installed as a dependency but NOT yet integrated into the LLM fallback path (`lib/anthropic.ts`) → no token-compression in effect yet; decide whether/where to apply it.

## Session Log

### 2026-06-06 — PRD v3 + architecture plan [planned]
- **What was done:** Ran a clarifying-questions round on the v2 PRD, got decisions, rewrote PRD to v3.0 at repo root. Drafted (not yet built) the `.claude/` architecture proposal + phased build plan; awaiting approval.
- **Decisions (why):**
  - App **replaces** task-management system (user pivot) → CLAUDE.md to be rewritten.
  - **Official price-transparency feeds** for supermarket prices instead of HTML scraping → more reliable/legal/fast; BrightData reserved for benefits.
  - **Fetch/parse separation**: deterministic parse first, Claude (`claude-sonnet-4-6`) LLM only as fallback → cost/latency.
  - **App-layer authz** (NextAuth + session), dropped Supabase RLS/`auth.uid()` → NextAuth JWT ≠ Supabase Auth.
  - **MVP synchronous**, dropped jobs/polling subsystem → Vercel serverless has no reliable background; over-engineered at current scale.
  - **Barcode-first product matching**, name/manufacturer fallback.
  - Updated model id `claude-sonnet-4-20250514` → `claude-sonnet-4-6`.
  - 3 sub-agents chosen: `scrape-target-builder`, `price-feed-ingestor`, `vault-scribe` (vault protocol moved off main thread).
- **Notes / Caveats:** No code written. Vault root confirmed as `vault_sisu/vault_sisu/`. Old PRD original remains in user's Downloads; new v3 written into the project.
- **Related:** none (first entry on this topic)

### 2026-06-06 — Build: foundation (Phases 0–2) [wip]
- **What was done:** Plan approved. Built & verified Phases 0–2:
  - *Phase 0:* rewrote CLAUDE.md (slim, invariants); scaffolded Next.js 14 + TS + Tailwind + shadcn foundation (RTL `app/layout.tsx`, `globals.css`, `lib/utils`); `.env.example`/`.gitignore`/`.eslintrc`. `npm run build` green.
  - *Phase 1:* skills `price-feed-ingestion`, `benefit-extraction`; sub-agents `scrape-target-builder`, `price-feed-ingestor`, `vault-scribe` under `.claude/`.
  - *Phase 2:* Prisma schema (users, user_clubs, clubs, stores, malls, products, prices, benefit_cache, jobs; snake_case `@@map`); `lib/prisma.ts`, `lib/auth.ts` (NextAuth Google + JWT + custom-user upsert + onboarding refresh), `types/next-auth.d.ts`, `app/api/auth/[...nextauth]`, `middleware.ts`, `prisma/seed.ts`. `prisma generate` + `npm run build` green.
- **Decisions (why):** Bumped Next.js → `^14.2.35` (npm flagged 14.2.15 CVE). Middleware excludes `/api` so API routes self-enforce 401 (per PRD), pages get auth + onboarding redirect. `profileComplete` kept in JWT, refreshed on `trigger==="update"` so middleware gates onboarding without per-request DB hits.
- **Notes / Caveats:** `.claude/settings.json` permissions edit (add `mcp__brightdata`/`WebFetch` allowlist) was **denied** by the auto-mode classifier (existing auto-commit/push hook flagged as self-modification) — left untouched; agents still declare tools in frontmatter. Local `.env` placeholders created (gitignored) for build only; migrations NOT run (no real DB). Build-only — did not invoke sub-agents; vault written directly.
- **Related:** [[project-files-documentation]]

### 2026-06-06 — Build: features (Phases 3–5) [wip]
- **What was done:** Built & verified (full `next build` green — 16 routes) the feature layer against sample data:
  - *UI shell:* shadcn primitives (button/card/input/label/badge/skeleton), `app/providers.tsx` (SessionProvider), `components/sidebar.tsx`, `app/(app)/layout.tsx`; `/` → redirect to `/prices`.
  - *Auth flows:* `/login` (Google), `/onboarding` + `/profile` sharing `components/profile-form.tsx`, `app/api/profile` (GET/PATCH with validation + `profile_complete`).
  - *Prices:* `lib/ingestion/*` (adapter framework + upsert), `lib/prices.ts` (barcode-first grouping, lowest badge), `/api/prices/search`, `/prices` UI, `/api/cron/ingest` + `vercel.json` (6h cron); sample products/prices added to seed.
  - *Benefits:* `lib/benefits.ts` (cache read + club filtering + `is_expired` + Haversine mall match), `lib/brightdata.ts` (stub — throws until wired), `lib/anthropic.ts` (Sonnet 4.6 LLM fallback), `/api/benefits/{by-store,nearby,birthday}`, `components/benefit-card.tsx`, `/benefits` `/nearby` `/birthday` UI.
- **Decisions (why):** Route group `(app)` carries the sidebar; `/api` excluded from middleware so routes self-enforce 401. LLM extractor pinned to `claude-sonnet-4-6` (cost — checked against the claude-api skill, which otherwise defaults to Opus). BrightData fetch deliberately not guessed — throws `BrightDataError`, benefits degrade to cached/partial. Prices modeled as a periodically-ingested local dataset, not a per-query TTL cache.
- **Notes / Caveats:** Runtime still needs real creds (Supabase DB, Google OAuth, BrightData token, price portals) — all deferred by user; app builds and is type-safe but unseeded/unwired flows return empty. No migrations run. Deploy (Phase 6) is user-side.
- **Related:** [[project-files-documentation]]

### 2026-06-07 — Add headroom-ai dependency (LLM context compression) [shipped]
- **What was done:** `npm install headroom-ai` → `headroom-ai@0.22.4` added to `dependencies` in `package.json`. Verified on the npm registry before installing (it is NOT the UI lib `headroom.js` — distinct package: "Compress LLM context. Save tokens."). Apache-2.0, signed, with adapters for Anthropic/OpenAI/Gemini/Vercel AI SDK. Added 1 package only.
- **Decisions (why):** Checked registry first because the name resembled a typosquat of `headroom.js`. Confirmed legitimate + relevant to the project's LLM fallback usage. Its peer deps (`ai`/`openai`/`@anthropic-ai/sdk`/`@ai-sdk/provider`) are all optional, and the existing `@anthropic-ai/sdk@0.30.1` already satisfies the Anthropic adapter (`>=0.30.0`) → no forced transitive installs. Anthropic adapter import path: `headroom-ai/anthropic`.
- **Notes / Caveats:** Young package (first published 2026-03-27, only two versions `0.1.0`→`0.22.4`, two maintainers) — not battle-tested. The 10 `npm audit` vulnerabilities reported are **pre-existing** in the tree, not introduced by this install; did NOT run `npm audit fix --force` (breaking). Not yet wired into `lib/anthropic.ts` (see Open Questions). Lands in `dependencies`, not `devDependencies`.
- **Related:** [[project-files-documentation]]
