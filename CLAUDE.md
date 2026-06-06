# CLAUDE.md

## Project
אפליקציית ווב ציבורית בעברית (RTL) להשוואת מחירים ואיתור הטבות אישיות.
- **מחירים:** מקבצי שקיפות-המחירים הרשמיים של רשתות הסופר (ingestion ל-DB) — לא scraping.
- **הטבות:** מועדונים / קניונים / יום הולדת — נשאב on-demand דרך BrightData עם caching.

משתמשים נרשמים עם Google ושומרים מועדונים + תאריך לידה בפרופיל. ה-PRD המלא: `PRD-price-benefits-finder.md`.

## Tech Stack
Next.js 14 (App Router) + TypeScript · Prisma · PostgreSQL (Supabase) · NextAuth (Google OAuth) · Tailwind CSS · shadcn/ui.
מודל ל-LLM fallback בלבד: `claude-sonnet-4-6`.

## Invariants (חוקי-ברזל)
- כל הממשק RTL ובעברית (`dir="rtl"`).
- `user_id` נלקח מה-session בלבד — לעולם לא מ-request body.
- כל fetch/scrape הוא server-side בלבד.
- מחירי סופר מקבצי שקיפות רשמיים — **אסור** scraping של HTML לרשתות הסופר.
- הרשאות בשכבת האפליקציה (Prisma + session). **אין** Supabase RLS.
- Secrets ב-env בלבד (ראה `.env.example`).

## ארכיטקטורת `.claude/`
- `skills/price-feed-ingestion` — קליטת קבצי המחירון הרשמיים (PriceFull/PromoFull/Stores).
- `skills/benefit-extraction` — דפוסי BrightData + JSON schemas + קונבנציית parse-דטרמיניסטי→LLM-fallback.
- `agents/scrape-target-builder` — מגלה/בונה `scrape_targets` להטבות (BrightData MCP).
- `agents/price-feed-ingestor` — בונה adapters לקליטת מחירים.
- `agents/vault-scribe` — מריץ את פרוטוקול ה-Obsidian vault מחוץ ל-thread הראשי.

## Vault & TODO
- Obsidian vault: `vault_sisu/vault_sisu/` — קרא/עדכן לפי סקיל `obsidian-vault-workflow` (האחריות מואצלת ל-`vault-scribe`).
- `TODO.md` — אסור להריץ משימה משם ללא אישור מפורש.
