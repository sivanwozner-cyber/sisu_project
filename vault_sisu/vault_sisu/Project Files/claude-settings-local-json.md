---
title: .claude/settings.local.json
tags:
  - project-file
  - claude-code
  - configuration
  - local
aliases:
  - claude-settings-local-json
---

# .claude/settings.local.json

## מה הקובץ עושה

הגדרות Claude Code **מקומיות** — לא נכנסות ל-git. מגדיר הרשאות ספציפיות לסביבת המחשב המקומי: אילו פקודות מותרות אוטומטית, ותיקיות נוספות שקלוד יכול לגשת אליהן.

## תוכן עיקרי

- **הרשאות `allow`:** פקודות PowerShell ספציפיות (יצירת תיקיות `.claude/`, הצגת עץ קבצים, התקנת פלאגין), קריאת קבצי `.claude/` של המשתמש
- **`additionalDirectories`:** גישה לתיקיית הזיכרון של Claude Code בנתיב `c:\Users\Administrator\.claude\projects\...`

## למי הוא משויך

- **בעלות:** המשתמש (מחשב מקומי)
- **לא נכנס ל-git** — מופיע ב-`.gitignore` (או צריך להיות)
- **קורא:** Claude Code CLI בלבד

## מיקום בפרויקט

`.claude/settings.local.json`

## הערה

קובץ זה מכיל נתיבים מוחלטים ספציפיים למחשב — **לא לשתף** בין סביבות.

## קבצים קשורים

- [[claude-settings-json]] — ההגדרות הכלליות של הפרויקט (נכנסות ל-git)
- [[claude-md]] — הוראות הפרויקט
