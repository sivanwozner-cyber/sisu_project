# scrape_targets discovery report — benefits source validation

## Source chosen: `azrieli` (קניון עזריאלי) — public mall coupons page

### Why not `shufersal`
`https://www.shufersal.co.il/online/he/Club_Benefits` was fetched first (per the task's primary
target). Its content is dominated by:

> "מועדון לקוחות שופרסל מעניק הטבות אישיות, קופונים אישיים והצעות מותאמות אישית ללקוח"

i.e. the real benefit list is **personalized / behind login** — there is no stable, repeating,
anonymous-visitor block structure to regex against. The only concrete benefit-shaped text found
("3 ק"ג בהנחה ... בתוקף עד 02.02.2018") is stale/cached navigational content, not a live public
listing. This matches the SKILL.md guidance: "עמוד דורש login → סמן כ-v2".

**Decision:** `shufersal` benefits → marked `v2 / blocked (login-gated)` in
`scrape-targets.sample.json`. Fallback target `azrieli` (קניון עזריאלי) was used instead, per the
task's explicit fallback instruction — and it has a real, clean, public, paginated-by-mall coupons
listing.

### `azrieli` URLs discovered
- `https://www.azrielimalls.co.il/malls/tel-aviv/coupons`
- `https://www.azrielimalls.co.il/malls/jerusalem/coupons`
- `https://www.azrielimalls.co.il/malls/haifa/coupons`
- (general index also exists at `https://www.azrielimalls.co.il/coupons` and per-mall at
  `/malls/<slug>/coupons` for all ~19 malls — `tel-aviv` chosen as primary `urls[0]` since it best
  matches the generic "azrieli" mall slug used in this app)

> Note: BrightData MCP tools (`mcp__brightdata__scrape_as_markdown` etc.) were **not available**
> in this session (no `mcp__brightdata__*` tools registered). Discovery and verification were
> performed via `WebFetch` against the live pages instead — the fetched text below is real,
> live content from `azrielimalls.co.il`, not fabricated. The agent/skill conventions
> (fetch → deterministic parse → LLM fallback, `scrape_as_markdown` as the tool) are preserved in
> the `scrape_targets` config so the app's existing BrightData pipeline can run it unchanged.

## Real fetched markdown excerpt (from `/malls/jerusalem/coupons`, structure confirmed
verbatim, then cross-checked against `/malls/haifa/coupons` raw text)

```
TOYS`R`US

![TOYS`R`US](/_next/image?url=...)

![ערכת קסמים...](/_next/image?url=...)

### ערכת קסמים "רוצה להיות מכשף?" ב-39.90 ₪ במקום 59.90 ₪

קניונים משתתפים:אילון, ירושלים, חולון, עכו, חיפה

בתוקף עד: 30.06.26

![share](/_next/image?url=...)

Food Appeal

![Food Appeal](/_next/image?url=...)

![ווק 28 ס"מ](/_next/image?url=...)

### ווק 28 ס"מ WOKO מבית Food appeal ב-39.90 ₪ במקום 89 ₪

קניונים משתתפים:ירושלים, מודיעין, חיפה, ראשונים

בתוקף עד: 30.06.26

![share](/_next/image?url=...)

Food Appeal

![Food Appeal](/_next/image?url=...)

![סט 5 חלקים](/_next/image?url=...)

### סט 5 חלקים מבית Food appeal ב-39.90 ₪ במקום 124 ₪

קניונים משתתפים:ירושלים, מודיעין, חיפה, ראשונים

בתוקף עד: 30.06.26

![share](/_next/image?url=...)
```

Card structure (consistent across Tel Aviv / Jerusalem / Haifa pages, ~10-15 cards per mall page,
all currently sharing the same `בתוקף עד: 30.06.26` campaign-wide expiry):

```
<Brand name (plain text line)>
<blank>
![<brand>](<logo image url>)
<blank>
![<product alt text>](<product image url>)
<blank>
### <description text> ב-<sale_price> ₪ במקום <original_price> ₪
<blank>
קניונים משתתפים:<comma-separated mall list>
<blank>
בתוקף עד: <DD.MM.YY>
<blank>
![share](<icon url>)
<blank>
```

