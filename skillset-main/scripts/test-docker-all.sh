#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

pnpm test:docker:live-build
SKILLSET_SKIP_DOCKER_BUILD=1 pnpm test:docker:live-models
SKILLSET_SKIP_DOCKER_BUILD=1 pnpm test:docker:live-gateway

export SKILLSET_DOCKER_E2E_IMAGE="${SKILLSET_DOCKER_E2E_IMAGE:-skillset-docker-e2e:local}"
pnpm test:docker:e2e-build

SKILLSET_SKIP_DOCKER_BUILD=1 pnpm test:docker:openwebui
SKILLSET_SKIP_DOCKER_BUILD=1 pnpm test:docker:onboard
SKILLSET_SKIP_DOCKER_BUILD=1 pnpm test:docker:npm-onboard-channel-agent
SKILLSET_SKIP_DOCKER_BUILD=1 pnpm test:docker:gateway-network
SKILLSET_SKIP_DOCKER_BUILD=1 pnpm test:docker:openai-web-search-minimal
SKILLSET_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
SKILLSET_SKIP_DOCKER_BUILD=1 pnpm test:docker:pi-bundle-mcp-tools
SKILLSET_SKIP_DOCKER_BUILD=1 pnpm test:docker:cron-mcp-cleanup
pnpm test:docker:qr
SKILLSET_SKIP_DOCKER_BUILD=1 pnpm test:docker:doctor-switch
SKILLSET_SKIP_DOCKER_BUILD=1 pnpm test:docker:plugins
SKILLSET_SKIP_DOCKER_BUILD=1 pnpm test:docker:plugin-update
SKILLSET_SKIP_DOCKER_BUILD=1 pnpm test:docker:config-reload
SKILLSET_SKIP_DOCKER_BUILD=1 pnpm test:docker:bundled-channel-deps
pnpm test:docker:cleanup
