import "./styles.css";
import {
  buildDeviceAuthPayloadV3,
  loadOrCreateDeviceIdentity,
  signDevicePayload,
} from "./device-identity";

type GatewayReqFrame = { type: "req"; id: string; method: string; params?: unknown };
type ChatAttachment = { type: "audio" | "image"; mimeType: string; content: string; fileName: string };
type UserRole = "student" | "parent" | "teacher";
type GradeRow = { subject: string; grade: string; comment: string };
type EventProjectCard = {
  title: string;
  imageUrl: string | null;
  externalUrl: string | null;
  dateStart: string | null;
  dateEnd: string | null;
  minAge: number | null;
  maxAge: number | null;
};
type PlannerItem = { id: string; text: string; createdAt: number };
type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
};

const storage = {
  gatewayUrl: "skillset.gateway.url",
  gatewayToken: "skillset.gateway.token",
  sessionKey: "skillset.session.key",
  authToken: "skillset.auth.token",
  userName: "skillset.user.name",
  userRole: "skillset.user.role",
  diary: "skillset.diary.rows",
  plannerItems: "skillset.planner.items",
};

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("Missing app root");
const appRoot = app;

const inputClass =
  "w-full rounded-xl border border-sky-200 bg-white px-3 py-2 text-slate-700 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200";
const buttonClass =
  "rounded-xl border border-sky-300 bg-sky-100 px-4 py-2 text-sm font-semibold text-sky-800 transition hover:bg-sky-200";

let ws: WebSocket | null = null;
let pending = new Map<string, (payload: unknown) => void>();
let pendingErr = new Map<string, (error: unknown) => void>();
let attachment: ChatAttachment | null = null;
let activeTab: "profile" | "diary" | "chat" | "events" | "plans" = "diary";
let chatEl: HTMLDivElement | null = null;
let sttRecognition: SpeechRecognitionLike | null = null;
let sttListening = false;
let connectNonce: string | null = null;
let eventsLoading = false;
let eventsError = "";
let eventsProjects: EventProjectCard[] = [];
let typingBubbleEl: HTMLDivElement | null = null;
let typingTimer: number | null = null;
let typingRenderedText = "";
let plannerItems: PlannerItem[] = loadPlannerItems();
let pendingHistoryTimer: number | null = null;
const plannerRoleInjectedSessions = new Set<string>();

const initialDiary = loadDiaryRows();
renderApp(Boolean(localStorage.getItem(storage.authToken)), initialDiary);

function renderApp(isLoggedIn: boolean, rows: GradeRow[]) {
  appRoot.innerHTML = isLoggedIn ? dashboardMarkup(rows) : loginMarkup();
  if (isLoggedIn) {
    bindDashboard();
  } else {
    bindLogin();
  }
}

function loginMarkup() {
  return `
    <section class="min-h-screen bg-gradient-to-b from-sky-50 to-blue-100 p-4 grid place-items-center">
      <div class="w-full max-w-xl rounded-2xl border border-sky-200 bg-white p-6 shadow-sm space-y-3">
        <h1 class="text-3xl font-bold text-sky-900">SkillSet</h1>
        <p class="text-sm text-sky-700">Вход по токену в образовательную систему</p>
        <input class="${inputClass}" id="authToken" placeholder="Токен входа" />
        <input class="${inputClass}" id="userName" placeholder="Имя пользователя" />
        <select class="${inputClass}" id="userRole">
          <option value="student">Ученик</option>
          <option value="parent">Родитель</option>
          <option value="teacher">Учитель</option>
        </select>
        <button class="${buttonClass} w-full" id="loginBtn">Войти</button>
      </div>
    </section>
  `;
}

