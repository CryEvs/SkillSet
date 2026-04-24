import { spawn } from "node:child_process";
import os from "node:os";
import path from "node:path";
import type { SkillSetPluginApi } from "skillset/plugin-sdk/plugin-entry";
import { Type } from "typebox";
import { loadStore, saveStore, type Assignment } from "./store.js";

type PluginCfg = {
  enabled?: boolean;
  storePath?: string;
  ollamaBaseUrl?: string;
  ollamaModel?: string;
  sttPythonPath?: string;
  sttScriptPath?: string;
  defaultSessionMinutesCap?: number;
};

const ToolSchema = Type.Object({
  action: Type.String(),
  userId: Type.Optional(Type.String()),
  role: Type.Optional(Type.String()),
  payload: Type.Optional(Type.Unknown()),
});

function jsonResult(details: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(details, null, 2) }],
    details,
  };
}

function resolveStorePath(cfg: PluginCfg): string {
  return (
    cfg.storePath ||
    path.join(os.homedir(), ".skillset", "workspace", "data", "edu-planner", "store.json")
  );
}

async function callOllama(baseUrl: string, model: string, prompt: string): Promise<string> {
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, prompt, stream: false }),
  });
  if (!response.ok) {
    throw new Error(`Ollama request failed: ${response.status} ${response.statusText}`);
  }
  const json = (await response.json()) as { response?: string };
  return (json.response || "").trim();
}

async function analyzeLectureTranscript(baseUrl: string, model: string, transcript: string): Promise<string> {
  const prompt = [
    "Ты ИИ-помощник образовательной платформы.",
    "Проанализируй текст после STT и верни СТРОГО JSON без markdown.",
    "Текст может быть не только лекцией, но и формулировкой задания от учителя.",
    "Нужен формат:",
    "{",
    '  "lecturePlan": ["3-7 кратких пунктов содержания: тема, ключевые моменты, формат"],',
    '  "whatWasDone": ["что именно объяснили/разобрали на занятии или в аудио, 3-7 пунктов"],',
    '  "whatToDo": ["какое задание дано и какие шаги нужно выполнить дальше, 3-7 пунктов"]',
    "}",
    "Не добавляй поля кроме lecturePlan, whatWasDone, whatToDo.",
    "Текст лекции:",
    transcript,
  ].join("\n");
  return await callOllama(baseUrl, model, prompt);
}

