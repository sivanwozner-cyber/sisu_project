---
name: dark-neon-design-system
description: שפת העיצוב "ניאון כהה" של האפליקציה — פלטת צבעים, מחלקות glow/glass/gradient, טיפוגרפיה עברית RTL ודפוסי קומפוננטות. Use when building or restyling any UI (pages, components, cards, buttons) so the dark-neon look stays consistent.
---

# Dark-Neon Design System

שפת העיצוב הויזואלית של האפליקציה. כל עבודת UI חדשה (דף/קומפוננטה) חייבת
לדבוק בערכים כאן כדי לשמור על מראה אחיד, חוויתי ו"משדר חדשנות". הכול מבוסס
Tailwind + CSS variables; **אין** ספריות עיצוב חיצוניות.

## עקרונות
- **כהה כברירת־מחדל.** הרקע הוא הבסיס; הניאון הוא התבלין. ניאון נקודתי על
  אלמנטים פעילים/חשובים — לא על הכול.
- **עומק דרך זכוכית + הילה**, לא דרך צללים אפורים. כרטיסים שקופים־מעט עם
  blur ו-border עמום־זוהר.
- **RTL ועברית תמיד** (`dir="rtl"`, `lang="he"`). פונט `Rubik`/`Heebo`.
- **נגישות:** ניגודיות טקסט מינ' AA. glow הוא קישוט — לא תחליף לקונטרסט.

## פלטה (CSS variables, HSL — ב-`app/globals.css` `:root`)
```
--background        222 47% 6%     /* שחור-סגול עמוק           */
--foreground        210 40% 96%    /* טקסט בהיר                */
--card              222 40% 9%     /* כרטיס (משמש עם שקיפות)   */
--card-foreground   210 40% 96%
--primary           175 90% 50%    /* ניאון cyan — CTA ראשי   */
--primary-foreground222 47% 6%
--secondary         258 90% 66%    /* violet                  */
--accent            316 90% 60%    /* magenta                 */
--muted             222 30% 16%
--muted-foreground  215 20% 65%
--border            222 30% 18%    /* עמום; הזוהר ב-utilities  */
--input             222 30% 14%
--ring              175 90% 50%    /* פוקוס ניאון             */
--destructive       0 84% 60%
--radius            0.75rem
```
צבעי `neon` ל-utilities (ב-`tailwind.config.ts`): `cyan #22e0d0`,
`violet #8b5cf6`, `magenta #ec4899`.

## מחלקות עזר (מוגדרות ב-`globals.css`)
- `.glow-text` — `text-shadow` ניאון לכותרות מותג/hero בלבד.
- `.glass-dark` — `bg-card/60 backdrop-blur-xl border border-white/5` —
  בסיס כל כרטיס/פאנל.
- `.neon-border` — border עמום + `box-shadow` פנימי/חיצוני ניאון עדין.
- `.gradient-aurora` — רקע גרדיאנט רדיאלי כפול (cyan + violet) ברקע הגלובלי.
- `.shimmer` — אנימציית טעינה זוהרת (ראה skill `motion-microinteractions`).

## טיפוגרפיה
- כותרת מסך: `text-2xl/3xl font-bold`. כותרת hero: `+ .glow-text`.
- גוף: `text-sm`/`text-base`, משני: `text-muted-foreground`.
- מספרים (מחיר): `font-bold` + גוון `text-primary` להדגשה זוהרת.

## דפוסי קומפוננטות
- **Card:** `.glass-dark rounded-lg` + `hover:shadow-glow transition`.
  להוסיף `animate-fade-in-up` לכרטיסים בזרימת תוצאות.
- **Button (primary/CTA):** `bg-primary text-primary-foreground` +
  `hover:shadow-glow`. variant `neon` לכפתור הירו.
- **Badge לפי סוג הטבה:** רקע כהה־שקוף + טקסט ניאון + `neon-border`:
  discount→cyan, cashback→emerald, gift→violet, birthday→magenta,
  lowest→cyan מלא ובולט.
- **Input:** רקע `bg-input/60`, border עמום, `focus-visible:ring-ring` + glow.
- **Sidebar item פעיל:** `.glass-dark` + `neon-border` + אייקון `text-primary`.

## Do / Don't
- ✅ glow על CTA, פריט פעיל, מחיר נמוך, כותרת hero.
- ✅ גרדיאנט הרקע עדין ויציב — לא מתחרה בתוכן.
- ❌ לא glow על כל טקסט/כל כרטיס — מאבד אפקט והופך לרועש.
- ❌ לא צבעי `*-100/*-800` בהירים של shadcn (לא קריאים על רקע כהה).
- ❌ לא לשבור RTL: `gap`/`flex` כן, `ml/mr` ידני בזהירות.

## איפה הכול מחובר
`app/globals.css` (variables + utilities) · `tailwind.config.ts`
(shadows/gradients/neon) · `components/ui/*` (variants) · skill אחות:
`motion-microinteractions` (אנימציות) · בדיקה: skill `visual-review`.