function dashboardMarkup(rows: GradeRow[]) {
  const userName = localStorage.getItem(storage.userName) ?? "Пользователь";
  const userRole = (localStorage.getItem(storage.userRole) as UserRole | null) ?? "student";
  return `
    <section class="min-h-screen bg-gradient-to-b from-sky-50 to-blue-100 md:grid md:grid-cols-[240px_1fr]">
      <aside class="border-b border-sky-200 bg-sky-100 p-4 md:border-b-0 md:border-r">
        <div class="mb-3 text-2xl font-bold text-sky-900">SkillSet</div>
        <div class="grid gap-2 md:content-start">
          <button class="nav-btn rounded-xl border px-3 py-2 text-left text-sm font-semibold transition ${activeTab === "profile" ? "border-sky-600 bg-sky-600 text-white" : "border-sky-300 bg-white text-sky-800 hover:bg-sky-50"}" data-tab="profile">Профиль</button>
          <button class="nav-btn rounded-xl border px-3 py-2 text-left text-sm font-semibold transition ${activeTab === "diary" ? "border-sky-600 bg-sky-600 text-white" : "border-sky-300 bg-white text-sky-800 hover:bg-sky-50"}" data-tab="diary">Дневник</button>
          <button class="nav-btn rounded-xl border px-3 py-2 text-left text-sm font-semibold transition ${activeTab === "chat" ? "border-sky-600 bg-sky-600 text-white" : "border-sky-300 bg-white text-sky-800 hover:bg-sky-50"}" data-tab="chat">Планировщик</button>
          <button class="nav-btn rounded-xl border px-3 py-2 text-left text-sm font-semibold transition ${activeTab === "events" ? "border-sky-600 bg-sky-600 text-white" : "border-sky-300 bg-white text-sky-800 hover:bg-sky-50"}" data-tab="events">События</button>
          <button class="nav-btn rounded-xl border px-3 py-2 text-left text-sm font-semibold transition ${activeTab === "plans" ? "border-sky-600 bg-sky-600 text-white" : "border-sky-300 bg-white text-sky-800 hover:bg-sky-50"}" data-tab="plans">Планы</button>
          <button id="logoutBtn" class="${buttonClass} text-left">Выйти</button>
        </div>
      </aside>
      <main class="grid gap-3 p-4">
        <section id="profilePanel" class="rounded-2xl border border-sky-200 bg-white p-4 shadow-sm ${activeTab === "profile" ? "" : "hidden"}">
          ${profileMarkup(userName, userRole)}
        </section>
        <section id="diaryPanel" class="rounded-2xl border border-sky-200 bg-white p-4 shadow-sm ${activeTab === "diary" ? "" : "hidden"}">
          ${diaryMarkup(rows, userRole)}
        </section>
        <section id="chatPanel" class="rounded-2xl border border-sky-200 bg-white p-4 shadow-sm ${activeTab === "chat" ? "" : "hidden"}">
          ${chatMarkup()}
        </section>
        <section id="eventsPanel" class="rounded-2xl border border-sky-200 bg-white p-4 shadow-sm ${activeTab === "events" ? "" : "hidden"}">
          ${eventsMarkup()}
        </section>
        <section id="plansPanel" class="rounded-2xl border border-sky-200 bg-white p-4 shadow-sm ${activeTab === "plans" ? "" : "hidden"}">
          ${plansMarkup()}
        </section>
      </main>
    </section>
  `;
}

function profileMarkup(userName: string, userRole: UserRole) {
  return `
    <div class="text-xl font-bold text-sky-900">Профиль</div>
    <div><strong>Пользователь:</strong> ${escapeHtml(userName)}</div>
    <div><strong>Роль:</strong> ${roleLabel(userRole)}</div>
  `;
}

function chatMarkup() {
  return `
    <div class="grid gap-2">
      <div class="text-xl font-bold text-sky-900">Планировщик</div>
      <div id="connectionState" class="text-sm text-sky-700">Подключение...</div>
    </div>
    <div id="chat" class="min-h-[300px] max-h-[420px] overflow-auto rounded-xl border border-sky-200 bg-sky-50 p-3"></div>
    <div class="grid gap-2">
      <div class="flex flex-wrap items-center gap-2">
        <input class="${inputClass}" id="fileInput" type="file" accept="audio/*,image/*" />
        <span id="fileState" class="text-sm text-sky-700"></span>
      </div>
      <textarea class="${inputClass} min-h-[96px]" id="messageInput" placeholder="Введите сообщение"></textarea>
      <div class="flex flex-wrap gap-2">
        <button class="${buttonClass}" id="sttBtn">STT (микрофон)</button>
        <button class="${buttonClass}" id="sendBtn">Send</button>
      </div>
    </div>
  `;
}

function plansMarkup() {
  const items = plannerItems
    .map(
      (item) => `
      <div class="rounded-lg border border-sky-100 bg-white p-2">
        <div class="text-xs text-sky-600">${new Date(item.createdAt).toLocaleString("ru-RU")}</div>
        <div class="mt-1 whitespace-pre-wrap text-sm text-slate-800">${escapeHtml(item.text)}</div>
      </div>
    `,
    )
    .join("");
  return `
    <aside class="max-h-[600px] overflow-auto rounded-xl border border-sky-200 bg-sky-50 p-3">
      <div class="mb-2 flex items-center justify-between gap-2">
        <div class="text-sm font-semibold text-sky-900">Подтвержденные планы</div>
        <button class="${buttonClass} px-2 py-1 text-xs" id="clearPlannerBtn">Очистить</button>
      </div>
      <div class="grid gap-2">
        ${items || `<div class="text-sm text-sky-700">Пока нет подтвержденных планов.</div>`}
      </div>
    </aside>
  `;
}