## Derived regex (verified against the real text above)

| field            | regex                                                                                  |
|------------------|----------------------------------------------------------------------------------------|
| `blockSplit`     | `(?=^###\s+.+ב-[\d.,]+\s*₪\s*במקום\s*[\d.,]+\s*₪)` (multiline lookahead — splits markdown into one chunk per `###` benefit heading) |
| `description`    | `^###\s+(.+?)\s+ב-[\d.,]+\s*₪\s*במקום\s*[\d.,]+\s*₪` → group 1 |
| `discount_pct`   | `null` — this source never publishes percentage discounts (confirmed: searched explicitly for `%` / `הנחה` patterns across all sampled cards — none found, only absolute ₪ "before/after" prices) |
| `discount_amount`| `ב-([\d.,]+)\s*₪\s*במקום\s*([\d.,]+)\s*₪` → group 1 = sale price, group 2 = original price; `discount_amount = group2 − group1` (computed in code, e.g. `59.90 − 39.90 = 20.00`) |
| `valid_to`       | `בתוקף עד:\s*(\d{1,2}\.\d{1,2}\.\d{2,4})` → group 1, format `DD.MM.YY`, normalize to ISO `20YY-MM-DD` before storage |
| `image_url`      | (bonus, not in the minimal required schema but used to populate normalized `image_url`) `!\[[^\]]*\]\((/_next/image\?url=[^)]+)\)` — take the **last** match within the block (the product photo, not the brand logo or share icon) |

### Why `###` heading anchor (not brand-name line)
The plain brand-name line (`TOYS`R`US`, `Food Appeal`) repeats per card but is **not unique** —
multiple cards share the same brand. The `### ... ב-X ₪ במקום Y ₪` heading is the only line that
(a) is markdown-structurally distinct (`###`), (b) appears exactly once per benefit, and
(c) co-locates the description + both prices in one matchable string — making it the most stable
anchor for `blockSplit` and `description`/`discount_amount` extraction simultaneously.

## 3 real samples — parsed into the normalized Benefit shape

(All three pulled from the live `/malls/haifa/coupons` and `/malls/jerusalem/coupons` fetches;
`discount_amount` computed as `original_price − sale_price`; `valid_to` normalized from `30.06.26`
→ `2026-06-30`.)

### Sample 1
```json
{
  "description": "ערכת קסמים \"רוצה להיות מכשף?\"",
  "type": "discount",
  "discount_pct": null,
  "discount_amount": 20.00,
  "valid_from": null,
  "valid_to": "2026-06-30",
  "club_id": null,
  "is_public": true,
  "source_url": "https://www.azrielimalls.co.il/malls/haifa/coupons",
  "image_url": "/_next/image?url=<product-photo-url>"
}
```

### Sample 2
```json
{
  "description": "ווק 28 ס\"מ WOKO מבית Food appeal",
  "type": "discount",
  "discount_pct": null,
  "discount_amount": 49.10,
  "valid_from": null,
  "valid_to": "2026-06-30",
  "club_id": null,
  "is_public": true,
  "source_url": "https://www.azrielimalls.co.il/malls/haifa/coupons",
  "image_url": "/_next/image?url=<product-photo-url>"
}
```

### Sample 3
```json
{
  "description": "סט 5 חלקים מבית Food appeal",
  "type": "discount",
  "discount_pct": null,
  "discount_amount": 84.10,
  "valid_from": null,
  "valid_to": "2026-06-30",
  "club_id": null,
  "is_public": true,
  "source_url": "https://www.azrielimalls.co.il/malls/haifa/coupons",
  "image_url": "/_next/image?url=<product-photo-url>"
}
```

(`image_url` left as a placeholder path here since the image URLs returned by `WebFetch`'s
summarizer were truncated/templated `/_next/image?url=...next-cdn-encoded...`; a live
`scrape_as_markdown` BrightData call will return the full `(...)` URL for the regex to capture
verbatim.)

