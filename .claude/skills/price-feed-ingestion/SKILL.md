---
name: price-feed-ingestion
description: How to fetch and parse the official Israeli price-transparency feeds (PriceFull / PromoFull / Stores), normalize them by barcode, and upsert into products/prices. Use when building or maintaining supermarket price ingestion (Shufersal, Rami Levy, Carrefour, Yochananof, etc.). Do NOT scrape supermarket HTML — these feeds are the canonical source.
---

# Price-Feed Ingestion

מחירי הסופר באים מקבצי שקיפות-המחירים שהרשתות מחויבות לפרסם בחוק (חוק לקידום התחרות בענף המזון, 2014). זהו המקור הקנוני — **אסור** scraping של דפי HTML של רשתות הסופר.

## מקורות (לאימות ע"י agent `price-feed-ingestor`)
- פורטל מרכזי נפוץ: `https://url.publishedprices.co.il/` (מערכת "Cerberus") — login per chain (username = קוד הרשת, סיסמה לרוב ריקה/ידועה).
- רשתות עם פורטל עצמאי: שופרסל (`prices.shufersal.co.il`) ואחרות.
- **כתובות וסיסמאות מדויקות לכל רשת — לאימות בזמן הבנייה** (ראה PRD §17). אל תניח; אמת מול הפורטל בפועל.

## סוגי קבצים (gzip של XML)
- `PriceFull<chain>-<store>-<ts>.gz` — קטלוג מחירים מלא לסניף.
- `Price<...>.gz` — עדכון אינקרמנטלי.
- `PromoFull<...>.gz` / `Promo<...>.gz` — מבצעים.
- `Stores<chain>-<ts>.gz` — רשימת סניפים.

## שדות מפתח
**PriceFull → Item:** `ItemCode` (ברקוד — מפתח ההתאמה), `ItemName`, `ManufacturerName`, `ManufacturerItemDescription`, `UnitQty`, `Quantity`, `UnitOfMeasure`, `ItemPrice`, `UnitOfMeasurePrice`, `PriceUpdateDate`.
**Header:** `ChainId`, `SubChainId`, `StoreId`.
**PromoFull → Promotion:** `PromotionId`, `PromotionDescription`, `PromotionStartDate`, `PromotionEndDate`, `DiscountedPrice`, `MinQty`.

## זרימת ingestion
1. אתר את הפורטל של הרשת והתחבר (creds מאומתים).
2. הורד את ה-`PriceFull` + `PromoFull` + `Stores` האחרונים לסניף המייצג (ראה PRD §17 — סניף מול aggregation, להחלטת המשתמש).
3. פענח gzip → parse XML (stream אם הקובץ גדול).
4. **נרמול:** trim/lowercase לשם; `ItemCode` כברקוד; דלג על שורות פגומות + log warning (אל תכתוב ל-DB פריט פגום).
5. **upsert:** `products` (barcode PK) + `prices` (per `chain_slug`/`store_branch`, כולל `promo_price` אם יש), `ingested_at = now()`.
6. תזמון: Vercel Cron / Supabase pg_cron, מספר פעמים ביום. ה-UI מציג "עודכן לאחרונה" לפי `ingested_at`.

## עקרונות
- כל ההורדה/פענוח server-side בלבד.
- כל רשת = adapter נפרד תחת `lib/ingestion/<chain>.ts` עם ממשק אחיד.
- קובץ לא זמין / פורמט השתנה → השאר נתונים אחרונים שנקלטו + log; אל תרוקן את הטבלה.