function diaryMarkup(rows: GradeRow[], role: UserRole) {
  const rowsHtml = rows
    .map(
      (row, i) => `
      <tr>
        <td class="border-b border-sky-100 p-2"><input class="${inputClass}" data-kind="subject" data-index="${i}" value="${escapeHtml(row.subject)}" ${role !== "teacher" ? "disabled" : ""}></td>
        <td class="border-b border-sky-100 p-2"><input class="${inputClass}" data-kind="grade" data-index="${i}" value="${escapeHtml(row.grade)}" ${role !== "teacher" ? "disabled" : ""}></td>
        <td class="border-b border-sky-100 p-2"><input class="${inputClass}" data-kind="comment" data-index="${i}" value="${escapeHtml(row.comment)}" ${role !== "teacher" ? "disabled" : ""}></td>
      </tr>
    `,
    )
    .join("");
  return `
    <div class="text-xl font-bold text-sky-900">Дневник</div>
    <p class="text-sm text-sky-700">Учитель может выставлять оценки. Ученик и родитель видят результат.</p>
    <div class="overflow-auto rounded-xl border border-sky-200">
    <table class="w-full border-collapse bg-white text-sm">
      <thead class="bg-sky-50 text-sky-800"><tr><th class="p-2 text-left">Предмет</th><th class="p-2 text-left">Оценка</th><th class="p-2 text-left">Комментарий</th></tr></thead>
      <tbody>${rowsHtml}</tbody>
    </table>
    </div>
    <div class="flex flex-wrap gap-2">
      ${role === "teacher" ? `<button class="${buttonClass}" id="addRowBtn">Добавить запись</button><button class="${buttonClass}" id="saveDiaryBtn">Сохранить</button>` : ""}
    </div>
  `;
}

function eventsMarkup() {
  const body = eventsLoading
    ? `<div class="text-sm text-sky-700">Загрузка проектов...</div>`
    : eventsError
      ? `<div class="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">${escapeHtml(eventsError)}</div>`
      : eventsProjects.length === 0
        ? `<div class="text-sm text-sky-700">Нет данных по проектам.</div>`
        : `<div class="flex flex-wrap gap-3">${eventsProjects.map((item) => eventCardMarkup(item)).join("")}</div>`;

  return `
    <div class="mb-3 flex items-center justify-between gap-2">
      <div>
        <div class="text-xl font-bold text-sky-900">События</div>
        <p class="text-sm text-sky-700">Проекты Движения Первых</p>
      </div>
      <button class="${buttonClass}" id="eventsRefreshBtn">Обновить</button>
    </div>
    ${body}
  `;
}

function eventCardMarkup(item: EventProjectCard): string {
  const image = item.imageUrl
    ? `<img src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.title)}" class="h-[220px] w-full rounded-xl object-contain object-center" loading="lazy" />`
    : `<div class="grid h-[220px] w-full place-items-center rounded-xl text-sm text-sky-700">Нет изображения</div>`;
  const dateText = formatDateRange(item.dateStart, item.dateEnd);
  const ageText = formatAgeRange(item.minAge, item.maxAge);
  const inner = `
    <article class="flex h-[400px] w-[300px] flex-col rounded-xl border border-sky-200 bg-white p-3 shadow-sm transition hover:shadow-md">
      <div class="grid h-[220px] w-full place-items-center bg-sky-50">
        ${image}
      </div>
      <div class="mt-3 flex-1">
        <div class="line-clamp-2 text-sm font-semibold text-slate-800">${escapeHtml(item.title)}</div>
        <div class="mt-1 text-xs text-sky-800">Даты: ${escapeHtml(dateText)}</div>
        <div class="text-xs text-sky-800">Возраст: ${escapeHtml(ageText)}</div>
        <div class="mt-2 text-xs font-medium text-sky-700">Нажмите, чтобы узнать подробности</div>
      </div>
    </article>
  `;
  if (item.externalUrl) {
    return `<a href="${escapeHtml(item.externalUrl)}" target="_blank" rel="noreferrer noopener" class="block">${inner}</a>`;
  }
  return inner;
}

function addMessage(role: "user" | "assistant" | "system", text: string) {
  if (!chatEl) return;
  const div = document.createElement("div");
  div.className =
    "mb-2 whitespace-pre-wrap rounded-xl border p-3 text-sm " +
    (role === "user"
      ? "border-sky-200 bg-blue-100"
      : role === "system"
        ? "border-amber-200 bg-amber-50"
        : "border-sky-100 bg-white");
  const textNode = document.createElement("div");
  textNode.innerHTML = renderMarkdown(text);
  div.appendChild(textNode);
  if (role === "assistant") {
    const btn = document.createElement("button");
    btn.className = `${buttonClass} mt-2 px-2 py-1 text-xs`;
    btn.textContent = "Подтвердить план";
    btn.onclick = () => {
      confirmPlannerItem(text);
    };
    div.appendChild(btn);
  }
  chatEl.appendChild(div);
  chatEl.scrollTop = chatEl.scrollHeight;
}

function id() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function request(method: string, params?: unknown): Promise<unknown> {
  return new Promise((resolve, reject) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      reject(new Error("Not connected"));
      return;
    }
    const requestId = id();
    pending.set(requestId, resolve);
    pendingErr.set(requestId, reject);
    const frame: GatewayReqFrame = { type: "req", id: requestId, method, params };
    ws.send(JSON.stringify(frame));
  });
}

async function loadHistory() {
  if (!chatEl) return;
  resetTypingBubble();
  const response = (await request("chat.history", {
    sessionKey: localStorage.getItem(storage.sessionKey) ?? "main",
    limit: 80,
  })) as { messages?: Array<{ role?: string; content?: unknown; text?: string }> };
  chatEl.innerHTML = "";
  for (const m of response.messages ?? []) {
    const normalizedRole = (m.role ?? "assistant").toLowerCase();
    const role = normalizedRole === "user" ? "user" : normalizedRole === "system" ? "system" : "assistant";
    const content = normalizeMessageText(m);
    if (!content.trim() || isNoiseMessage(content)) continue;
    if (role === "system") continue;
    addMessage(role, content);
  }
  bindPlannerEvents();
}

