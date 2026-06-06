---
title: vault_sisu/.obsidian/ — קבצי הגדרות Obsidian
tags:
  - project-file
  - obsidian
  - configuration
aliases:
  - obsidian-core-plugins
  - obsidian-config-files
---

# vault_sisu/.obsidian/ — קבצי הגדרות Obsidian

קבוצת קבצים המגדירים את התנהגות ה-vault ב-Obsidian. **לא לערוך ידנית** — Obsidian מנהל אותם.

---

## core-plugins.json

**מה הוא עושה:** מגדיר אילו core plugins של Obsidian מאופשרים.

**פלאגינים מאופשרים בפרויקט:**
- `file-explorer`, `global-search`, `switcher`, `graph`, `backlink`, `canvas`
- `outgoing-link`, `tag-pane`, `properties`, `page-preview`
- `daily-notes`, `templates`, `note-composer`, `command-palette`
- `bookmarks`, `outline`, `word-count`, `file-recovery`, `sync`
- **`bases: true`** — פלאגין ה-Bases מאופשר (נדרש ל-[[obsidian-bases-skill]])

**פלאגינים מכובים:** slides, audio-recorder, publish, webviewer, slash-command

---

## app.json

**מה הוא עושה:** הגדרות כלליות של אפליקציית Obsidian (גופנים, editor mode, theme).  
**סטטוס:** ריק (`{}`) — ברירות מחדל של Obsidian.

---

## workspace.json

**מה הוא עושה:** שומר את מצב ה-workspace — אילו קבצים פתוחים, פאנלים, גדלי חלונות.  
**הערה:** משתנה אוטומטית בכל פתיחת Obsidian.

---

## appearance.json

**מה הוא עושה:** הגדרות מראה — theme, גופן, צבעים.

---

## graph.json

**מה הוא עושה:** הגדרות תצוגת ה-Graph View — פילטרים, צבעי nodes, כוחות הגרף.

---

## מיקום בפרויקט

`vault_sisu/vault_sisu/.obsidian/`

## למי הם משויכים

- **בעלות:** Obsidian (נוצרים ומנוהלים אוטומטית)
- **ניתן לשנות:** דרך ממשק Obsidian בלבד (Settings)
- **git:** ניתן לכלול ב-git כדי לשתף הגדרות בין מחשבים

## קבצים קשורים

- [[vault-welcome]] — ה-note הבסיסי של הוולט
- [[obsidian-bases-skill]] — דורש `bases: true` ב-core-plugins
- [[obsidian-markdown-skill]] — עובד עם הוולט הזה
