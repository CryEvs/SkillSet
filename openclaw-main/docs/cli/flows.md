---
summary: "Redirect: flow commands live under `skillset tasks flow`"
read_when:
  - You encounter skillset flows in older docs or release notes
title: "flows (redirect)"
---

# `skillset tasks flow`

Flow commands are subcommands of `skillset tasks`, not a standalone `flows` command.

```bash
skillset tasks flow list [--json]
skillset tasks flow show <lookup>
skillset tasks flow cancel <lookup>
```

For full documentation see [Task Flow](/automation/taskflow) and the [tasks CLI reference](/cli/tasks).