async function connectChat() {
  const connectionStateEl = document.querySelector<HTMLDivElement>("#connectionState");
  const gatewayUrl = localStorage.getItem(storage.gatewayUrl) ?? "ws://127.0.0.1:18789";
  const gatewayToken = localStorage.getItem(storage.gatewayToken) ?? "";
  const sessionKey = localStorage.getItem(storage.sessionKey) ?? "main";
  if (!gatewayUrl) return;
  localStorage.setItem(storage.gatewayUrl, gatewayUrl);
  localStorage.setItem(storage.gatewayToken, gatewayToken);
  localStorage.setItem(storage.sessionKey, sessionKey);
  ws?.close();
  if (connectionStateEl) connectionStateEl.textContent = "Подключение к gateway...";
  ws = new WebSocket(gatewayUrl);
  ws.onopen = async () => {
    if (connectionStateEl) connectionStateEl.textContent = "Открыт сокет, ждем challenge...";
  };
  ws.onmessage = async (event) => {
    const data = JSON.parse(String(event.data)) as {
      type?: string;
      event?: string;
      payload?: unknown;
      id?: string;
      ok?: boolean;
      payloadResult?: unknown;
      error?: unknown;
      method?: string;
      params?: unknown;
    };
    if (data.type === "event" && data.event === "connect.challenge") {
      try {
        const challengePayload = data.payload as { nonce?: unknown } | undefined;
        connectNonce =
          challengePayload && typeof challengePayload.nonce === "string"
            ? challengePayload.nonce
            : null;
        await sendGatewayConnectHandshake(gatewayToken);
        if (connectionStateEl) connectionStateEl.textContent = "Подключено";
        await loadHistory();
      } catch (error) {
        if (connectionStateEl) connectionStateEl.textContent = "Ошибка авторизации";
      }
      return;
    }
    if (data.id && pending.has(data.id)) {
      const resolve = pending.get(data.id)!;
      const reject = pendingErr.get(data.id)!;
      pending.delete(data.id);
      pendingErr.delete(data.id);
      if (data.ok === false || data.error) {
        reject(data.error ?? new Error("Request failed"));
      } else {
        const payload = (data as { payload?: unknown }).payload;
        resolve(payload);
      }
      return;
    }
    if (data.type === "event" && data.event === "chat.event") {
      const payload = data.payload as { state?: string; message?: unknown } | undefined;
      const liveText = normalizeMessageText(payload?.message as { text?: string; content?: unknown } | undefined);
      if (liveText && !isNoiseMessage(liveText)) {
        updateTypingBubble(liveText);
      }
      if (payload?.state === "final") {
        stopPendingHistoryRefresh();
        await loadHistory();
      }
    }
  };
  ws.onerror = () => {
    if (connectionStateEl) connectionStateEl.textContent = "Ошибка WebSocket";
  };
  ws.onclose = () => {
    if (connectionStateEl) connectionStateEl.textContent = "Отключено";
  };
}

async function sendGatewayConnectHandshake(token: string) {
  const authToken = token || localStorage.getItem(storage.authToken) || "";
  const clientId = "webchat-ui";
  const clientMode = "webchat";
  const clientPlatform = navigator.platform || "web";
  const clientDeviceFamily = "browser";
  const scopes = ["operator.read", "operator.write", "operator.admin", "operator.approvals"];
  const deviceIdentity = await loadOrCreateDeviceIdentity();
  let device:
    | {
        id: string;
        publicKey: string;
        signature: string;
        signedAt: number;
        nonce: string;
      }
    | undefined;
  if (deviceIdentity && connectNonce) {
    const signedAtMs = Date.now();
    const payloadV3 = buildDeviceAuthPayloadV3({
      deviceId: deviceIdentity.deviceId,
      clientId,
      clientMode,
      role: "operator",
      scopes,
      signedAtMs,
      token: authToken || null,
      nonce: connectNonce,
      platform: clientPlatform,
      deviceFamily: clientDeviceFamily,
    });
    const signature = await signDevicePayload(deviceIdentity.privateKey, payloadV3);
    device = {
      id: deviceIdentity.deviceId,
      publicKey: deviceIdentity.publicKey,
      signature,
      signedAt: signedAtMs,
      nonce: connectNonce,
    };
  }
  const params = {
    minProtocol: 3,
    maxProtocol: 3,
    client: {
      id: clientId,
      version: "webchat-ui",
      platform: clientPlatform,
      deviceFamily: clientDeviceFamily,
      mode: clientMode,
    },
    role: "operator",
    scopes,
    caps: ["tool-events"],
    auth: authToken ? { token: authToken } : undefined,
    userAgent: navigator.userAgent,
    locale: navigator.language,
    device,
  };
  await request("connect", params);
}

