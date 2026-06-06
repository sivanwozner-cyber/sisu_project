---
title: obsidian/obsidian-bases/SKILL.md
tags:
  - project-file
  - skill
  - obsidian
aliases:
  - obsidian-bases-skill
---

# obsidian/obsidian-bases/SKILL.md

## מה הקובץ עושה

Skill של Claude Code ליצירה ועריכה של Obsidian Bases — קבצי `.base` שיוצרים תצוגות דמויות-מסד-נתונים של notes (table, cards, list, map). מכיל תחביר YAML מלא, פילטרים, נוסחאות, סיכומים, וסוגי תצוגה.

## תוכן עיקרי

- **Schema:** קבצי `.base` ב-YAML עם `filters`, `formulas`, `properties`, `summaries`, `views`
- **Filter operators:** `==`, `!=`, `>`, `<`, `&&`, `||`, `!`, `file.hasTag()`, `file.inFolder()`
- **File properties:** `file.name`, `file.mtime`, `file.tags`, `file.links`, `file.backlinks`
- **Functions:** `date()`, `now()`, `today()`, `if()`, `duration()`, `link()`
- **Duration Type:** `.days`, `.hours` — לא ניתן לעשות `.round()` ישירות על Duration
- **View types:** table, cards, list
- **Workflow:** 6 שלבים עם validation

## למי הוא משויך

- **בעלות:** Anthropic / Claude Code ecosystem
- **קורא:** Claude Code — מופעל כשמזוהה עבודה עם קבצי `.base` או בקשות ל-Obsidian Bases
- **דרישה:** תכונת Bases מאופשרת ב-Obsidian (ראה `core-plugins.json`)

## מיקום בפרויקט

`obsidian/obsidian-bases/SKILL.md`

## קבצים קשורים

- [[obsidian-markdown-skill]] — skill לתחביר Markdown של Obsidian
- [[obsidian-core-plugins]] — הגדרות פלאגינים (Bases מאופשר)
- [[obsidian-vault-workflow-skill]] — פרוטוקול הכתיבה לוולט