async function runSttScript(
  pythonBin: string,
  scriptPath: string,
  mode: "file" | "mic",
  input?: string,
): Promise<string> {
  const args = [scriptPath, "--mode", mode];
  if (mode === "file" && input) {
    args.push("--file", input);
  }
  return await new Promise<string>((resolve, reject) => {
    const p = spawn(pythonBin, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    p.stdout.on("data", (chunk) => (stdout += String(chunk)));
    p.stderr.on("data", (chunk) => (stderr += String(chunk)));
    p.on("error", reject);
    p.on("exit", (code) => {
      if (code === 0) {
        resolve(stdout.trim());
        return;
      }
      reject(new Error(stderr || `STT script exited with code ${String(code)}`));
    });
  });
}

function estimateTypicalDays(assignments: Assignment[]): number {
  const done = assignments.filter((a) => a.status === "done");
  if (!done.length) {
    return 2;
  }
  const avgHours = done.reduce((acc, a) => acc + a.estimatedHours, 0) / done.length;
  return Math.max(1, Math.round(avgHours / 2));
}

export function createEduPlannerTool(api: SkillSetPluginApi) {
  return {
    name: "edu_planner",
    label: "Edu Planner",
    description: "Educational planner with local LLM, STT, progress, ratings, health and loyalty.",
    parameters: ToolSchema,
    async execute(_toolCallId: string, params: Record<string, unknown>) {
      const cfg = (api.pluginConfig || {}) as PluginCfg;
      if (cfg.enabled === false) {
        return jsonResult({ ok: false, error: "edu-planner plugin is disabled" });
      }

      const action = String(params.action || "");
      const userId = params.userId ? String(params.userId) : "";
      const payload =
        params.payload && typeof params.payload === "object"
          ? (params.payload as Record<string, unknown>)
          : {};

      const storePath = resolveStorePath(cfg);
      const store = await loadStore(storePath);

      switch (action) {
        case "register_user": {
          const id = String(payload.id || userId || `u-${Date.now()}`);
          if (!store.users.find((u) => u.id === id)) {
            store.users.push({
              id,
              name: String(payload.name || id),
              schoolId: String(payload.schoolId || "school-default"),
              role: (payload.role as "student" | "teacher" | "parent") || "student",
            });
            await saveStore(storePath, store);
          }
          return jsonResult({ ok: true, userId: id });
        }
        case "create_assignment": {
          const assignment: Assignment = {
            id: `a-${Date.now()}`,
            title: String(payload.title || "Untitled assignment"),
            description: String(payload.description || ""),
            subject: String(payload.subject || "general"),
            studentId: String(payload.studentId || userId),
            teacherId: payload.teacherId ? String(payload.teacherId) : undefined,
            dueDate: String(payload.dueDate || new Date(Date.now() + 86400000).toISOString()),
            estimatedHours: Number(payload.estimatedHours || 2),
            status: "todo",
            createdAt: new Date().toISOString(),
          };
          store.assignments.push(assignment);
          await saveStore(storePath, store);
          return jsonResult({ ok: true, assignment });
        }
        case "list_assignments": {
          const studentId = String(payload.studentId || userId || "");
          const items = studentId
            ? store.assignments.filter((x) => x.studentId === studentId)
            : store.assignments;
          return jsonResult({ ok: true, count: items.length, assignments: items });
        }
        case "submit_assignment": {
          const assignmentId = String(payload.assignmentId || "");
          const minutesSpent = Number(payload.minutesSpent || 60);
          const found = store.assignments.find((x) => x.id === assignmentId);
          if (!found) {
            return jsonResult({ ok: false, error: `Assignment not found: ${assignmentId}` });
          }
          found.status = "done";
          found.completedAt = new Date().toISOString();
          const sid = found.studentId;
          store.attempts.push({ assignmentId, studentId: sid, minutesSpent, at: new Date().toISOString() });
          store.points[sid] = (store.points[sid] || 0) + Math.max(10, Math.round(minutesSpent / 6));
          store.loyaltyWallets[sid] = (store.loyaltyWallets[sid] || 0) + 50;
          if (!store.pets[sid]) {
            store.pets[sid] = { level: 1, hunger: 0, exp: 0 };
          }
          store.pets[sid].exp += 15;
          store.pets[sid].hunger = Math.max(0, store.pets[sid].hunger - 10);
          if (store.pets[sid].exp >= store.pets[sid].level * 100) {
            store.pets[sid].level += 1;
            store.pets[sid].exp = 0;
          }
          await saveStore(storePath, store);
          return jsonResult({ ok: true, assignment: found, points: store.points[sid] });
        }
        case "generate_week_plan": {
          const studentId = String(payload.studentId || userId || "");
          const subjectHint = String(payload.subjectHint || "mixed");
          const tasks = store.assignments
            .filter((x) => !studentId || x.studentId === studentId)
            .filter((x) => x.status !== "done")
            .map((x) => `${x.title} (${x.subject}), due ${x.dueDate}, ~${x.estimatedHours}h`)
            .join("\n");
          const prompt = [
            "You are an educational planner for school students.",
            "Create a realistic weekly plan with daily tasks, breaks and deadlines.",
            "Return concise markdown with sections for each day.",
            `Subject focus: ${subjectHint}`,
            "Tasks:",
            tasks || "- No tasks yet",
          ].join("\n");
          const text = await callOllama(
            cfg.ollamaBaseUrl || "http://127.0.0.1:11434",
            cfg.ollamaModel || "qwen2.5:14b-instruct",
            prompt,
          );
          return jsonResult({ ok: true, plan: text });
        }
        case "suggest_deadline": {
          const assignmentId = String(payload.assignmentId || "");
          const found = store.assignments.find((x) => x.id === assignmentId);
          if (!found) {
            return jsonResult({ ok: false, error: "Assignment not found" });
          }
          const typicalDays = estimateTypicalDays(
            store.assignments.filter((x) => x.studentId === found.studentId),
          );
          const currentDeadline = new Date(found.dueDate);
          const suggested = new Date(Date.now() + typicalDays * 86400000);
          const warning =
            currentDeadline.getTime() < suggested.getTime()
              ? `Ты поставил срок на ${currentDeadline.toLocaleDateString()}, но обычно такие задачи занимают ${typicalDays} дня. Давай передвинем до ${suggested.toLocaleDateString()}?`
              : "Текущий срок выглядит реалистично.";
          return jsonResult({ ok: true, warning, suggestedDueDate: suggested.toISOString(), typicalDays });
        }
        case "health_status": {
          const sid = String(payload.studentId || userId || "");
          const used = store.healthUsageMinutes[sid] || 0;
          const cap = Number(cfg.defaultSessionMinutesCap || 180);
          const ratio = cap > 0 ? used / cap : 0;
          const level = ratio < 0.6 ? "good" : ratio < 1 ? "warn" : "overload";
          return jsonResult({ ok: true, studentId: sid, usedMinutes: used, dailyCapMinutes: cap, level });
        }
        case "log_session_minutes": {
          const sid = String(payload.studentId || userId || "");
          const minutes = Number(payload.minutes || 0);
          store.healthUsageMinutes[sid] = (store.healthUsageMinutes[sid] || 0) + minutes;
          await saveStore(storePath, store);
          return jsonResult({ ok: true, usedMinutes: store.healthUsageMinutes[sid] });
        }
        case "leaderboard": {
          const rows = Object.entries(store.points).map(([studentId, points]) => {
            const u = store.users.find((x) => x.id === studentId);
            return { studentId, points, schoolId: u?.schoolId || "school-default", name: u?.name || studentId };
          });
          rows.sort((a, b) => b.points - a.points);
          return jsonResult({ ok: true, leaderboard: rows.slice(0, Number(payload.limit || 100)) });
        }
        case "pet_status": {
          const sid = String(payload.studentId || userId || "");
          return jsonResult({ ok: true, pet: store.pets[sid] || { level: 1, hunger: 40, exp: 0 } });
        }
        case "feed_pet": {
          const sid = String(payload.studentId || userId || "");
          const food = Number(payload.food || 10);
          if (!store.pets[sid]) {
            store.pets[sid] = { level: 1, hunger: 40, exp: 0 };
          }
          store.pets[sid].hunger = Math.max(0, store.pets[sid].hunger - food);
          store.pets[sid].exp += Math.max(1, Math.round(food / 2));
          await saveStore(storePath, store);
          return jsonResult({ ok: true, pet: store.pets[sid] });
        }
        case "loyalty_catalog": {
          return jsonResult({ ok: true, catalog: store.loyaltyCatalog });
        }
        case "buy_item": {
          const sid = String(payload.studentId || userId || "");
          const sku = String(payload.sku || "");
          const item = store.loyaltyCatalog.find((x) => x.sku === sku);
          if (!item) {
            return jsonResult({ ok: false, error: "SKU not found" });
          }
          const balance = store.loyaltyWallets[sid] || 0;
          if (balance < item.cost) {
            return jsonResult({ ok: false, error: "Insufficient balance", balance, cost: item.cost });
          }
          store.loyaltyWallets[sid] = balance - item.cost;
          store.transactions.push({ userId: sid, amount: -item.cost, reason: `buy:${sku}`, at: new Date().toISOString() });
          await saveStore(storePath, store);
          return jsonResult({ ok: true, item, balance: store.loyaltyWallets[sid] });
        }
        case "wallet_status": {
          const sid = String(payload.studentId || userId || "");
          return jsonResult({ ok: true, balance: store.loyaltyWallets[sid] || 0 });
        }
        case "transcribe_audio": {
          const pythonBin = cfg.sttPythonPath || "python";
          const scriptPath =
            cfg.sttScriptPath ||
            path.join(process.cwd(), "extensions", "edu-planner", "scripts", "stt_transcribe.py");
          const audioPath = String(payload.audioPath || "");
          if (!audioPath) {
            return jsonResult({ ok: false, error: "payload.audioPath is required" });
          }
          const transcript = await runSttScript(pythonBin, scriptPath, "file", audioPath);
          return jsonResult({ ok: true, transcript });
        }
        case "analyze_lecture_audio": {
          const pythonBin = cfg.sttPythonPath || "python";
          const scriptPath =
            cfg.sttScriptPath ||
            path.join(process.cwd(), "extensions", "edu-planner", "scripts", "stt_transcribe.py");
          const audioPath = String(payload.audioPath || "");
          if (!audioPath) {
            return jsonResult({ ok: false, error: "payload.audioPath is required" });
          }
          const transcript = await runSttScript(pythonBin, scriptPath, "file", audioPath);
          const llmRaw = await analyzeLectureTranscript(
            cfg.ollamaBaseUrl || "http://127.0.0.1:11434",
            cfg.ollamaModel || "qwen2.5:14b-instruct",
            transcript,
          );
          let parsed:
            | { lecturePlan?: unknown; whatWasDone?: unknown; whatToDo?: unknown }
            | null = null;
          try {
            parsed = JSON.parse(llmRaw) as { lecturePlan?: unknown; whatWasDone?: unknown; whatToDo?: unknown };
          } catch {
            parsed = null;
          }
          if (!parsed) {
            return jsonResult({
              ok: true,
              transcript,
              lectureSummary: {
                lecturePlan: [],
                whatWasDone: [],
                whatToDo: [],
              },
              rawModelOutput: llmRaw,
              warning: "Model returned non-JSON output; inspect rawModelOutput.",
            });
          }
          const toStringArray = (value: unknown): string[] =>
            Array.isArray(value) ? value.map((x) => String(x)).filter((x) => x.trim().length > 0) : [];
          return jsonResult({
            ok: true,
            transcript,
            lectureSummary: {
              lecturePlan: toStringArray(parsed.lecturePlan),
              whatWasDone: toStringArray(parsed.whatWasDone),
              whatToDo: toStringArray(parsed.whatToDo),
            },
          });
        }
        case "transcribe_microphone": {
          const pythonBin = cfg.sttPythonPath || "python";
          const scriptPath =
            cfg.sttScriptPath ||
            path.join(process.cwd(), "extensions", "edu-planner", "scripts", "stt_transcribe.py");
          const transcript = await runSttScript(pythonBin, scriptPath, "mic");
          return jsonResult({ ok: true, transcript });
        }
        case "seed_demo_data": {
          if (!store.users.length) {
            store.users.push(
              { id: "teacher-1", name: "Иван Петров", role: "teacher", schoolId: "school-7" },
              { id: "student-1", name: "Аня Смирнова", role: "student", schoolId: "school-7" },
              { id: "parent-1", name: "Елена Смирнова", role: "parent", schoolId: "school-7" },
            );
          }
          if (!store.assignments.length) {
            store.assignments.push({
              id: "a-demo-1",
              title: "Решить 15 задач по алгебре",
              description: "Учебник 7 класс, параграф 12",
              subject: "math",
              studentId: "student-1",
              teacherId: "teacher-1",
              dueDate: new Date(Date.now() + 2 * 86400000).toISOString(),
              estimatedHours: 3,
              status: "todo",
              createdAt: new Date().toISOString(),
            });
          }
          await saveStore(storePath, store);
          return jsonResult({ ok: true, seeded: true, storePath });
        }
        default:
          return jsonResult({
            ok: false,
            error: `Unknown action: ${action}`,
            supportedActions: [
              "register_user",
              "create_assignment",
              "list_assignments",
              "submit_assignment",
              "generate_week_plan",
              "suggest_deadline",
              "transcribe_audio",
              "analyze_lecture_audio",
              "transcribe_microphone",
              "leaderboard",
              "health_status",
              "log_session_minutes",
              "pet_status",
              "feed_pet",
              "loyalty_catalog",
              "wallet_status",
              "buy_item",
              "seed_demo_data",
            ],
          });
      }
    },
  };
}

