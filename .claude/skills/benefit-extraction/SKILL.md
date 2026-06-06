---
name: benefit-extraction
description: BrightData usage patterns + JSON schemas for extracting club/store/mall/birthday benefits, using a deterministic-parse-first, Claude-LLM-fallback convention. Use when building or maintaining benefit scraping (/benefits, /nearby, /birthday).
---

# Benefit Extraction

הטבות (מועדונים / חנויות / קניונים / יום הולדת) נשאבות on-demand דרך BrightData, server-side בלבד, עם caching.

## בחירת כלי BrightData לפי context
- `scrape_as_markdown` — עמוד הטבות גנרי (ברירת מחדל).
- `scrape_batch` — מספר URLs במקביל (כמה מועדונים/חנויות בבת אחת).
- `web_data_*` — רק אם קיים endpoint מובנה לאתר ספציפי.

## קונבנציית fetch → parse → fallback (חובה)
1. **fetch** דרך BrightData.
2. **parse דטרמיניסטי קודם:** selectors/regex מתוך `scrape_targets` (jsonb) של המקור. זול, מהיר, צפוי.
3. **LLM fallback רק בכישלון parse:** קריאה ל-Claude (`claude-sonnet-4-6`, `temperature: 0`) עם ה-schema הקשיח למטה ב-system prompt; הפלט נכנס ל-cache.
4. כישלון בכל המקורות → `503`, לא נכתב ל-cache. כישלון חלקי → תוצאות חלקיות + `sources_failed` (banner צהוב).

## Benefit schema (פלט מנורמל — תואם PRD §8)
```json
{
  "description": "string",
  "type": "discount | cashback | gift | birthday",
  "discount_pct": "number | null",
  "discount_amount": "number | null",
  "valid_from": "ISO8601 | null",
  "valid_to": "ISO8601 | null",
  "club_id": "string | null",
  "is_public": "boolean",
  "source_url": "string",
  "image_url": "string | null"
}
```
- `valid_to = null` → ללא תפוגה, מוצג תמיד. פג תוקף → `is_expired: true` (נגזר בקריאה), מוצג מעומעם.
- מיפוי badge: discount=כחול, cashback=ירוק, gift=סגול, birthday=כתום.

## Cache TTL
- הטבות חנות/קניון: 6 שעות (per store_slug / mall_slug).
- הטבות יום הולדת: 7 ימים (per birth_month).
- freshness חלקי → fetch רק למקורות שפגו.

## עקרונות
- כל fetch/LLM server-side בלבד; API keys ב-env.
- נתון פגום → skip + log, לא נכתב ל-cache.
- בניית/תיקון `scrape_targets` נעשית ע"י agent `scrape-target-builder`.
