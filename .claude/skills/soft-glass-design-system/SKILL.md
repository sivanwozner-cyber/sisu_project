---
name: soft-glass-design-system
description: שפת העיצוב "זכוכית רכה" (soft glassmorphism) של האפליקציה — רקע aurora פסטל בהיר, כרטיסי זכוכית מטושטשת, כפתורי גלולה בגרדיאנט חם, טקסט-גרדיאנט וצללים רכים. Use when building or restyling any UI (pages, components, cards, buttons) so the light glass look stays consistent.
---

# Soft-Glass Design System

שפת העיצוב הויזואלית של האפליקציה. אסתטיקה בהירה, אוורירית ופרימיום: רקע
גרדיאנט פסטל (סגול→כחול→אפרסק), משטחי זכוכית לבנה מטושטשת (frosted glass),
פינות מעוגלות מאוד, כפתורי "גלולה" עם מילוי גרדיאנט חם, וצללים רכים במקום
זוהר. הכול Tailwind + CSS variables; **אין** ספריות עיצוב חיצוניות.

## עקרונות
- **בהיר ואוורירי.** הרקע הוא גרדיאנט פסטל עדין; התוכן צף עליו בכרטיסי זכוכית.
- **עומק דרך זכוכית + צל רך**, לא דרך קווים חדים. שקיפות + `backdrop-blur`.
- **חום נקודתי.** הגרדיאנט החם (סגול→קורל) שמור ל-CTA, להדגשות ולכותרות מותג.
- **RTL ועברית תמיד** (`dir="rtl"`, `lang="he"`). פונט `Rubik`/`Heebo`.
- **נגישות:** טקסט כהה (slate-indigo) על רקע בהיר — ניגודיות AA. הצל קישוטי.

## פלטה (CSS variables, HSL — ב-`app/globals.css` `:root`)
```
--background        240 60% 97%    /* בסיס בהיר (הרקע גרדיאנט)  */
--foreground        240 32% 22%    /* slate-indigo כהה לטקסט    */
--card              0 0% 100%      /* לבן — משמש עם שקיפות       */
--primary           255 75% 62%    /* violet — אקסנט/קישורים    */
--primary-foreground0 0% 100%
--secondary         22 92% 62%     /* coral/orange — אקסנט חם   */
--accent            280 70% 66%    /* fuchsia                   */
--muted             240 30% 94%
--muted-foreground  240 14% 50%
--border            240 30% 88%
--ring              255 75% 62%
--radius            1rem           /* מעוגל ורך                 */
```

## רקע גלובלי (body, ב-`globals.css`)
שילוב של 3 radial-gradients פסטל (periwinkle בפינה עליונה-ימנית, lavender,
peach בתחתית) מעל `linear-gradient(135deg, periwinkle→lavender→peach)`,
עם `background-attachment: fixed`.

## מחלקות עזר (מוגדרות ב-`globals.css`)
- `.glass` — `bg-white/55 backdrop-blur-xl border-white/60` — בסיס כל
  כרטיס/פאנל/nav. צרף `shadow-soft` ו-`rounded-2xl`.
- `.text-gradient` — טקסט בגרדיאנט חם (violet→fuchsia→coral) לכותרות
  מותג/hero ולמחיר הנמוך.
- `.ring-soft` — מסגרת + tint + צל רך עדין לאלמנט פעיל/נבחר.
- `.shimmer` — אנימציית טעינה בהירה (skeletons). ראה skill `motion-microinteractions`.

## טוקנים ב-`tailwind.config.ts`
- `boxShadow`: `soft-sm`, `soft`, `soft-lg`, `soft-warm` (צללים רכים סגול/חם).
- `backgroundImage`: `gradient-warm` (violet→coral, ל-CTA), `gradient-cool`,
  `gradient-aurora` (רקע).
- `animation`: `fade-in-up`, `float`, `shimmer`.

## דפוסי קומפוננטות
- **Card:** `.glass rounded-2xl shadow-soft` + `hover:-translate-y-0.5
  hover:shadow-soft-lg`. `animate-fade-in-up` בזרימת תוצאות.
- **Button (primary/CTA):** גלולה — `rounded-full bg-gradient-warm
  text-white shadow-soft hover:-translate-y-0.5 hover:shadow-soft-warm`.
  variant `neon` = אותו גרדיאנט עם צל חם חזק יותר (כפתור הירו).
- **Badge לפי סוג הטבה:** פסטל שקוף עם טקסט כהה קריא:
  discount→violet, cashback→emerald, gift→fuchsia, birthday→orange,
  lowest→`bg-gradient-warm text-white`.
- **Input/Select:** גלולה — `rounded-full bg-white/55 border-white/60
  backdrop-blur shadow-soft-sm`, focus ring סגול עדין.
- **Sidebar/nav item פעיל:** `.ring-soft text-primary font-semibold`.

## Do / Don't
- ✅ גרדיאנט חם על CTA, מחיר נמוך, כותרת hero/מותג.
- ✅ כרטיסי זכוכית לבנים שקופים-מעט עם blur — נותנים אוורור ועומק.
- ✅ פינות גדולות (`rounded-2xl`/`rounded-full`) וצללים רכים ומפוזרים.
- ❌ לא צללים שחורים חדים — רק `shadow-soft*`.
- ❌ לא גרדיאנט חם על הכול — מאבד את ההדגשה.
- ❌ לא לשבור RTL: `gap`/`flex` כן, `ml/mr` ידני בזהירות.

## איפה הכול מחובר
`app/globals.css` (variables + utilities + רקע) · `tailwind.config.ts`
(shadows/gradients) · `components/ui/*` (variants) · skill אחות:
`motion-microinteractions` (אנימציות) · בדיקה: skill `visual-review`.