function bindChatEvents() {
  chatEl = document.querySelector<HTMLDivElement>("#chat");
  if (!chatEl) return;
  const sendBtn = document.querySelector<HTMLButtonElement>("#sendBtn");
  const sttBtn = document.querySelector<HTMLButtonElement>("#sttBtn");
  const messageInput = document.querySelector<HTMLTextAreaElement>("#messageInput");
  const fileInput = document.querySelector<HTMLInputElement>("#fileInput");
  const fileState = document.querySelector<HTMLSpanElement>("#fileState");
  if (!sendBtn || !sttBtn || !messageInput || !fileInput || !fileState) {
    return;
  }
  if (!ws || ws.readyState !== WebSocket.OPEN) void connectChat();
  bindPlannerEvents();

  fileInput.onchange = () => {
    void onSelectFile(fileInput, fileState);
  };

  sendBtn.onclick = () => {
    void onSendMessage(messageInput, fileInput, fileState);
  };

  messageInput.onkeydown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void onSendMessage(messageInput, fileInput, fileState);
    }
  };

  sttBtn.onclick = () => {
    toggleStt(messageInput, sttBtn);
  };
}

async function onSelectFile(fileInput: HTMLInputElement, fileState: HTMLSpanElement) {
  const file = fileInput.files?.[0];
  if (!file) {
    attachment = null;
    fileState.textContent = "";
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    const dataUrl = String(reader.result ?? "");
    const b64 = dataUrl.split(",")[1] ?? "";
    const kind = file.type.startsWith("audio/") ? "audio" : "image";
    attachment = {
      type: kind,
      mimeType: file.type || (kind === "audio" ? "audio/mpeg" : "image/png"),
      content: b64,
      fileName: file.name,
    };
    fileState.textContent = `${file.name} (${Math.round(file.size / 1024)} KB)`;
  };
  reader.readAsDataURL(file);
}

async function onSendMessage(
  messageInput: HTMLTextAreaElement,
  fileInput: HTMLInputElement,
  fileState: HTMLSpanElement,
) {
  const text = messageInput.value.trim();
  const sessionKey = localStorage.getItem(storage.sessionKey) ?? "main";
  if (!text && !attachment) return;
  try {
    const messageToSend = buildOutgoingMessage(text, attachment);
    if (text) addMessage("user", text);
    if (!text && attachment?.type === "audio") {
      addMessage("user", "Аудио отправлено на STT и AI-анализ.");
    }
    resetTypingBubble();
    await ensurePlannerSystemRole(sessionKey);
    await request("chat.send", {
      sessionKey,
      message: messageToSend,
      idempotencyKey: id(),
      deliver: false,
      attachments: attachment ? [attachment] : undefined,
    });
    messageInput.value = "";
    fileInput.value = "";
    attachment = null;
    fileState.textContent = "";
    startPendingHistoryRefresh();
  } catch (error) {
    console.error("Send error:", formatUnknownError(error));
    resetTypingBubble();
  }
}

function bindLogin() {
  const authTokenEl = document.querySelector<HTMLInputElement>("#authToken");
  const userNameEl = document.querySelector<HTMLInputElement>("#userName");
  const userRoleEl = document.querySelector<HTMLSelectElement>("#userRole");
  const loginBtn = document.querySelector<HTMLButtonElement>("#loginBtn");
  if (!authTokenEl || !userNameEl || !userRoleEl || !loginBtn) {
    return;
  }

  authTokenEl.value = localStorage.getItem(storage.authToken) ?? "";
  userNameEl.value = localStorage.getItem(storage.userName) ?? "";
  userRoleEl.value = (localStorage.getItem(storage.userRole) as UserRole | null) ?? "student";

  loginBtn.onclick = () => {
    const token = authTokenEl.value.trim();
    if (!token) return;
    localStorage.setItem(storage.authToken, token);
    localStorage.setItem(storage.userName, userNameEl.value.trim() || "Пользователь");
    localStorage.setItem(storage.userRole, userRoleEl.value as UserRole);
    localStorage.setItem(storage.gatewayUrl, "ws://127.0.0.1:18789");
    localStorage.setItem(storage.gatewayToken, token);
    localStorage.setItem(storage.sessionKey, "main");
    renderApp(true, loadDiaryRows());
  };
}

function bindDashboard() {
  const navBtns = Array.from(document.querySelectorAll<HTMLButtonElement>(".nav-btn"));
  const logoutBtn = document.querySelector<HTMLButtonElement>("#logoutBtn");
  const userRole = (localStorage.getItem(storage.userRole) as UserRole | null) ?? "student";
  navBtns.forEach((btn) => {
    btn.onclick = () => {
      activeTab = (btn.dataset.tab as "profile" | "diary" | "chat" | "events" | "plans") ?? "diary";
      renderApp(true, loadDiaryRows());
    };
  });
  logoutBtn?.addEventListener("click", () => {
    ws?.close();
    ws = null;
    localStorage.removeItem(storage.authToken);
    renderApp(false, loadDiaryRows());
  });

  if (activeTab === "chat") {
    bindChatEvents();
  } else if (activeTab === "events") {
    bindEventsEvents();
  } else if (activeTab === "plans") {
    bindPlannerEvents();
  } else {
    bindDiaryEvents(userRole);
  }
}

