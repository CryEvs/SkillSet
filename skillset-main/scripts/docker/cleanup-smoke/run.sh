#!/usr/bin/env bash
set -euo pipefail

cd /repo

export SKILLSET_STATE_DIR="/tmp/skillset-test"
export SKILLSET_CONFIG_PATH="${SKILLSET_STATE_DIR}/skillset.json"

echo "==> Build"
if ! pnpm build >/tmp/skillset-cleanup-build.log 2>&1; then
  cat /tmp/skillset-cleanup-build.log
  exit 1
fi

echo "==> Seed state"
mkdir -p "${SKILLSET_STATE_DIR}/credentials"
mkdir -p "${SKILLSET_STATE_DIR}/agents/main/sessions"
echo '{}' >"${SKILLSET_CONFIG_PATH}"
echo 'creds' >"${SKILLSET_STATE_DIR}/credentials/marker.txt"
echo 'session' >"${SKILLSET_STATE_DIR}/agents/main/sessions/sessions.json"

echo "==> Reset (config+creds+sessions)"
if ! pnpm skillset reset --scope config+creds+sessions --yes --non-interactive >/tmp/skillset-cleanup-reset.log 2>&1; then
  cat /tmp/skillset-cleanup-reset.log
  exit 1
fi

test ! -f "${SKILLSET_CONFIG_PATH}"
test ! -d "${SKILLSET_STATE_DIR}/credentials"
test ! -d "${SKILLSET_STATE_DIR}/agents/main/sessions"

echo "==> Recreate minimal config"
mkdir -p "${SKILLSET_STATE_DIR}/credentials"
echo '{}' >"${SKILLSET_CONFIG_PATH}"

echo "==> Uninstall (state only)"
if ! pnpm skillset uninstall --state --yes --non-interactive >/tmp/skillset-cleanup-uninstall.log 2>&1; then
  cat /tmp/skillset-cleanup-uninstall.log
  exit 1
fi

test ! -d "${SKILLSET_STATE_DIR}"

echo "OK"
