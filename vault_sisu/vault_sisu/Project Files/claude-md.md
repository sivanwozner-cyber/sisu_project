---
title: CLAUDE.md
tags:
  - project-file
  - claude-code
  - configuration
aliases:
  - claude-md
---

# CLAUDE.md

## מה הקובץ עושה

הוראות מפורשות לקוד קלוד — מה הפרויקט, הסטאק הטכנולוגי, ומה יש ב-`.claude/`. קלוד קורא קובץ זה בתחילת כל שיחה כדי להבין את ההקשר. ההוראות בו **עוקפות** התנהגות ברירת מחדל.

## תוכן עיקרי

- **תיאור פרויקט:** מערכת ניהול משימות אישית עם תזכורות WhatsApp (Green API) בעתיד
- **סטאק:** Next.js 14 (App Router), Prisma, SQLite, Tailwind CSS, shadcn/ui
- **מבנה `.claude/`:** agents, skills, commands — ריקים כרגע, למלא בהמשך

## למי הוא משויך

- **בעלות:** המשתמש
- **קורא:** Claude Code בלבד — לא בן-אדם בדרך כלל
- **עדיפות:** גבוהה — Claude מעדיף הוראות מקובץ זה על פני ברירות מחדל

## מיקום בפרויקט

`/CLAUDE.md` — שורש הפרויקט

## קבצים קשורים

- [[readme]] — תיעוד ציבורי של הפרויקט
- [[claude-settings-json]] — הגדרות פלאגינים נוספות של Claude Code
- [[untitled]] — ה-prompt המקורי שממנו נוצר CLAUDE.md
