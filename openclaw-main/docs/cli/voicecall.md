---
summary: "CLI reference for `skillset voicecall` (voice-call plugin command surface)"
read_when:
  - You use the voice-call plugin and want the CLI entry points
  - You want quick examples for `voicecall call|continue|status|tail|expose`
title: "voicecall"
---

# `skillset voicecall`

`voicecall` is a plugin-provided command. It only appears if the voice-call plugin is installed and enabled.

Primary doc:

- Voice-call plugin: [Voice Call](/plugins/voice-call)

## Common commands

```bash
skillset voicecall status --call-id <id>
skillset voicecall call --to "+15555550123" --message "Hello" --mode notify
skillset voicecall continue --call-id <id> --message "Any questions?"
skillset voicecall end --call-id <id>
```

## Exposing webhooks (Tailscale)

```bash
skillset voicecall expose --mode serve
skillset voicecall expose --mode funnel
skillset voicecall expose --mode off
```

Security note: only expose the webhook endpoint to networks you trust. Prefer Tailscale Serve over Funnel when possible.
