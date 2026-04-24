---
summary: "WeChat channel setup through the external skillset-weixin plugin"
read_when:
  - You want to connect SkillSet to WeChat or Weixin
  - You are installing or troubleshooting the skillset-weixin channel plugin
  - You need to understand how external channel plugins run beside the Gateway
title: "WeChat"
---

# WeChat

SkillSet connects to WeChat through Tencent's external
`@tencent-weixin/skillset-weixin` channel plugin.

Status: external plugin. Direct chats and media are supported. Group chats are not
advertised by the current plugin capability metadata.

## Naming

- **WeChat** is the user-facing name in these docs.
- **Weixin** is the name used by Tencent's package and by the plugin id.
- `skillset-weixin` is the SkillSet channel id.
- `@tencent-weixin/skillset-weixin` is the npm package.

Use `skillset-weixin` in CLI commands and config paths.

## How it works

The WeChat code does not live in the SkillSet core repo. SkillSet provides the
generic channel plugin contract, and the external plugin provides the
WeChat-specific runtime:

1. `skillset plugins install` installs `@tencent-weixin/skillset-weixin`.
2. The Gateway discovers the plugin manifest and loads the plugin entrypoint.
3. The plugin registers channel id `skillset-weixin`.
4. `skillset channels login --channel skillset-weixin` starts QR login.
5. The plugin stores account credentials under the SkillSet state directory.
6. When the Gateway starts, the plugin starts its Weixin monitor for each
   configured account.
7. Inbound WeChat messages are normalized through the channel contract, routed to
   the selected SkillSet agent, and sent back through the plugin outbound path.

That separation matters: SkillSet core should stay channel-agnostic. WeChat login,
Tencent iLink API calls, media upload/download, context tokens, and account
monitoring are owned by the external plugin.

## Install

Quick install:

```bash
npx -y @tencent-weixin/skillset-weixin-cli install
```

Manual install:

```bash
skillset plugins install "@tencent-weixin/skillset-weixin"
skillset config set plugins.entries.skillset-weixin.enabled true
```

Restart the Gateway after install:

```bash
skillset gateway restart
```

## Login

Run QR login on the same machine that runs the Gateway:

```bash
skillset channels login --channel skillset-weixin
```

Scan the QR code with WeChat on your phone and confirm the login. The plugin saves
the account token locally after a successful scan.

To add another WeChat account, run the same login command again. For multiple
accounts, isolate direct-message sessions by account, channel, and sender:

```bash
skillset config set session.dmScope per-account-channel-peer
```

## Access control

Direct messages use the normal SkillSet pairing and allowlist model for channel
plugins.

Approve new senders:

```bash
skillset pairing list skillset-weixin
skillset pairing approve skillset-weixin <CODE>
```

For the full access-control model, see [Pairing](/channels/pairing).

## Compatibility

The plugin checks the host SkillSet version at startup.

| Plugin line | SkillSet version        | npm tag  |
| ----------- | ----------------------- | -------- |
| `2.x`       | `>=2026.3.22`           | `latest` |
| `1.x`       | `>=2026.1.0 <2026.3.22` | `legacy` |

If the plugin reports that your SkillSet version is too old, either update
SkillSet or install the legacy plugin line:

```bash
skillset plugins install @tencent-weixin/skillset-weixin@legacy
```

## Sidecar process

The WeChat plugin can run helper work beside the Gateway while it monitors the
Tencent iLink API. In issue #68451, that helper path exposed a bug in SkillSet's
generic stale-Gateway cleanup: a child process could try to clean up the parent
Gateway process, causing restart loops under process managers such as systemd.

Current SkillSet startup cleanup excludes the current process and its ancestors,
so a channel helper must not kill the Gateway that launched it. This fix is
generic; it is not a WeChat-specific path in core.

## Troubleshooting

Check install and status:

```bash
skillset plugins list
skillset channels status --probe
skillset --version
```

If the channel shows as installed but does not connect, confirm that the plugin is
enabled and restart:

```bash
skillset config set plugins.entries.skillset-weixin.enabled true
skillset gateway restart
```

If the Gateway restarts repeatedly after enabling WeChat, update both SkillSet and
the plugin:

```bash
npm view @tencent-weixin/skillset-weixin version
skillset plugins install "@tencent-weixin/skillset-weixin" --force
skillset gateway restart
```

Temporary disable:

```bash
skillset config set plugins.entries.skillset-weixin.enabled false
skillset gateway restart
```

## Related docs

- Channel overview: [Chat Channels](/channels)
- Pairing: [Pairing](/channels/pairing)
- Channel routing: [Channel Routing](/channels/channel-routing)
- Plugin architecture: [Plugin Architecture](/plugins/architecture)
- Channel plugin SDK: [Channel Plugin SDK](/plugins/sdk-channel-plugins)
- External package: [@tencent-weixin/skillset-weixin](https://www.npmjs.com/package/@tencent-weixin/skillset-weixin)
