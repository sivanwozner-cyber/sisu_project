---
title: .claude/settings.json
tags:
  - project-file
  - claude-code
  - configuration
aliases:
  - claude-settings-json
---

# .claude/settings.json

## מה הקובץ עושה

הגדרות Claude Code ברמת הפרויקט — מגדיר marketplaces נוספים לפלאגינים ואת הפלאגינים המאופשרים. קובץ זה נקרא אוטומטית על ידי Claude Code.

## תוכן עיקרי

```json
{
  "extraKnownMarketplaces": {
    "claude-plugins-official": {
      "source": { "source": "github", "repo": "anthropics/claude-plugins-official" }
    }
  },
  "enabledPlugins": {
    "skill-creator@claude-plugins-official": true
  }
}
```

- **Marketplace:** `claude-plugins-official` מ-GitHub של Anthropic
- **פלאגין מאופשר:** `skill-creator` — כלי ליצירה ועריכה של skills

## למי הוא משויך

- **בעלות:** המשתמש / Claude Code
- **קורא:** Claude Code CLI בלוד — נקרא אוטומטית
- **משנה:** המשתמש או Claude Code עם הרשאה

## מיקום בפרויקט

`.claude/settings.json`

## קבצים קשורים

- [[claude-settings-local-json]] — הגדרות מקומיות (permissions, הרשאות)
- [[claude-md]] — הוראות הפרויקט הכלליות