function bindPlannerEvents() {
  const clearBtn = document.querySelector<HTMLButtonElement>("#clearPlannerBtn");
  if (!clearBtn) return;
  clearBtn.onclick = () => {
    plannerItems = [];
    savePlannerItems();
    if (activeTab === "chat") renderApp(true, loadDiaryRows());
  };
}

function bindEventsEvents() {
  const refreshBtn = document.querySelector<HTMLButtonElement>("#eventsRefreshBtn");
  refreshBtn?.addEventListener("click", () => {
    void loadEventsProjects(true);
  });
  if (!eventsLoading && eventsProjects.length === 0 && !eventsError) {
    void loadEventsProjects(false);
  }
}

async function loadEventsProjects(forceReload: boolean) {
  if (eventsLoading) return;
  if (!forceReload && eventsProjects.length > 0) return;
  eventsLoading = true;
  eventsError = "";
  if (activeTab === "events") renderApp(true, loadDiaryRows());
  try {
    const payload = {
      operationName: "projectSortList",
      variables: {
        pagination: { offset: 0, limit: 12 },
        order: [{ field: "dateEnd", order: "SORT_DESC" }],
        type: "FLAGSHIP",
        isArchive: false,
      },
      query:
        "query projectSortList($isArchive: Boolean!, $order: [OrderInputObject], $pagination: PaginationFilter = {limit: 20}, $type: ProjectSortPageType!, $directions: [Direction], $ages: [String], $tags: [Uuid], $regionID: Uuid, $search: String) { projectSortList( isArchive: $isArchive order: $order pagination: $pagination type: $type directions: $directions ages: $ages tags: $tags regionID: $regionID search: $search ) { totalCount nodes { project { ...MainProjectItem __typename } superProject { ...MainSuperProjectItem __typename } projectType __typename } __typename } } fragment MainProjectItem on ProjectObject { ID publicID title photoUrl dateStart dateEnd registrationStart registrationEnd minAge maxAge territoryLevel activitiesCount externalUrl displayedTerritoryLevel status tags { ID name __typename } direction __typename } fragment MainSuperProjectItem on SuperProjectObject { ID name minAge maxAge beginsAt endsAt publicID imageUrl territoryLevel externalUrl status activeProjectsCount tags { ID name __typename } userRoles { ID name description __typename } __typename }",
    };
    const response = await fetch("https://api.projects.pervye.ru/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error(`Ошибка загрузки: HTTP ${response.status}`);
    }
    const json = (await response.json()) as {
      data?: {
        projectSortList?: {
          nodes?: Array<{
            project?: {
              title?: string;
              photoUrl?: string | null;
              externalUrl?: string | null;
              dateStart?: string | null;
              dateEnd?: string | null;
              minAge?: number | null;
              maxAge?: number | null;
            } | null;
            superProject?: {
              name?: string;
              imageUrl?: string | null;
              externalUrl?: string | null;
              beginsAt?: string | null;
              endsAt?: string | null;
              minAge?: number | null;
              maxAge?: number | null;
            } | null;
          }>;
        };
      };
    };
    const nodes = json.data?.projectSortList?.nodes ?? [];
    eventsProjects = nodes
      .map((node) => {
        const projectTitle = node.project?.title?.trim();
        const superTitle = node.superProject?.name?.trim();
        const title = projectTitle || superTitle || "";
        const imageUrl = node.project?.photoUrl ?? node.superProject?.imageUrl ?? null;
        const externalUrl = node.project?.externalUrl ?? node.superProject?.externalUrl ?? null;
        const dateStart = node.project?.dateStart ?? node.superProject?.beginsAt ?? null;
        const dateEnd = node.project?.dateEnd ?? node.superProject?.endsAt ?? null;
        const minAge = node.project?.minAge ?? node.superProject?.minAge ?? null;
        const maxAge = node.project?.maxAge ?? node.superProject?.maxAge ?? null;
        return { title, imageUrl, externalUrl, dateStart, dateEnd, minAge, maxAge };
      })
      .filter((item) => Boolean(item.title));
  } catch (error) {
    eventsError = `Не удалось получить проекты: ${formatUnknownError(error)}`;
  } finally {
    eventsLoading = false;
    if (activeTab === "events") renderApp(true, loadDiaryRows());
  }
}

function bindDiaryEvents(role: UserRole) {
  if (role !== "teacher") return;
  const addRowBtn = document.querySelector<HTMLButtonElement>("#addRowBtn");
  const saveDiaryBtn = document.querySelector<HTMLButtonElement>("#saveDiaryBtn");
  addRowBtn?.addEventListener("click", () => {
    const rows = loadDiaryRows();
    rows.push({ subject: "Новый предмет", grade: "", comment: "" });
    saveDiaryRows(rows);
    renderApp(true, rows);
  });
  saveDiaryBtn?.addEventListener("click", () => {
    const rows = collectDiaryRowsFromInputs();
    saveDiaryRows(rows);
    renderApp(true, rows);
  });
}

