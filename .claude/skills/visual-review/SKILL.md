---
name: visual-review
description: מריץ את אפליקציית ה-Next.js ומצלם את כל הדפים במובייל + דסקטופ עם Playwright, לבדיקת QA ויזואלי. Use when asked to screenshot the app, review the visual/UI, verify a design change, or check how pages look on mobile/desktop.
---

# Visual Review

QA ויזואלי חוזר: מעלה dev server מקומי ומצלם את כל המסכים בשני viewports
(מובייל iPhone 13 + דסקטופ), כדי לבדוק עיצוב/RTL/regressions בלי לגלות מחדש
את ה-setup בכל פעם.

## למה צריך setup מיוחד
- `next` לא מותקן בקלון טרי → צריך `npm install`.
- NextAuth נופל עם `NO_SECRET` ומחזיר 500 על כל דף → צריך `.env.local` עם
  ערכי דמה (gitignored תחת `.env*.local`).
- ה-PPA של apt חסום בסביבה → **לא** להריץ `playwright install --with-deps`;
  להתקין רק את ה-binary של chromium.

## הרצה (מההתחלה)
```bash
cd /home/user/sisu_project

# 1. dependencies (פעם אחת)
[ -d node_modules ] || npm install

# 2. env דמה כדי לעקוף NextAuth NO_SECRET (אם חסר)
[ -f .env.local ] || cat > .env.local <<'ENV'
DATABASE_URL="postgresql://user:pass@localhost:5432/postgres"
DIRECT_URL="postgresql://user:pass@localhost:5432/postgres"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="local-dev-secret-not-for-production-use-only"
GOOGLE_CLIENT_ID="dummy"
GOOGLE_CLIENT_SECRET="dummy"
ENV

# 3. dev server מנותק מה-session (אחרת נהרג בסוף ה-tool call)
pkill -f "next dev" 2>/dev/null; sleep 1
setsid nohup npm run dev > /tmp/dev.log 2>&1 < /dev/null &
disown
timeout 90 bash -c 'until curl -sf http://localhost:3000 -o /dev/null; do sleep 2; done' && echo UP

# 4. Playwright + chromium — מותקן בתוך scripts/ (יש שם package.json ייעודי
#    כדי שלעולם לא ילכלך את package.json של הפרויקט). בינארי בלבד — בלי --with-deps.
cd .claude/skills/visual-review/scripts
npm install >/dev/null 2>&1
npx playwright install chromium

# 5. צילום כל הדפים
node shoot.mjs
```
הצילומים נשמרים ב-`/tmp/visual-review/` (למשל `login-mobile.png`,
`prices-desktop.png`). לקרוא אותם עם כלי Read ולהציג למשתמשת ב-SendUserFile.

## הערות
- דפי `(app)/*` דורשים session מחובר; בלי auth אמיתי הם יפנו ל-`/login`.
  לבדיקת המסכים הפנימיים — להזריק cookie/לעקוף, או לבדוק לפחות login+onboarding.
- תמיד לבדוק `console errors` בפלט של `shoot.mjs` — דף יכול להיראות תקין
  בזמן שה-fetch-ים מחזירים 500.
- לעצור את השרת: `pkill -f "next dev"`.
- `.env.local` לעולם לא נדחף (gitignored).
