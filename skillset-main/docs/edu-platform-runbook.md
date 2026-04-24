# SkillSet Edu Platform Runbook

## 1. Environment (recommended: WSL2 Ubuntu)

```bash
sudo apt update
sudo apt install -y curl git python3 python3-pip ffmpeg
```

Install Node 24 + pnpm, then:

```bash
git clone https://github.com/skillset/skillset.git
cd skillset
pnpm install
pnpm skillset setup
```

## 2. Local LLM (Ollama)

On Windows host (or inside WSL, whichever is primary):

```bash
ollama serve
ollama pull qwen2.5:14b-instruct
```

If gateway runs in WSL while Ollama runs on Windows host, set plugin config `ollamaBaseUrl` to host-accessible URL (e.g. `http://<windows-host-ip>:11434`).

## 3. STT prerequisites

```bash
python3 -m pip install -r extensions/edu-planner/scripts/requirements.txt
```

For microphone mode, ensure microphone permissions are granted to terminal/WSL audio bridge.

## 4. Start gateway

```bash
pnpm gateway:watch --port 18789
```

Extension added: `extensions/edu-planner`.

## 5. Demo scenario (tool calls)

Use tool `edu_planner` with actions:

1. `seed_demo_data`
2. `list_assignments` for `student-1`
3. `generate_week_plan` for `student-1`
4. `suggest_deadline` for created assignment
5. `submit_assignment` with spent minutes
6. `leaderboard`
7. `health_status`
8. `pet_status` then `feed_pet`
9. `wallet_status`, `loyalty_catalog`, `buy_item`

STT:
- File mode: `transcribe_audio` with `payload.audioPath`
- Mic mode: `transcribe_microphone`

## 6. Smoke verification

After seed/demo actions:

```bash
node extensions/edu-planner/scripts/e2e-smoke.mjs
```

Expected: JSON with non-zero counts for users/assignments and initialized leaderboard/wallet/pet sections.

## 7. Notes for this Windows workspace

If `pnpm gateway:watch` fails on Windows with `EPERM ... dist/extensions/slack/.../node_modules` rename errors, run in WSL2 (recommended path by SkillSet docs) where file-lock contention is typically absent.

