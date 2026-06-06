# Price/Benefits App — Architecture & PRD

## Overview
The project pivoted from a personal task-management system to a **public Hebrew/RTL price-comparison + benefits-finder web app** (replaces the old task system entirely). Stack: Next.js 14 (App Router) + TypeScript, Prisma, Supabase Postgres, NextAuth (Google OAuth), Tailwind + shadcn/ui. Two data sources: **official Israeli price-transparency feeds** for supermarket prices (not HTML scraping) and **BrightData** for benefits (clubs/malls/birthday). PRD v3.0 lives at repo-root `PRD-price-benefits-finder.md` and is intended to feed Claude Code Plan Mode. This topic also covers the planned `.claude/` architecture redesign (CLAUDE.md slimming, new skills, 3 sub-agents).

## Open Questions
- Exact price-portal URLs + credentials per chain — user will provide later (blocks real price ingestion, Phase 3).
- `scrape_targets` for benefit sources not yet discovered (`scrape-target-builder` agent).
- Representative branch vs aggregation per chain for MVP prices — user deferred.
- Supabase project + `DATABASE_URL`/`DIRECT_URL` not provisioned → `prisma migrate`/seed not yet run.
- Google OAuth credentials not provided → login not runnable yet.
- Phases 3–5 (prices UI, benefits, profile/onboarding) not yet built.

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
