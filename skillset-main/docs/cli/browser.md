---
summary: "CLI reference for `skillset browser` (lifecycle, profiles, tabs, actions, state, and debugging)"
read_when:
  - You use `skillset browser` and want examples for common tasks
  - You want to control a browser running on another machine via a node host
  - You want to attach to your local signed-in Chrome via Chrome MCP
title: "browser"
---

# `skillset browser`

Manage SkillSet's browser control surface and run browser actions (lifecycle, profiles, tabs, snapshots, screenshots, navigation, input, state emulation, and debugging).

Related:

- Browser tool + API: [Browser tool](/tools/browser)

## Common flags

- `--url <gatewayWsUrl>`: Gateway WebSocket URL (defaults to config).
- `--token <token>`: Gateway token (if required).
- `--timeout <ms>`: request timeout (ms).
- `--expect-final`: wait for a final Gateway response.
- `--browser-profile <name>`: choose a browser profile (default from config).
- `--json`: machine-readable output (where supported).

## Quick start (local)

```bash
skillset browser profiles
skillset browser --browser-profile skillset start
skillset browser --browser-profile skillset open https://example.com
skillset browser --browser-profile skillset snapshot
```

## Quick troubleshooting

If `start` fails with `not reachable after start`, troubleshoot CDP readiness first. If `start` and `tabs` succeed but `open` or `navigate` fails, the browser control plane is healthy and the failure is usually navigation SSRF policy.

Minimal sequence:

```bash
skillset browser --browser-profile skillset start
skillset browser --browser-profile skillset tabs
skillset browser --browser-profile skillset open https://example.com
```

Detailed guidance: [Browser troubleshooting](/tools/browser#cdp-startup-failure-vs-navigation-ssrf-block)

## Lifecycle

```bash
skillset browser status
skillset browser start
skillset browser stop
skillset browser --browser-profile skillset reset-profile
```

Notes:

- For `attachOnly` and remote CDP profiles, `skillset browser stop` closes the
  active control session and clears temporary emulation overrides even when
  SkillSet did not launch the browser process itself.
- For local managed profiles, `skillset browser stop` stops the spawned browser
  process.

## If the command is missing

If `skillset browser` is an unknown command, check `plugins.allow` in
`~/.skillset/skillset.json`.

When `plugins.allow` is present, the bundled browser plugin must be listed
explicitly:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true` does not restore the CLI subcommand when the plugin
allowlist excludes `browser`.

Related: [Browser tool](/tools/browser#missing-browser-command-or-tool)

## Profiles

Profiles are named browser routing configs. In practice:

- `skillset`: launches or attaches to a dedicated SkillSet-managed Chrome instance (isolated user data dir).
- `user`: controls your existing signed-in Chrome session via Chrome DevTools MCP.
- custom CDP profiles: point at a local or remote CDP endpoint.

```bash
skillset browser profiles
skillset browser create-profile --name work --color "#FF5A36"
skillset browser create-profile --name chrome-live --driver existing-session
skillset browser create-profile --name remote --cdp-url https://browser-host.example.com
skillset browser delete-profile --name work
```

Use a specific profile:

```bash
skillset browser --browser-profile work tabs
```

## Tabs

```bash
skillset browser tabs
skillset browser tab new
skillset browser tab select 2
skillset browser tab close 2
skillset browser open https://docs.skillset.ai
skillset browser focus <targetId>
skillset browser close <targetId>
```

## Snapshot / screenshot / actions

Snapshot:

```bash
skillset browser snapshot
```

Screenshot:

```bash
skillset browser screenshot
skillset browser screenshot --full-page
skillset browser screenshot --ref e12
```

Notes:

- `--full-page` is for page captures only; it cannot be combined with `--ref`
  or `--element`.
- `existing-session` / `user` profiles support page screenshots and `--ref`
  screenshots from snapshot output, but not CSS `--element` screenshots.

Navigate/click/type (ref-based UI automation):

```bash
skillset browser navigate https://example.com
skillset browser click <ref>
skillset browser type <ref> "hello"
skillset browser press Enter
skillset browser hover <ref>
skillset browser scrollintoview <ref>
skillset browser drag <startRef> <endRef>
skillset browser select <ref> OptionA OptionB
skillset browser fill --fields '[{"ref":"1","value":"Ada"}]'
skillset browser wait --text "Done"
skillset browser evaluate --fn '(el) => el.textContent' --ref <ref>
```

File + dialog helpers:

```bash
skillset browser upload /tmp/skillset/uploads/file.pdf --ref <ref>
skillset browser waitfordownload
skillset browser download <ref> report.pdf
skillset browser dialog --accept
```

## State and storage

Viewport + emulation:

```bash
skillset browser resize 1280 720
skillset browser set viewport 1280 720
skillset browser set offline on
skillset browser set media dark
skillset browser set timezone Europe/London
skillset browser set locale en-GB
skillset browser set geo 51.5074 -0.1278 --accuracy 25
skillset browser set device "iPhone 14"
skillset browser set headers '{"x-test":"1"}'
skillset browser set credentials myuser mypass
```

Cookies + storage:

```bash
skillset browser cookies
skillset browser cookies set session abc123 --url https://example.com
skillset browser cookies clear
skillset browser storage local get
skillset browser storage local set token abc123
skillset browser storage session clear
```

## Debugging

```bash
skillset browser console --level error
skillset browser pdf
skillset browser responsebody "**/api"
skillset browser highlight <ref>
skillset browser errors --clear
skillset browser requests --filter api
skillset browser trace start
skillset browser trace stop --out trace.zip
```

## Existing Chrome via MCP

Use the built-in `user` profile, or create your own `existing-session` profile:

```bash
skillset browser --browser-profile user tabs
skillset browser create-profile --name chrome-live --driver existing-session
skillset browser create-profile --name brave-live --driver existing-session --user-data-dir "~/Library/Application Support/BraveSoftware/Brave-Browser"
skillset browser --browser-profile chrome-live tabs
```

This path is host-only. For Docker, headless servers, Browserless, or other remote setups, use a CDP profile instead.

Current existing-session limits:

- snapshot-driven actions use refs, not CSS selectors
- `click` is left-click only
- `type` does not support `slowly=true`
- `press` does not support `delayMs`
- `hover`, `scrollintoview`, `drag`, `select`, `fill`, and `evaluate` reject
  per-call timeout overrides
- `select` supports one value only
- `wait --load networkidle` is not supported
- file uploads require `--ref` / `--input-ref`, do not support CSS
  `--element`, and currently support one file at a time
- dialog hooks do not support `--timeout`
- screenshots support page captures and `--ref`, but not CSS `--element`
- `responsebody`, download interception, PDF export, and batch actions still
  require a managed browser or raw CDP profile

## Remote browser control (node host proxy)

If the Gateway runs on a different machine than the browser, run a **node host** on the machine that has Chrome/Brave/Edge/Chromium. The Gateway will proxy browser actions to that node (no separate browser control server required).

Use `gateway.nodes.browser.mode` to control auto-routing and `gateway.nodes.browser.node` to pin a specific node if multiple are connected.

Security + remote setup: [Browser tool](/tools/browser), [Remote access](/gateway/remote), [Tailscale](/gateway/tailscale), [Security](/gateway/security)
