---
name: motion-microinteractions
description: דפוסי אנימציה ומיקרו-אינטראקציות (Tailwind keyframes בלבד) לאפליקציה — fade-in-up, glow-pulse, shimmer, hover-glow, עם כללי נגישות. Use when adding motion/transitions to UI so animations stay tasteful, consistent, and accessible.
---

# Motion & Micro-interactions

תנועה טעונת־טעם שמוסיפה תחושת חוויה וחדשנות בלי להכביד. הכול דרך Tailwind
keyframes + הפלאגין `tailwindcss-animate` (כבר מותקן). **ללא** framer-motion
או ספריות JS לאנימציה.

## הקיפלים (מוגדרים ב-`tailwind.config.ts`)
- `animate-fade-in-up` — כניסת תוכן: opacity 0→1 + translateY(8px→0), ~400ms.
- `animate-glow-pulse` — פעימת הילה עדינה ל-CTA/אלמנט שמושך תשומת־לב.
- `animate-shimmer` — פס אור נע ל-skeletons (במקום `animate-pulse` אפור).

## איפה ליישם
- **כניסת כרטיסים/תוצאות:** `animate-fade-in-up`. ברשימות — stagger דרך
  `style={{ animationDelay: \`${i * 60}ms\` }}` (עד ~6 פריטים, מעבר לזה מוותרים).
- **CTA ראשי (login, חיפוש):** `hover:shadow-glow transition`. את
  `animate-glow-pulse` שומרים לכפתור הירו היחיד — לא לכל כפתור.
- **Hover על כרטיס/פריט:** `transition hover:-translate-y-0.5
  hover:shadow-glow` — scale/הרמה עדינה + הילה.
- **Skeletons:** מחליפים ל-`.shimmer` (class) או `animate-shimmer`.
- **פוקוס:** `focus-visible:ring-2 focus-visible:ring-ring` + glow — נשאר
  עקבי בכל אינפוט/כפתור.

## איפה לא
- ❌ לא להנפיש תוכן קריטי מעל הקיפול שחייב להופיע מיד (כותרת ראשית סטטית).
- ❌ לא stagger ארוך על עשרות פריטים — מרגיש איטי.
- ❌ לא אנימציות אינסופיות מרובות באותו מסך (glow-pulse אחד מקסימום).

## נגישות (חובה)
לכבד `prefers-reduced-motion`. ב-`globals.css` כבר קיים בלוק:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```
אם מוסיפים keyframe חדש — לוודא שהוא מנוטרל כאן אוטומטית (הבלוק גורף).

## חיבורים
keyframes/animation ב-`tailwind.config.ts` · `.shimmer` ב-`globals.css` ·
צבעי הזוהר מ-skill `dark-neon-design-system` · בדיקה ויזואלית: skill
`visual-review`.
