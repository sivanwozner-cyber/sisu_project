# PRD: מערכת השוואת מחירים ואיתור הטבות

**גרסה:** 3.0
**קהל יעד:** Claude Code — Plan Mode
**סוג מוצר:** אפליקציית ווב ציבורית — כל משתמש מחפש על עצמו

> שינויים מרכזיים מ-v2.0 (הוכרעו מול בעל המוצר):
> 1. **מחירי סופר נשאבים מקבצי שקיפות-המחירים הרשמיים** (חוק שקיפות מחירים), לא מ-scraping של HTML.
> 2. **BrightData שמור להטבות בלבד** (מועדונים / קניונים / יום הולדת).
> 3. **הפרדה בין שליפה (fetch) לחילוץ (parse):** parsing דטרמיניסטי קודם, LLM רק כ-fallback.
> 4. **הרשאות בשכבת האפליקציה** (NextAuth + session) — לא Supabase RLS.
> 5. **MVP סינכרוני** — בוטלה תת-מערכת ה-jobs/polling (ראה §6).
> 6. **התאמת מוצרים לפי ברקוד** קודם, שם/יצרן כ-fallback.

---

## 1. סיכום

אפליקציית ווב ציבורית בעברית (RTL) לשני צרכים:
- **השוואת מחירים** של מוצרי סופר בין רשתות ישראליות — מתוך **קבצי המחירון הרשמיים** שהרשתות מחויבות לפרסם בחוק.
- **איתור הטבות אישיות** לפי המועדונים של המשתמש, קניונים קרובים, ויום הולדת — נשאב on-demand דרך **BrightData** עם caching.

כל משתמש נרשם עם Google, שומר מועדונים ותאריך לידה בפרופיל, ומקבל תוצאות מותאמות.

---

## 2. בעיה ומשתמשים

**בעיה:** גולשים מבזבזים זמן בגלישה ידנית במספר אתרי רשתות ופורטלי מועדון כדי למצוא מחיר טוב או הטבה רלוונטית.
**משתמשים:** כל אחד — ציבורי, self-service.
**Scale MVP:** עשרות משתמשים — Vercel + Supabase ללא scaling מיוחד.

---

## 3. Stack טכני

| שכבה | טכנולוגיה | הערות |
|------|-----------|--------|
| Frontend + API | Next.js 14 (App Router) + TypeScript | ריפו אחד, full-stack |
| UI | shadcn/ui + Tailwind CSS | `dir="rtl"` לכל האפליקציה |
| Auth | NextAuth.js — Google OAuth | self-registration, ללא whitelist |
| Database | PostgreSQL על Supabase | |
| ORM | Prisma | parameterized queries |
| מחירי סופר | קבצי שקיפות-מחירים רשמיים | ingestion מתוזמן ל-DB |
| הטבות | BrightData (server-side) | fetch + parse דטרמיניסטי, LLM fallback |
| LLM (fallback בלבד) | Claude API — `claude-sonnet-4-6` | חילוץ JSON כשה-parser נכשל |
| Deployment | Vercel + Supabase | HTTPS, ללא VPN |

---

## 4. אימות ו-Onboarding

### זרימת הרשמה ראשונה
1. משתמש חדש לוחץ "התחבר עם Google".
2. Google OAuth callback → NextAuth יוצר רשומה ב-`users` אם לא קיימת.
3. `profile_complete = false` → redirect ל-`/onboarding`.
4. **עמוד onboarding:**
   - בחירת מועדונים (checkboxes): כאל, לאומי קארד, מועדון חברים, יורוקום.
   - הזנת תאריך לידה (date picker) — אופציונלי, ניתן לדלג.
   - "סיום" → שמירה ב-DB → `profile_complete = true` → redirect ל-`/`.
5. משתמש חוזר: Google login → session → redirect ל-`/`.

### כללים
- כל route מחוץ ל-`/login` + `/onboarding` דורש session — middleware מגן.
- `profile_complete = false` שמנסה לגשת ל-`/` → redirect ל-`/onboarding`.
- אין whitelist — כל חשבון Google מתקבל.

---

## 5. שכבת נתונים — שני מקורות נפרדים

