---
summary: "Uninstall SkillSet completely (CLI, service, state, workspace)"
read_when:
  - You want to remove SkillSet from a machine
  - The gateway service is still running after uninstall
title: "Uninstall"
---

# Uninstall

Two paths:

- **Easy path** if `skillset` is still installed.
- **Manual service removal** if the CLI is gone but the service is still running.

## Easy path (CLI still installed)

Recommended: use the built-in uninstaller:

```bash
skillset uninstall
```

Non-interactive (automation / npx):

```bash
skillset uninstall --all --yes --non-interactive
npx -y skillset uninstall --all --yes --non-interactive
```

Manual steps (same result):

1. Stop the gateway service:

```bash
skillset gateway stop
```

2. Uninstall the gateway service (launchd/systemd/schtasks):

```bash
skillset gateway uninstall
```

3. Delete state + config:

```bash
rm -rf "${SKILLSET_STATE_DIR:-$HOME/.skillset}"
```

If you set `SKILLSET_CONFIG_PATH` to a custom location outside the state dir, delete that file too.

4. Delete your workspace (optional, removes agent files):

```bash
rm -rf ~/.skillset/workspace
```

5. Remove the CLI install (pick the one you used):

```bash
npm rm -g skillset
pnpm remove -g skillset
bun remove -g skillset
```

6. If you installed the macOS app:

```bash
rm -rf /Applications/SkillSet.app
```

Notes:

- If you used profiles (`--profile` / `SKILLSET_PROFILE`), repeat step 3 for each state dir (defaults are `~/.skillset-<profile>`).
- In remote mode, the state dir lives on the **gateway host**, so run steps 1-4 there too.

## Manual service removal (CLI not installed)

Use this if the gateway service keeps running but `skillset` is missing.

### macOS (launchd)

Default label is `ai.skillset.gateway` (or `ai.skillset.<profile>`; legacy `com.skillset.*` may still exist):

```bash
launchctl bootout gui/$UID/ai.skillset.gateway
rm -f ~/Library/LaunchAgents/ai.skillset.gateway.plist
```

If you used a profile, replace the label and plist name with `ai.skillset.<profile>`. Remove any legacy `com.skillset.*` plists if present.

### Linux (systemd user unit)

Default unit name is `skillset-gateway.service` (or `skillset-gateway-<profile>.service`):

```bash
systemctl --user disable --now skillset-gateway.service
rm -f ~/.config/systemd/user/skillset-gateway.service
systemctl --user daemon-reload
```

### Windows (Scheduled Task)

Default task name is `SkillSet Gateway` (or `SkillSet Gateway (<profile>)`).
The task script lives under your state dir.

```powershell
schtasks /Delete /F /TN "SkillSet Gateway"
Remove-Item -Force "$env:USERPROFILE\.skillset\gateway.cmd"
```

If you used a profile, delete the matching task name and `~\.skillset-<profile>\gateway.cmd`.

## Normal install vs source checkout

### Normal install (install.sh / npm / pnpm / bun)

If you used `https://skillset.ai/install.sh` or `install.ps1`, the CLI was installed with `npm install -g skillset@latest`.
Remove it with `npm rm -g skillset` (or `pnpm remove -g` / `bun remove -g` if you installed that way).

### Source checkout (git clone)

If you run from a repo checkout (`git clone` + `skillset ...` / `bun run skillset ...`):

1. Uninstall the gateway service **before** deleting the repo (use the easy path above or manual service removal).
2. Delete the repo directory.
3. Remove state + workspace as shown above.
