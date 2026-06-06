---
title: obsidian/obsidian-markdown/SKILL.md
tags:
  - project-file
  - skill
  - obsidian
aliases:
  - obsidian-markdown-skill
---

# obsidian/obsidian-markdown/SKILL.md

## מה הקובץ עושה

Skill של Claude Code לכתיבה ועריכה של Obsidian Flavored Markdown. מכיל מדריך מקיף לתחביר Obsidian-ספציפי: wikilinks, embeds, callouts, properties (frontmatter), tags, תגובות, math (LaTeX), ו-Mermaid diagrams.

## תוכן עיקרי

- **Wikilinks:** `[[Note Name]]`, `[[Note#Heading]]`, `[[Note|Display Text]]`
- **Embeds:** `![[Note]]`, `![[image.png|300]]`, `![[document.pdf#page=3]]`
- **Callouts:** `> [!warning] Title`, סוגים: note, tip, warning, info, example, bug, danger
- **Properties:** frontmatter YAML עם title, tags, aliases, cssclasses
- **Comments:** `%%hidden%%`
- **Math:** `$inline$` ו-`$$block$$`
- **Workflow:** 6 שלבים ליצירת note תקין

## למי הוא משויך

- **בעלות:** Anthropic / Claude Code ecosystem
- **קורא:** Claude Code — מופעל אוטומטית כשמזוהה עבודה עם קבצי .md ב-Obsidian
- **אינטגרציה:** skill-creator plugin מנהל אותו

## מיקום בפרויקט

`obsidian/obsidian-markdown/SKILL.md`

## קבצים קשורים

- [[obsidian-bases-skill]] — skill למסדי נתונים ב-Obsidian
- [[obsidian-vault-workflow-skill]] — skill לפרוטוקול הכתיבה לוולט
- [[vault-welcome]] — ה-note הראשוני בוולט