### 5.1 מחירי סופר — קבצי שקיפות-מחירים רשמיים (לא scraping)

לפי חוק שקיפות המחירים, הרשתות מפרסמות קבצים מובְנים (XML, לרוב gzip) הכוללים:
- `PriceFull` — קטלוג מחירים מלא לכל סניף.
- `PromoFull` — מבצעים.
- `Stores` — רשימת סניפים.

**זרימת ingestion (מתוזמנת, לא per-request):**
```
Cron (Supabase pg_cron / Vercel Cron, מספר פעמים ביום)
   → per-chain adapter: איתור הפורטל → הורדת PriceFull+PromoFull+Stores אחרונים
   → פענוח gzip/XML
   → נרמול לפי ItemCode (ברקוד)
   → upsert ל-`products` + `prices` (per chain/branch)
```

- כל רשת = adapter נפרד (הפורטל המדויק והאישורים נקבעים ע"י סוכן `price-feed-ingestor` בזמן הפיתוח).
- MVP: סניף מייצג אחד לכל רשת (או aggregation), נקבע בפיתוח.
- חיפוש מחיר ב-runtime = **שאילתת DB** (לא scrape) → מהיר ואמין.

### 5.2 הטבות — BrightData

```
API Route (server-side) → BrightData fetch → parse דטרמיניסטי → [fallback] Claude API JSON
```

- כלים: `scrape_as_markdown` (עמודי הטבות), `scrape_batch` (מספר URLs), `web_data_*` (אם יש endpoint מובנה).
- **parse דטרמיניסטי קודם** (selectors/regex ב-`scrape_targets`); רק בכישלון → קריאת LLM עם schema קשיח, temperature נמוך, ותוצאה נכנסת ל-cache.
- `scrape_targets` (jsonb) בכל club/store/mall — מתגלה ונבנה ע"י סוכן `scrape-target-builder` בזמן הפיתוח.
- כל קריאות ה-fetch הן server-side בלבד.

---

## 6. ביצוע בקשות — סינכרוני (MVP)

תת-מערכת ה-jobs/polling מ-v2 **בוטלה ל-MVP** (Vercel serverless לא מריץ background אמין אחרי שליחת ה-response, והיא מיותרת בקנה המידה הנוכחי):

- **מחירים:** שאילתת DB ישירה → תשובה מיידית (<300ms).
- **הטבות:** קריאה סינכרונית. cache hit → מיידי. cache miss → fetch מקבילי של המקורות בתוך ה-route (`maxDuration` מוגדל, יעד <8ש'); מקור שחורג מהחלון מסומן ככשל חלקי (banner).
- טבלת `jobs` נשמרת **אופציונלית** ל-audit/דיווח כשל-חלקי בלבד, לא כמנוע polling.
- **v2:** queue (QStash / pg_cron) + progressive results אם ה-volume יגדל.

---

## 7. פיצ'רים פונקציונליים

### 7.1 השוואת מחירים — `/prices`

1. חיפוש חופשי (שם מוצר) או בחירת קטגוריה.
2. **שאילתת DB** מול `products`/`prices` (נתונים מ-ingestion).
3. **זהות מוצר לפי ברקוד** (`ItemCode`) → התאמה מדויקת בין רשתות; חוסר ברקוד משותף → fallback להתאמת שם+יצרן מנורמלים.
4. תצוגה: **מקובץ לפי יצרן/מותג**, ממוין מהזול ליקר בתוך כל קבוצה.
5. badge "המחיר הנמוך" על הכרטיס הזול ביותר בקבוצה.
6. הצגת "עודכן לאחרונה" לפי זמן ה-ingestion של כל רשת.

**כרטיס:** לוגו רשת | שם מוצר | **מחיר** | יחידה | ברקוד | קישור (אם קיים).

---

### 7.2 הטבות לפי חנות — `/benefits`

1. חיפוש חנות עם autocomplete (מתוך `stores`).
2. מועדוני המשתמש נטענים מ-`user_clubs` — ניתנים לעריכה זמנית לחיפוש הנוכחי (לא נשמר).
3. Cache check: `benefit_cache` — TTL 6 שעות per store_slug. freshness חלקי → fetch רק למקורות שפגו.
4. Cache miss → fetch דרך BrightData (§5.2).

**תצוגה:**
- הטבות פומביות (`is_public = true`): לכולם.
- הטבות מועדון: רק אם המשתמש חבר במועדון.
- כפתור **"לאפליקציה ←"** לכל הטבת מועדון → `club.app_url`.
- הטבות שפגו: מעומעמות, לא מוסתרות.

**badge:** הנחה=כחול | קאשבק=ירוק | מתנה=סגול | יום הולדת=כתום
**toggle:** "הכל" / "שלי בלבד"

---

### 7.3 הטבות לפי מיקום — `/nearby`

1. "אתר אותי" → `navigator.geolocation.getCurrentPosition()`.
2. GPS נדחה → input ידני של עיר/קניון.
3. קניון קרוב: Haversine, רדיוס 2 ק"מ (GPS) / שם מדויק (manual) — מול `malls`.
4. Cache: TTL 6 שעות per mall_slug.
5. ברירת מחדל: **פעיל היום** (valid_from ≤ TODAY ≤ valid_to).
6. toggle "כולל עתידי" → +30 יום.
7. ממוין לפי valid_from עולה.

---

### 7.4 הטבות יום הולדת — `/birthday`

1. תאריך לידה נטען מהפרופיל (אם הוזן).
2. חסר → date picker (לא נשמר; להשלמה ב-`/profile`).
3. Cache: TTL **7 ימים** per birth_month.
4. Cache miss → fetch הטבות יום-הולדת מהמקורות.
5. תוצאות מקובצות לפי חנות/רשת.

---

### 7.5 פרופיל — `/profile`

1. הצגה ועריכה: מועדוני חבר (checkboxes) + תאריך לידה (date picker).
2. שמירה → עדכון `users` + `user_clubs`.
3. אין מחיקת חשבון ב-MVP.

---

## 8. API Specification

> כל routes דורשים session תקפה. ללא session → `401`. `user_id` נלקח מה-session בלבד.

### POST `/api/prices/search`
**Request:** `{ "query": "string (2–100)", "category": "string | null" }`
**Response 200:**
```json
{
  "groups": [
    {
      "manufacturer": "string | null",
      "items": [
        { "store": "string", "store_logo_url": "string", "product_name": "string",
          "barcode": "string | null", "price": "number", "unit": "string | null",
          "is_lowest": "boolean", "updated_at": "ISO8601" }
      ]
    }
  ]
}
```
**Errors:** `400` query חסר

---

### POST `/api/benefits/by-store`
**Request:** `{ "store_slug": "string", "override_clubs": ["club_id"] | null }`
**Response 200:** `{ "user_clubs": ["club_id"], "benefits": [Benefit], "cache_hit": "boolean", "sources_failed": ["club_id"] }`

**Benefit:**
```json
{ "id": "uuid", "description": "string", "type": "discount|cashback|gift|birthday",
  "discount_pct": "number|null", "discount_amount": "number|null",
  "valid_from": "ISO8601|null", "valid_to": "ISO8601|null", "club_id": "string|null",
  "is_public": "boolean", "is_expired": "boolean", "club_app_url": "string|null",
  "source_url": "string", "image_url": "string|null", "store_slug": "string", "scraped_at": "ISO8601" }
```
**Errors:** `400` store_slug חסר | `404` חנות לא קיימת | `503` כל המקורות נכשלו

---

### POST `/api/benefits/nearby`
**Request:** `{ "lat": "number|null", "lng": "number|null", "manual_location": "string|null" }`
**Response 200:** `{ "matched_malls": [{ "slug","name","distance_km":"number|null" }], "benefits": [Benefit], "upcoming_count": "number", "sources_failed": [] }`
**Errors:** `400` לא סופק מיקום | `404` אין קניון בטווח

---

### POST `/api/benefits/birthday`
**Request:** `{ "birthdate": "YYYY-MM-DD" }`
**Response 200:** `{ "birth_month": "number", "benefits": [Benefit] }`
**Errors:** `400` פורמט תאריך שגוי

---

### GET `/api/profile` → `{ id, name, email, birthdate, clubs:[club_id], profile_complete }`
### PATCH `/api/profile` → אותו shape. **Errors:** `400` birthdate שגוי | `400` club_id לא קיים

---

## 9. מודל נתונים

### users
| עמודה | סוג | הערות |
|-------|-----|--------|
| id | uuid PK | |
| email | text UNIQUE NOT NULL | |
| name | text | מ-Google |
| google_id | text UNIQUE NOT NULL | |
| birthdate | date | nullable |
| profile_complete | boolean DEFAULT false | |
| created_at | timestamptz | |

### user_clubs
`(user_id uuid FK, club_id text FK→clubs.slug)` — PK `(user_id, club_id)`.

### clubs
`slug text PK | name | logo_url | app_url | scrape_targets jsonb`
(`cal`, `leumi-card`, `moadon-haverim`, `jurocum`)

### stores
`slug text PK | name | logo_url | scrape_targets jsonb`

### malls
`slug text PK | name | lat float8 | lng float8 | scrape_targets jsonb`

### products  *(חדש — קטלוג מנורמל מקבצי המחירון)*
| עמודה | סוג | הערות |
|-------|-----|--------|
| barcode | text PK | `ItemCode` |
| name | text | שם מנורמל |
| manufacturer | text | nullable |
| unit | text | nullable |
| category | text | nullable |

### prices  *(חדש — מחיר per רשת/סניף)*
| עמודה | סוג | הערות |
|-------|-----|--------|
| id | uuid PK | |
| barcode | text FK→products | |
| chain_slug | text | shufersal / rami-levy / carrefour / yochananof |
| store_branch | text | nullable |
| price | numeric(10,2) | |
| promo_price | numeric(10,2) | nullable |
| ingested_at | timestamptz | |
| INDEX | (barcode, chain_slug) | |
| INDEX | (chain_slug, ingested_at) | |

### benefit_cache
| עמודה | סוג | הערות |
|-------|-----|--------|
| id | uuid PK | |
| store_slug | text | nullable FK→stores |
| mall_slug | text | nullable FK→malls |
| club_id | text | nullable |
| description | text | |
| type | enum(discount,cashback,gift,birthday) | |
| discount_pct | numeric(5,2) | nullable |
| discount_amount | numeric(10,2) | nullable |
| valid_from / valid_to | date | nullable |
| is_public | boolean DEFAULT true | |
| club_app_url / source_url / image_url | text | |
| scraped_at | timestamptz | |
| INDEX | (store_slug, scraped_at), (mall_slug, scraped_at) | |

### jobs  *(אופציונלי — audit בלבד)*
`id uuid PK | user_id FK | type | status | input jsonb | results jsonb | sources_failed text[] | created_at | updated_at`

---

## 10. Seed Data (MVP)

```sql
INSERT INTO clubs (slug, name, app_url) VALUES
  ('cal','כאל','https://www.cal-online.co.il/'),
  ('leumi-card','לאומי קארד','https://www.max.co.il/'),
  ('moadon-haverim','מועדון חברים','https://www.moadon-haverim.co.il/'),
  ('jurocum','יורוקום','https://www.jurocum.co.il/');

INSERT INTO stores (slug, name) VALUES
  ('shufersal','שופרסל'),('rami-levy','רמי לוי'),
  ('carrefour','קרפור'),('yochananof','יוחננוף');

INSERT INTO malls (slug, name, lat, lng) VALUES
  ('azrieli','קניון עזריאלי',32.0735,34.7925),
  ('ramat-aviv','קניון רמת אביב',32.1133,34.8029);
```
> `scrape_targets` וכתובות פורטלי המחירון נקבעים בפיתוח ע"י הסוכנים הייעודיים.

---

## 11. Cache / Refresh

| סוג | מנגנון |
|-----|--------|
| מחירים | ingestion מתוזמן (מספר פעמים ביום); "עודכן לאחרונה" מוצג |
| הטבות חנות / קניון | TTL 6 שעות |
| הטבות יום הולדת | TTL 7 ימים |

---

## 12. אבטחה

- **Auth:** NextAuth.js Google OAuth, JWT ב-httpOnly secure cookie.
- **הרשאות בשכבת האפליקציה:** כל route מוגן; `user_id` מה-session בלבד; שאילתות Prisma scoped לפי user_id. **אין Supabase RLS** — כל גישת DB היא server-side דרך Prisma; הלקוח לא ניגש ל-DB ישירות.
- **נתונים ציבוריים:** `products`/`prices`/`benefit_cache` משותפים לכל המשתמשים; סינון per-user בקריאה.
- **אין PII רגיש:** אין ת"ז. `birthdate` לא נחשף ב-API חיצוני.
- **Secrets:** DB string, NextAuth secret, Google OAuth, BrightData, Claude API — env vars בלבד.
- **Fetch/Scrape:** server-side בלבד.

---

## 13. UI/UX

**RTL לכל האפליקציה. עברית.**

| מסך | תיאור |
|-----|--------|
| `/login` | "התחבר עם Google" בלבד |
| `/onboarding` | מועדונים (checkboxes) + date picker. "דלג" |
| `/prices` | search + קטגוריה. skeleton. תוצאות מקובצות לפי יצרן + "עודכן לאחרונה" |
| `/benefits` | autocomplete. מועדונים pre-checked (שינוי זמני). toggle "הכל/שלי". badge צבעוני. "לאפליקציה ←" |
| `/nearby` | GPS + fallback ידני. toggle "פעיל היום/כולל עתידי" |
| `/birthday` | birthdate pre-filled. date picker אם חסר. תוצאות לפי חנות |
| `/profile` | עריכת מועדונים + תאריך לידה |

**Navigation:** sidebar עם 5 קישורים.

---

## 14. Edge Cases

| מצב | טיפול |
|-----|--------|
| קובץ מחירון לא זמין / פורמט השתנה | משתמש בנתונים האחרונים שנקלטו + log; ingestor מסמן לתחזוקה |
| מקור הטבות נחסם / HTML השתנה | parse דטרמיניסטי נכשל → LLM fallback → אם גם נכשל: תוצאות חלקיות + banner |
| כל מקורות ההטבות נכשלו | `503`, לא נכתב ל-cache |
| GPS נדחה / אין קניון בטווח | fallback ל-input ידני / `404` + הצעה |
| benefit ללא valid_to | מוצג תמיד |
| benefit פג תוקף ב-cache | `is_expired:true`, מעומעם |
| נתון פגום | skip + log, לא נכתב ל-cache |
| session פגה | `401` → `/login` |
| דילוג על birthdate ב-onboarding | `null`; `/birthday` מציג date picker |

---

## 15. Non-Functional
- cache/DB hit: < 300ms
- fetch הטבות מלא (יעד): < 8ש'
- scale MVP: עשרות משתמשים
- HTTPS, ללא VPN

---

## 16. מחוץ לסקופ (MVP)
הטבות מועדון אישיות (login) · push/התראות · שמירת מועדפים · מעקב מחירים היסטורי · סריקת ברקוד · אלקטרו/online-only · ייצוא PDF/Excel · מחיקת חשבון · admin panel · queue/progressive jobs.

---

## 17. שאלות פתוחות
- **כתובות פורטלי המחירון + אישורים** לכל רשת — לאימות בפיתוח (סוכן `price-feed-ingestor`).
- **`scrape_targets` להטבות** — לגילוי בפיתוח (סוכן `scrape-target-builder`).
- **עלויות BrightData** — לבחינה לפי volume.
- **בחירת סניף מייצג** לכל רשת ל-MVP (או aggregation).

---

## 18. Phasing

### MVP (v1)
- Google OAuth + onboarding + פרופיל
- מחירים: ingestion מקבצי שקיפות (שופרסל, רמי לוי, קרפור, יוחננוף) + `/prices`
- הטבות: כאל, לאומי קארד, מועדון חברים, יורוקום + פומבי
- מיקום: עזריאלי, רמת אביב · הטבות יום הולדת
- Deploy: Vercel + Supabase

### v2
- הטבות מועדון אישיות (login) · queue + progressive results · admin panel · סריקת ברקוד · רשתות/מועדונים נוספים · מעקב מחירים היסטורי
