import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const storePath = path.join(
  os.homedir(),
  ".skillset",
  "workspace",
  "data",
  "edu-planner",
  "store.json",
);

async function readStore() {
  const content = await fs.readFile(storePath, "utf8");
  return JSON.parse(content);
}

async function main() {
  const store = await readStore();
  const summary = {
    users: store.users?.length || 0,
    assignments: store.assignments?.length || 0,
    doneAssignments: (store.assignments || []).filter((x) => x.status === "done").length,
    leaderboardRows: Object.keys(store.points || {}).length,
    wallets: Object.keys(store.loyaltyWallets || {}).length,
    pets: Object.keys(store.pets || {}).length,
  };
  console.log(JSON.stringify({ ok: true, summary }, null, 2));
}

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, error: String(error) }, null, 2));
  process.exit(1);
});