function collectDiaryRowsFromInputs(): GradeRow[] {
  const subjects = Array.from(document.querySelectorAll<HTMLInputElement>('input[data-kind="subject"]'));
  const grades = Array.from(document.querySelectorAll<HTMLInputElement>('input[data-kind="grade"]'));
  const comments = Array.from(document.querySelectorAll<HTMLInputElement>('input[data-kind="comment"]'));
  const rows: GradeRow[] = [];
  for (let i = 0; i < subjects.length; i += 1) {
    rows.push({
      subject: subjects[i]?.value.trim() ?? "",
      grade: grades[i]?.value.trim() ?? "",
      comment: comments[i]?.value.trim() ?? "",
    });
  }
  return rows;
}

function loadDiaryRows(): GradeRow[] {
  const raw = localStorage.getItem(storage.diary);
  if (!raw) {
    return [
      { subject: "Математика", grade: "5", comment: "Отличная работа" },
      { subject: "Русский язык", grade: "4", comment: "Проверить орфографию" },
    ];
  }
  try {
    const parsed = JSON.parse(raw) as GradeRow[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveDiaryRows(rows: GradeRow[]) {
  localStorage.setItem(storage.diary, JSON.stringify(rows));
}

function roleLabel(role: UserRole): string {
  if (role === "teacher") return "Учитель";
  if (role === "parent") return "Родитель";
  return "Ученик";
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function toggleStt(messageInput: HTMLTextAreaElement, sttBtn: HTMLButtonElement) {
  const speechCtor = getSpeechRecognitionCtor();
  if (!speechCtor) {
    addMessage("system", "STT недоступен в этом браузере");
    return;
  }
  if (!sttRecognition) {
    sttRecognition = new speechCtor();
    sttRecognition.lang = "ru-RU";
    sttRecognition.continuous = false;
    sttRecognition.interimResults = false;
    sttRecognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript ?? "")
        .join(" ")
        .trim();
      if (!transcript) return;
      messageInput.value = messageInput.value ? `${messageInput.value} ${transcript}` : transcript;
    };
    sttRecognition.onerror = (event) => {
      addMessage("system", `STT error: ${event.error ?? "unknown"}`);
      sttListening = false;
      sttBtn.textContent = "STT (микрофон)";
    };
    sttRecognition.onend = () => {
      sttListening = false;
      sttBtn.textContent = "STT (микрофон)";
    };
  }
  if (sttListening) {
    sttRecognition.stop();
    sttListening = false;
    sttBtn.textContent = "STT (микрофон)";
  } else {
    sttRecognition.start();
    sttListening = true;
    sttBtn.textContent = "Остановить STT";
  }
}

function getSpeechRecognitionCtor():
  | (new () => SpeechRecognitionLike)
  | null {
  const w = window as typeof window & {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function formatUnknownError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

function normalizeMessageText(message?: { text?: string; content?: unknown }): string {
  if (!message) return "";
  const chunks: string[] = [];
  if (typeof message.text === "string" && message.text.trim()) {
    chunks.push(message.text.trim());
  }
  if (typeof message.content === "string" && message.content.trim()) {
    chunks.push(message.content.trim());
  } else if (Array.isArray(message.content)) {
    for (const block of message.content) {
      if (!block || typeof block !== "object") continue;
      const entry = block as { type?: unknown; text?: unknown };
      if (entry.type === "text" && typeof entry.text === "string" && entry.text.trim()) {
        chunks.push(entry.text.trim());
      }
    }
  }

  const merged = chunks.join("\n\n");
  return sanitizeAssistantBoilerplate(merged);
}

function sanitizeAssistantBoilerplate(text: string): string {
  let out = text;
  if (out.includes("[Bootstrap pending]")) {
    out = out.replace(/\[Bootstrap pending\][\s\S]*?(?=\n{2,}|\z)/g, "").trim();
  }
  out = out.replace(/\[system-role\]/gi, "");
  out = out.replace(/^-media attached:.*$/gim, "");
  out = out
    .split("\n")
    .filter((line) => !/^\s*compaction\b/i.test(line.trim()))
    .join("\n");
  out = out.replace(/\n{3,}/g, "\n\n");
  return out;
}

function isNoiseMessage(text: string): boolean {
  const normalized = text.trim().toLowerCase();
  if (!normalized) return true;
  return (
    normalized.startsWith("compaction") ||
    normalized.startsWith("[system-role]") ||
    normalized.includes("ты планировщик учебного процесса") ||
    normalized.includes("system role: skillset planner") ||
    normalized.includes("pre-compaction memory flush") ||
    normalized.includes("hello! i'm skillset")
  );
}

function updateTypingBubble(targetText: string) {
  if (!chatEl) return;
  if (isNoiseMessage(targetText)) return;
  if (!typingBubbleEl) {
    typingBubbleEl = document.createElement("div");
    typingBubbleEl.className = "mb-2 whitespace-pre-wrap rounded-xl border border-sky-100 bg-white p-3 text-sm";
    chatEl.appendChild(typingBubbleEl);
    chatEl.scrollTop = chatEl.scrollHeight;
  }
  if (typingTimer !== null) {
    clearInterval(typingTimer);
    typingTimer = null;
  }
  if (!targetText) {
    typingRenderedText = "";
    typingBubbleEl.innerHTML = "";
    return;
  }
  const nextText = targetText;

  const startText = typingRenderedText && nextText.startsWith(typingRenderedText) ? typingRenderedText : "";
  let index = startText.length;
  typingRenderedText = startText;
  typingBubbleEl.textContent = startText;
  typingTimer = window.setInterval(() => {
    index += 1;
    const chunk = nextText.slice(0, index);
    typingRenderedText = chunk;
    if (typingBubbleEl) typingBubbleEl.innerHTML = renderMarkdown(chunk);
    if (chatEl) chatEl.scrollTop = chatEl.scrollHeight;
    if (index >= nextText.length && typingTimer !== null) {
      clearInterval(typingTimer);
      typingTimer = null;
    }
  }, 12);
}

function resetTypingBubble() {
  if (typingTimer !== null) {
    clearInterval(typingTimer);
    typingTimer = null;
  }
  typingRenderedText = "";
  if (typingBubbleEl) {
    typingBubbleEl.remove();
    typingBubbleEl = null;
  }
}

function confirmPlannerItem(text: string) {
  const normalized = text.trim();
  if (!normalized) return;
  const exists = plannerItems.some((item) => item.text === normalized);
  if (exists) return;
  plannerItems = [{ id: id(), text: normalized, createdAt: Date.now() }, ...plannerItems].slice(0, 30);
  savePlannerItems();
  if (activeTab === "chat") renderApp(true, loadDiaryRows());
}

function savePlannerItems() {
  localStorage.setItem(storage.plannerItems, JSON.stringify(plannerItems));
}

function loadPlannerItems(): PlannerItem[] {
  const raw = localStorage.getItem(storage.plannerItems);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as PlannerItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function startPendingHistoryRefresh() {
  stopPendingHistoryRefresh();
  let attempts = 0;
  pendingHistoryTimer = window.setInterval(() => {
    attempts += 1;
    void loadHistory();
    if (attempts >= 15) stopPendingHistoryRefresh();
  }, 1500);
}

function stopPendingHistoryRefresh() {
  if (pendingHistoryTimer !== null) {
    clearInterval(pendingHistoryTimer);
    pendingHistoryTimer = null;
  }
}

function buildOutgoingMessage(text: string, currentAttachment: ChatAttachment | null): string {
  if (text) return text;
  if (currentAttachment?.type === "audio") {
    return [
      "Обязательно выполни STT ВЛОЖЕННОГО аудиофайла и проанализируй именно его содержание.",
      "Не придумывай транскрипт. Если STT не удалось, напиши только: STT_ERROR.",
      "Верни строго в формате:",
      "Транскрипт: <краткая расшифровка 1-6 предложений>",
      "План: <3-6 шагов>",
      "Сделано: <что уже сделано>",
      "Дальше: <что делать дальше>",
      "Время: <оценка времени>",
      "Не решай задания за пользователя, только планируй выполнение.",
    ].join("\n");
  }
  if (currentAttachment?.type === "image") {
    return "Проанализируй вложение и предложи план действий без решения заданий за пользователя.";
  }
  return text;
}

async function ensurePlannerSystemRole(sessionKey: string) {
  const plannerRole = getPlannerRoleText();
  await request("chat.inject", {
    sessionKey,
    message: plannerRole,
    label: "system-role",
  });
  plannerRoleInjectedSessions.add(sessionKey);
}

function getPlannerRoleText(): string {
  return "Ты планировщик учебного процесса, ты не должен помогать решать задания. Ты должен только планировать выполнение этих заданий.";
}

function renderMarkdown(text: string): string {
  const safe = escapeHtml(text);
  const withHeadings = safe
    .replace(/^###\s+(.+)$/gm, "<h3 class=\"mt-2 font-semibold text-sky-900\">$1</h3>")
    .replace(/^##\s+(.+)$/gm, "<h2 class=\"mt-2 font-semibold text-sky-900\">$1</h2>")
    .replace(/^#\s+(.+)$/gm, "<h1 class=\"mt-2 font-bold text-sky-900\">$1</h1>");
  const withBold = withHeadings.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  const withItalic = withBold.replace(/\*(.+?)\*/g, "<em>$1</em>");
  const withCode = withItalic.replace(/`([^`]+)`/g, "<code class=\"rounded bg-sky-100 px-1\">$1</code>");
  const withLists = withCode.replace(/^\s*-\s+(.+)$/gm, "• $1");
  return withLists.replace(/\n/g, "<br/>");
}

function formatDateRange(start: string | null, end: string | null): string {
  const startText = formatDate(start);
  const endText = formatDate(end);
  if (startText && endText) return `${startText} - ${endText}`;
  if (startText) return startText;
  if (endText) return endText;
  return "не указаны";
}

function formatDate(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("ru-RU");
}

function formatAgeRange(minAge: number | null, maxAge: number | null): string {
  if (typeof minAge === "number" && typeof maxAge === "number") return `${minAge}-${maxAge} лет`;
  if (typeof minAge === "number") return `от ${minAge} лет`;
  if (typeof maxAge === "number") return `до ${maxAge} лет`;
  return "не указана";
}
