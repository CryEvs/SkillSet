---
summary: "CLI reference for `skillset proxy`, the local debug proxy and capture inspector"
read_when:
  - You need to capture SkillSet transport traffic locally for debugging
  - You want to inspect debug proxy sessions, blobs, or built-in query presets
title: "proxy"
---

# `skillset proxy`

Run the local explicit debug proxy and inspect captured traffic.

This is a debugging command for transport-level investigation. It can start a
local proxy, run a child command with capture enabled, list capture sessions,
query common traffic patterns, read captured blobs, and purge local capture
data.

## Commands

```bash
skillset proxy start [--host <host>] [--port <port>]
skillset proxy run [--host <host>] [--port <port>] -- <cmd...>
skillset proxy coverage
skillset proxy sessions [--limit <count>]
skillset proxy query --preset <name> [--session <id>]
skillset proxy blob --id <blobId>
skillset proxy purge
```

## Query presets

`skillset proxy query --preset <name>` accepts:

- `double-sends`
- `retry-storms`
- `cache-busting`
- `ws-duplicate-frames`
- `missing-ack`
- `error-bursts`

## Notes

- `start` defaults to `127.0.0.1` unless `--host` is set.
- `run` starts a local debug proxy and then runs the command after `--`.
- Captures are local debugging data; use `skillset proxy purge` when finished.