## Regex verification method
BrightData MCP tools were unavailable in this session, so live verification was done by:
1. Fetching `/malls/jerusalem/coupons` and `/malls/haifa/coupons` via `WebFetch` with an explicit
   "return raw text verbatim, no translation/summary" instruction — confirming the literal Hebrew
   strings (`ב-X ₪ במקום Y ₪`, `קניונים משתתפים:`, `בתוקף עד: DD.MM.YY`) and the markdown card
   structure (`###` heading + image lines + blank-line separation).
2. Hand-tracing each regex against the literal returned strings (documented inline above —
   `descRe`, `amountRe`, `validToRe`, `blockSplit` all match the real `### ... ב-39.90 ₪ במקום
   59.90 ₪` / `קניונים משתתפים:...` / `בתוקף עד: 30.06.26` lines character-by-character).
3. A reusable Node harness is included at `lib/benefits/_regex_test.mjs` — paste a fresh
   `scrape_as_markdown` sample into `sampleMarkdown` and run `node lib/benefits/_regex_test.mjs`
   to re-verify after any markup change (it prints parsed normalized-Benefit JSON per block).

**Caveat:** because true BrightData `scrape_as_markdown` access wasn't available to this agent run,
the exact byte-for-byte markdown (image URL encoding, whitespace/blank-line counts, possible
`<!-- -->` comments BrightData might inject) could not be 100% confirmed — only `WebFetch`'s
rendering of the page text was available, which is structurally faithful (confirmed twice,
independently, across two different mall pages with consistent results) but may differ in minor
whitespace/markdown-decoration details from BrightData's raw markdown output. **Recommendation:**
re-run the harness in `_regex_test.mjs` against one real `scrape_as_markdown` payload the first
time this `scrape_targets` config is exercised in the actual pipeline, and adjust whitespace
(`\s*` vs `\s+`) tolerances if needed — the anchor tokens (`###`, `ב-`, `במקום`, `₪`,
`קניונים משתתפים:`, `בתוקף עד:`) themselves are verified-real and very unlikely to change.

## Fragility notes / edge cases
- **Campaign-wide expiry:** all sampled cards currently show the identical `בתוקף עד: 30.06.26` —
  this looks like a site-wide campaign end-date rather than a per-coupon expiry. Still correctly
  captured per-block; if/when the site moves to per-coupon dates, no regex change is needed.
- **No `valid_from`:** never published on this page → always `null` (per skill convention,
  `valid_to: null` would mean "never expires"; here it's `valid_from` that's structurally absent).
- **No percentage discounts:** `discount_pct` is hard-coded `null` in `fields` for this source.
  If Azrieli later adds "X% הנחה"-style cards, a secondary regex
  `(\d{1,2})%\s*הנחה` should be added as an alternate match path.
- **Multi-mall participation list:** `קניונים משתתפים:` lists several malls per coupon — a single
  coupon may be valid in malls other than the one whose page it was scraped from. Not part of the
  minimal required schema; can be parsed into a future `valid_malls: string[]` field if needed.
- **`is_public` / `club_id`:** no login wall encountered on any of the 3 mall coupon pages
  (anonymous `WebFetch` returned full content) → `is_public: true`, `club_id: null` for `azrieli`.
- **Pagination:** not observed/needed — each mall's `/coupons` page appears to list all active
  coupons for that mall on one page (≈10-15 cards). No `pagination` key included in `scrape_targets`.
- **`shufersal` is the genuinely fragile/blocked one:** flagged `v2 - blocked (login-gated)` with
  `is_public: false` defaults — do not attempt deterministic parsing against it; route straight to
  LLM-fallback-with-disclaimer or skip per the skill's "כישלון בכל המקורות → 503" convention, or
  simply exclude it from the cache-miss pipeline until an authenticated flow is designed (v2).

## Files produced
- `lib/benefits/scrape-targets.sample.json` — `{ "azrieli": {...}, "shufersal": {...} }` config object
- `lib/benefits/scrape-targets.sample.README.md` — this report
- `lib/benefits/_regex_test.mjs` — reusable regex-verification harness (Node, no deps)
