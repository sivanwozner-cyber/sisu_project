# Project Files Documentation

## Overview

מיפוי ותיעוד של כל קבצי הפרויקט `sisu_project` בתוך וולט Obsidian. כל קובץ קיבל note משלו בתיקיית `Project Files/` שמסביר מה הוא עושה, למי הוא משויך, ומקשר לקבצים קשורים. הפרויקט בנוי על Next.js 14 + Prisma + SQLite + Tailwind + shadcn/ui, עם Claude Code skills לתמיכה ב-Obsidian.

## Open Questions

- האם להסיר את `Welcome.md` ולהחליפו ב-Home note של הפרויקט?
- האם `Untitled` צריך להפוך ל-`BRIEF.md` ולהיכנס ל-git?
- האם `settings.local.json` מוגדר ב-`.gitignore`?

## Session Log

### 2026-06-06 — מיפוי ותיעוד קבצי הפרויקט [shipped]
- **What was done:** נסרקו כל קבצי הפרויקט (15 קבצים). נוצרו 11 קבצי MD בתיקיית `Project Files/` — אחד לכל קובץ/קבוצה — ו-`_index.md` לתיקייה. כל note כולל: מה הקובץ עושה, תוכן עיקרי, למי הוא משויך, מיקום, הערות, ו-wikilinks לקבצים קשורים.
- **Decisions:** קבצי `.obsidian/*.json` קובצו לnote אחד (`obsidian-core-plugins`) כי הם קבוצה פונקציונלית אחת. הוולט ממוקם ב-`vault_sisu/vault_sisu/` (כפל תיקייה — שם vault = שם תיקייה).
- **Notes / Caveats:** skills ב-`obsidian/` הם של Claude Code ecosystem ולא קוד הפרויקט עצמו. הפרויקט עדיין בשלד — אין Next.js code עדיין.
- **Related:** [[readme]], [[claude-md]], [[todo-md]], [[untitled]], [[obsidian-vault-workflow-skill]]
