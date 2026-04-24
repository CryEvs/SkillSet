---
summary: "CLI reference for `skillset docs` (search the live docs index)"
read_when:
  - You want to search the live SkillSet docs from the terminal
title: "docs"
---

# `skillset docs`

Search the live docs index.

Arguments:

- `[query...]`: search terms to send to the live docs index

Examples:

```bash
skillset docs
skillset docs browser existing-session
skillset docs sandbox allowHostControl
skillset docs gateway token secretref
```

Notes:

- With no query, `skillset docs` opens the live docs search entrypoint.
- Multi-word queries are passed through as one search request.
