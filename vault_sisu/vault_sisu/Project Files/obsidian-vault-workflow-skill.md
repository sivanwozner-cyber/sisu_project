---
title: obsidian/obsidian-vault-workflow/SKILL.md
tags:
  - project-file
  - skill
  - obsidian
  - workflow
aliases:
  - obsidian-vault-workflow-skill
---

# obsidian/obsidian-vault-workflow/SKILL.md

## מה הקובץ עושה

Skill המגדיר את **פרוטוקול הכתיבה המנדטורי לוולט** — קלוד חייב להפעיל אותו בתחילת וסוף כל משימה. מבטיח שהוולט ב-`vault_sisu/` ישמש כזיכרון ארוך-טווח של הפרויקט.

## תוכן עיקרי

### שלב 1 — לפני כל משימה
- זיהוי topic phrase
- חיפוש קובץ topic ב-`vault/Meeting Notes/` (התאמה מדויקת → קרוב → חדש)
- קריאה מלאה של קובץ topic אם קיים
- קריאה של 2-3 Meeting Notes אחרונות, Content Briefs רלוונטיים, Brand Guidelines

### שלב 2 — אחרי כל משימה
- כתיבת session log entry בפורמט קבוע: Overview, Open Questions, Session Log
- שימוש ב-status tags: `[shipped]`, `[wip]`, `[planned]`, `[spiked]`, `[reverted]`, `[debug]`
- Wikilinks חובה ב-`Related:`
- Read-back לאימות

### מבנה תיקיות vault
- `vault/Meeting Notes/` — קוד, ארכיטקטורה, החלטות
- `vault/Content Briefs/` — תוכן עריכתי
- `vault/Publishing Log/` — ריצות פרסום
- `vault/Brand Guidelines/` — עיצוב, טון, UI

## למי הוא משויך

- **בעלות:** Anthropic / Claude Code ecosystem
- **קורא:** Claude Code — מופעל בתחילת כל משימה בפרויקט
- **וולט:** `vault_sisu/vault_sisu/`

## מיקום בפרויקט

`obsidian/obsidian-vault-workflow/SKILL.md`

## קבצים קשורים

- [[obsidian-markdown-skill]] — תחביר הכתיבה שבו משתמשים בוולט
- [[vault-welcome]] — ה-note הבסיסי של הוולט
- [[project-files-documentation]] — session log יצירת תיעוד זה
