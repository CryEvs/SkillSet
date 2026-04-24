---
summary: "CLI reference for `skillset tasks` (background task ledger and Task Flow state)"
read_when:
  - You want to inspect, audit, or cancel background task records
  - You are documenting Task Flow commands under `skillset tasks flow`
title: "`skillset tasks`"
---

# `skillset tasks`

Inspect durable background tasks and Task Flow state. With no subcommand,
`skillset tasks` is equivalent to `skillset tasks list`.

See [Background Tasks](/automation/tasks) for the lifecycle and delivery model.

## Usage

```bash
skillset tasks
skillset tasks list
skillset tasks list --runtime acp
skillset tasks list --status running
skillset tasks show <lookup>
skillset tasks notify <lookup> state_changes
skillset tasks cancel <lookup>
skillset tasks audit
skillset tasks maintenance
skillset tasks maintenance --apply
skillset tasks flow list
skillset tasks flow show <lookup>
skillset tasks flow cancel <lookup>
```

## Root Options

- `--json`: output JSON.
- `--runtime <name>`: filter by kind: `subagent`, `acp`, `cron`, or `cli`.
- `--status <name>`: filter by status: `queued`, `running`, `succeeded`, `failed`, `timed_out`, `cancelled`, or `lost`.

## Subcommands

### `list`

```bash
skillset tasks list [--runtime <name>] [--status <name>] [--json]
```

Lists tracked background tasks newest first.

### `show`

```bash
skillset tasks show <lookup> [--json]
```

Shows one task by task ID, run ID, or session key.

### `notify`

```bash
skillset tasks notify <lookup> <done_only|state_changes|silent>
```

Changes the notification policy for a running task.

### `cancel`

```bash
skillset tasks cancel <lookup>
```

Cancels a running background task.

### `audit`

```bash
skillset tasks audit [--severity <warn|error>] [--code <name>] [--limit <n>] [--json]
```

Surfaces stale, lost, delivery-failed, or otherwise inconsistent task and Task Flow records.

### `maintenance`

```bash
skillset tasks maintenance [--apply] [--json]
```

Previews or applies task and Task Flow reconciliation, cleanup stamping, and pruning.

### `flow`

```bash
skillset tasks flow list [--status <name>] [--json]
skillset tasks flow show <lookup> [--json]
skillset tasks flow cancel <lookup>
```

Inspects or cancels durable Task Flow state under the task ledger.
