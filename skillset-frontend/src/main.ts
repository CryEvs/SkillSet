import "./styles.css";
import {
  buildDeviceAuthPayloadV3,
  loadOrCreateDeviceIdentity,
  signDevicePayload,
} from "./device-identity";

type GatewayReqFrame = { type: "req"; id: string; method: string; params?: unknown };
type ChatAttachment = {
  type: "audio" | "image" | "pdf";
  mimeType: string;
  content: string;
  fileName: string;
};
type PdfAttachment = { type: "pdf"; mimeType: string; content: string; fileName: string };
type UserRole = "student" | "parent" | "teacher";
type GradeRow = { subject: string; grade: string; comment: string };
type LessonPdf = { mimeType: string; content: string; fileName: string };
type LessonPdfRef = { mimeType: string; fileName: string; cacheKey: string };
type ScheduleLesson = {
  time: string;
  subject: string;
  homework: string;
  grade: string;
  score: number;
  textbook: LessonPdfRef | null;
};
type WeekdayKey = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";
type WeekSchedule = Record<WeekdayKey, ScheduleLesson[]>;
type EventProjectCard = {
  title: string;
  imageUrl: string | null;
  externalUrl: string | null;
  dateStart: string | null;
  dateEnd: string | null;
  minAge: number | null;
  maxAge: number | null;
};
type PlannerItem = {
  id: string;
  title: string;
  details: string;
  priority: number;
  createdAt: number;
};
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
  schedule: "skillset.schedule.rows",
  plannerItems: "skillset.planner.items",
};

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("Missing app root");
const appRoot = app;
const skillsetLogoUrl = new URL("skillset_logo.png", import.meta.url).href;

const inputClass =
  "w-full rounded-xl bg-white px-3 py-2 text-slate-700 outline-none transition focus:ring-2 focus:ring-[#570AA4]/20";
const buttonClass =
  "rounded-xl bg-white px-4 py-2 text-sm font-semibold text-[#570AA4] transition hover:opacity-90";
const weekDays: Array<{ key: WeekdayKey; label: string }> = [
  { key: "monday", label: "Понедельник" },
  { key: "tuesday", label: "Вторник" },
  { key: "wednesday", label: "Среда" },
  { key: "thursday", label: "Четверг" },
  { key: "friday", label: "Пятница" },
  { key: "saturday", label: "Суббота" },
  { key: "sunday", label: "Воскресенье" },
];

let ws: WebSocket | null = null;
let pending = new Map<string, (payload: unknown) => void>();
let pendingErr = new Map<string, (error: unknown) => void>();
let attachment: ChatAttachment | null = null;
let autoPlannerAttachments: ChatAttachment[] = [];
const lessonPdfCache = new Map<string, LessonPdf>();
const lessonPdfDbName = "skillset-lesson-pdf";
const lessonPdfStoreName = "pdfs";
const maxPdfBytesForWs = 700 * 1024;
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
let sttRetriedAfterNetwork = false;
let syncListenersBound = false;
let reconnectTimer: number | null = null;
let connectAttempt = 0;
let connectInFlight = false;
let activeSocketId = 0;
let stickChatToBottom = true;

const initialDiary = loadDiaryRows();
renderApp(Boolean(localStorage.getItem(storage.authToken)), initialDiary);
bindCrossTabScheduleSync();

function renderApp(isLoggedIn: boolean, rows: GradeRow[]) {
  appRoot.innerHTML = isLoggedIn ? dashboardMarkup(rows) : loginMarkup();
  if (isLoggedIn) {
    bindDashboard();
  } else {
    bindLogin();
  }
}

function bindCrossTabScheduleSync() {
  if (syncListenersBound) return;
  syncListenersBound = true;

  window.addEventListener("storage", (event) => {
    if (event.key !== storage.schedule) return;
    if (!localStorage.getItem(storage.authToken)) return;
    renderApp(true, loadDiaryRows());
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") return;
    if (!localStorage.getItem(storage.authToken)) return;
    renderApp(true, loadDiaryRows());
  });

  window.addEventListener("focus", () => {
    if (!localStorage.getItem(storage.authToken)) return;
    renderApp(true, loadDiaryRows());
  });
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
    <section class="min-h-screen bg-[#F5F5F5]">
      <header class="h-[70px] pl-[80px] pb-[10px] pt-[10px] pr-[80px] w-full bg-[#570AA4] px-4">
        <div class="mx-auto flex h-full max-w-[1400px] items-center justify-between">
          <img src="${skillsetLogoUrl}" alt="SkillSet" class="h-[38px] object-contain" />
          <div class="flex items-center gap-3">
            <button id="settingsTopBtn" class="grid h-[38px] w-[38px] place-items-center rounded-2xl bg-white text-[#570AA4] transition hover:opacity-90" title="Настройки">
              <svg viewBox="0 0 24 24" aria-hidden="true" class="h-5 w-5 fill-current">
                <path d="M19.14 12.94a7.89 7.89 0 0 0 .05-.94c0-.32-.02-.63-.05-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.28 7.28 0 0 0-1.63-.94l-.36-2.54a.5.5 0 0 0-.5-.42h-3.84a.5.5 0 0 0-.5.42l-.36 2.54c-.58.23-1.12.54-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.71 8.84a.5.5 0 0 0 .12.64l2.03 1.58c-.03.31-.05.62-.05.94s.02.63.05.94l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32a.5.5 0 0 0 .6.22l2.39-.96c.5.39 1.05.71 1.63.94l.36 2.54a.5.5 0 0 0 .5.42h3.84a.5.5 0 0 0 .5-.42l.36-2.54c.58-.23 1.12-.54 1.63-.94l2.39.96a.5.5 0 0 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58ZM12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7Z"/>
              </svg>
            </button>
            <button id="profileTopBtn" class="grid h-[38px] w-[38px] place-items-center rounded-2xl bg-white text-[#570AA4] transition hover:opacity-90" title="Профиль">
              <svg viewBox="0 0 24 24" aria-hidden="true" class="h-5 w-5 fill-current">
                <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5Z"/>
              </svg>
            </button>
          </div>
        </div>
      </header>
      <div class="mx-auto grid max-w-[1400px] md:grid-cols-[240px_1fr]">
      <aside class="bg-[#F5F5F5] p-4">
        <div class="grid gap-2 md:content-start">
          <button class="nav-btn rounded-xl px-3 py-2 text-left text-sm font-semibold transition-all duration-200 ${activeTab === "diary" ? "bg-[#570AA4] text-white shadow-sm" : "bg-transparent text-[#570AA4] hover:bg-[#570AA4]/10 hover:text-[#4a078f] hover:shadow-sm"}" data-tab="diary">Дневник</button>
          <button class="nav-btn rounded-xl px-3 py-2 text-left text-sm font-semibold transition-all duration-200 ${activeTab === "chat" ? "bg-[#570AA4] text-white shadow-sm" : "bg-transparent text-[#570AA4] hover:bg-[#570AA4]/10 hover:text-[#4a078f] hover:shadow-sm"}" data-tab="chat">Планировщик</button>
          <button class="nav-btn rounded-xl px-3 py-2 text-left text-sm font-semibold transition-all duration-200 ${activeTab === "events" ? "bg-[#570AA4] text-white shadow-sm" : "bg-transparent text-[#570AA4] hover:bg-[#570AA4]/10 hover:text-[#4a078f] hover:shadow-sm"}" data-tab="events">События</button>
          <button class="nav-btn rounded-xl px-3 py-2 text-left text-sm font-semibold transition-all duration-200 ${activeTab === "plans" ? "bg-[#570AA4] text-white shadow-sm" : "bg-transparent text-[#570AA4] hover:bg-[#570AA4]/10 hover:text-[#4a078f] hover:shadow-sm"}" data-tab="plans">Задания</button>
        </div>
      </aside>
      <main class="grid gap-3 p-4 bg-[#F5F5F5]">
        <section id="profilePanel" class="rounded-2xl bg-white p-4 shadow-sm ${activeTab === "profile" ? "" : "hidden"}">
          ${profileMarkup(userName, userRole)}
        </section>
        <section id="diaryPanel" class="rounded-2xl bg-white p-4 shadow-sm ${activeTab === "diary" ? "" : "hidden"}">
          ${diaryMarkup(rows, userRole, loadScheduleRows())}
        </section>
        <section id="chatPanel" class="rounded-2xl bg-white p-4 shadow-sm ${activeTab === "chat" ? "flex h-[calc(100vh-130px)] min-h-0 flex-col" : "hidden"}">
          ${chatMarkup()}
        </section>
        <section id="eventsPanel" class="rounded-2xl bg-white p-4 shadow-sm ${activeTab === "events" ? "" : "hidden"}">
          ${eventsMarkup()}
        </section>
        <section id="plansPanel" class="rounded-2xl bg-white p-4 shadow-sm ${activeTab === "plans" ? "" : "hidden"}">
          ${plansMarkup()}
        </section>
      </main>
      </div>
    </section>
  `;
}

function profileMarkup(userName: string, userRole: UserRole) {
  return `
    <div class="text-xl font-bold text-sky-900">Профиль</div>
    <div><strong>Пользователь:</strong> ${escapeHtml(userName)}</div>
    <div><strong>Роль:</strong> ${roleLabel(userRole)}</div>
    <button id="logoutBtn" class="mt-3 rounded-xl bg-[#570AA4] px-3 py-2 text-sm font-semibold text-white transition hover:opacity-90">Выйти</button>
  `;
}

function chatMarkup() {
  return `
    <div class="flex h-full min-h-0 flex-col gap-2">
      <div class="grid gap-2">
      <div class="text-xl font-bold text-sky-900">Планировщик</div>
      <div id="connectionState" class="text-sm text-sky-700">Подключение...</div>
      </div>
    <div id="chat" class="min-h-0 flex-1 overflow-auto rounded-xl bg-white p-3"></div>
    <div class="grid gap-2">
      <input id="fileInput" type="file" accept="audio/*,image/*,application/pdf,.pdf" class="hidden" />
      <div class="relative">
        <textarea class="${inputClass} min-h-[96px] resize-none pr-28" id="messageInput" placeholder="Введите сообщение"></textarea>
        <div class="absolute bottom-2 right-2 flex items-center gap-1">
          <button class="grid h-9 w-9 place-items-center rounded-full bg-white text-[#570AA4] transition-colors duration-200 hover:bg-[#F5F5F5]" id="attachBtn" title="Прикрепить файл" type="button">
            <svg viewBox="0 0 24 24" class="h-5 w-5 fill-current" aria-hidden="true"><path d="M16.5 6.5v8.75a4.25 4.25 0 1 1-8.5 0V5.75a2.75 2.75 0 1 1 5.5 0v8.5a1.25 1.25 0 1 1-2.5 0V7h-1.5v7.25a2.75 2.75 0 0 0 5.5 0v-8.5a4.25 4.25 0 1 0-8.5 0v9.5a5.75 5.75 0 1 0 11.5 0V6.5z"/></svg>
          </button>
          <button class="grid h-9 w-9 place-items-center rounded-full bg-white text-[#570AA4] transition-colors duration-200 hover:bg-[#F5F5F5]" id="micBtn" title="STT микрофон" type="button">
            <svg viewBox="0 0 24 24" class="h-5 w-5 fill-current" aria-hidden="true"><path d="M12 15a4 4 0 0 0 4-4V6a4 4 0 1 0-8 0v5a4 4 0 0 0 4 4Zm-1 3.93V22h2v-3.07A7 7 0 0 0 19 12h-2a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.93Z"/></svg>
          </button>
          <button class="grid h-9 w-9 place-items-center rounded-full bg-white text-[#570AA4] transition-colors duration-200 hover:bg-[#F5F5F5]" id="sendBtn" title="Отправить" type="button">
            <svg viewBox="0 0 24 24" class="h-5 w-5 fill-current" aria-hidden="true"><path d="M3.4 20.4 21.85 12 3.4 3.6 3.33 10l13.2 2-13.2 2z"/></svg>
          </button>
        </div>
      </div>
      <span id="fileState" class="text-sm text-[#570AA4]"></span>
    </div>
    </div>
  `;
}

function plansMarkup() {
  const items = plannerItems
    .map(
      (item) => `
      <div class="rounded-xl border border-sky-100 bg-white p-3 shadow-sm">
        <div class="text-xs text-sky-600">${new Date(item.createdAt).toLocaleString("ru-RU")}</div>
        <div class="mt-1 text-sm font-semibold text-slate-900">${escapeHtml(item.title)}</div>
        <div class="mt-1 text-xs text-[#570AA4]">Приоритет: ${item.priority}/10</div>
        <div class="mt-1 whitespace-pre-wrap text-sm text-slate-700">${escapeHtml(item.details)}</div>
        <button class="delete-task-btn mt-2 rounded-lg border border-rose-200 px-2 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-50" data-task-id="${escapeHtml(item.id)}">Удалить</button>
      </div>
    `,
    )
    .join("");
  return `
    <aside class="max-h-[600px] overflow-auto rounded-xl bg-white p-3">
      <div class="mb-2 flex items-center justify-between gap-2">
        <div class="text-sm font-semibold text-sky-900">Задания из ответов планировщика</div>
        <button class="${buttonClass} px-2 py-1 text-xs" id="clearPlannerBtn">Очистить</button>
      </div>
      <div class="grid gap-2">
        ${items || `<div class="text-sm text-sky-700">Пока нет разобранных заданий.</div>`}
      </div>
    </aside>
  `;
}

function diaryMarkup(_rows: GradeRow[], role: UserRole, schedule: WeekSchedule) {
  const scheduleHtml = weekDays
    .map(({ key, label }) => {
      const lessons = schedule[key];
      const lessonsHtml = lessons
        .map(
          (lesson, lessonIndex) => `
            <tr>
              <td class="border-b border-sky-100 p-2"><input class="${inputClass}" data-kind="schedule-time" data-day="${key}" data-lesson-index="${lessonIndex}" value="${escapeHtml(lesson.time)}" ${role !== "teacher" ? "disabled" : ""}></td>
              <td class="border-b border-sky-100 p-2"><input class="${inputClass}" data-kind="schedule-subject" data-day="${key}" data-lesson-index="${lessonIndex}" value="${escapeHtml(lesson.subject)}" ${role !== "teacher" ? "disabled" : ""}></td>
              <td class="border-b border-sky-100 p-2"><input class="${inputClass}" data-kind="schedule-homework" data-day="${key}" data-lesson-index="${lessonIndex}" value="${escapeHtml(lesson.homework)}" ${role !== "teacher" ? "disabled" : ""}></td>
              <td class="border-b border-sky-100 p-2"><input class="${inputClass}" data-kind="schedule-score" data-day="${key}" data-lesson-index="${lessonIndex}" value="${String(lesson.score)}" min="1" max="10" type="number" ${role !== "teacher" ? "disabled" : ""}></td>
              <td class="border-b border-sky-100 p-2"><input class="${inputClass}" data-kind="schedule-grade" data-day="${key}" data-lesson-index="${lessonIndex}" value="${escapeHtml(lesson.grade)}" ${role !== "teacher" ? "disabled" : ""}></td>
              <td class="border-b border-sky-100 p-2">
                <div class="flex flex-wrap items-center gap-2">
                  ${
                    role === "teacher"
                      ? `<button class="lesson-pdf-btn rounded-lg border border-sky-200 px-2 py-1 text-xs font-semibold text-[#570AA4] transition hover:bg-sky-50" type="button" data-day="${key}" data-lesson-index="${lessonIndex}">Учебник PDF</button>
                         <input class="lesson-pdf-input hidden" type="file" accept="application/pdf,.pdf" data-day="${key}" data-lesson-index="${lessonIndex}">`
                      : ""
                  }
                  ${
                    lesson.textbook
                      ? `<span class="text-xs text-sky-700">${escapeHtml(lesson.textbook.fileName)}</span>`
                      : `<span class="text-xs text-slate-500">не прикреплен</span>`
                  }
                </div>
              </td>
            </tr>
          `,
        )
        .join("");
      const hasHomework = lessons.some((lesson) => lesson.homework.trim());
      return `
        <section class="rounded-xl border border-sky-100 p-3">
          <div class="mb-2 flex items-center justify-between gap-2">
            <div class="text-sm font-semibold text-[#570AA4]">${label}</div>
            <div class="flex flex-wrap gap-2">
              ${
                role === "teacher"
                  ? `<button class="${buttonClass} add-schedule-lesson-btn px-2 py-1 text-xs" data-day="${key}">Добавить урок</button>`
                  : ""
              }
              ${
                role === "student" && hasHomework
                  ? `<button class="to-planner-day-btn rounded-xl bg-[#570AA4] px-2 py-1 text-xs font-semibold text-white transition hover:opacity-90" data-day="${key}">Отправить ДЗ за день в планировщик</button>`
                  : ""
              }
            </div>
          </div>
          <div class="overflow-auto rounded-xl bg-white">
            <table class="w-full border-collapse bg-white text-sm">
              <thead class="bg-white text-[#570AA4]">
                <tr><th class="p-2 text-left">Время</th><th class="p-2 text-left">Предмет</th><th class="p-2 text-left">Домашнее задание</th><th class="p-2 text-left">Вес (1-10)</th><th class="p-2 text-left">Оценка</th><th class="p-2 text-left">Учебник</th></tr>
              </thead>
              <tbody>
                ${
                  lessonsHtml ||
                  `<tr><td class="p-2 text-sky-700" colspan="6">Уроков на этот день пока нет.</td></tr>`
                }
              </tbody>
            </table>
          </div>
        </section>
      `;
    })
    .join("");
  return `
    <div class="text-xl font-bold text-sky-900">Дневник</div>
    <p class="text-sm text-sky-700">Оценки выставляются за конкретный урок прямо в расписании.</p>
    <div class="mt-4 text-xl font-bold text-sky-900">Расписание и домашние задания</div>
    <p class="text-sm text-sky-700">Расписание построено по дням недели. Ученик отправляет в планировщик сразу весь объем ДЗ за выбранный день.</p>
    <div class="grid gap-3">${scheduleHtml}</div>
    <div class="mt-2 flex flex-wrap gap-2">
      ${role === "teacher" ? `<button class="${buttonClass}" id="saveScheduleBtn">Сохранить расписание</button>` : ""}
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

function addMessage(
  role: "user" | "assistant" | "system",
  text: string,
  options?: { fromHistory?: boolean },
) {
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
    if (!options?.fromHistory) {
      parseAndStoreTasksFromAssistant(text);
    }
    const btn = document.createElement("button");
    btn.className = `${buttonClass} mt-2 px-2 py-1 text-xs`;
    btn.textContent = "Добавить в задания";
    btn.onclick = () => {
      confirmPlannerItem(text);
    };
    div.appendChild(btn);
  }
  chatEl.appendChild(div);
  scrollChatToBottomIfNeeded();
}

function isChatNearBottom(): boolean {
  if (!chatEl) return true;
  const distance = chatEl.scrollHeight - chatEl.scrollTop - chatEl.clientHeight;
  return distance < 96;
}

function scrollChatToBottomIfNeeded(force = false) {
  if (!chatEl) return;
  if (force || stickChatToBottom || isChatNearBottom()) {
    chatEl.scrollTop = chatEl.scrollHeight;
  }
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
  const preserveDistance = chatEl.scrollHeight - chatEl.scrollTop;
  const shouldPreserve = !stickChatToBottom && chatEl.scrollHeight > 0;
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
    addMessage(role, content, { fromHistory: true });
  }
  if (shouldPreserve) {
    chatEl.scrollTop = Math.max(0, chatEl.scrollHeight - preserveDistance);
  } else {
    scrollChatToBottomIfNeeded(true);
  }
  bindPlannerEvents();
}

async function connectChat() {
  if (connectInFlight) return;
  connectInFlight = true;
  const connectionStateEl = document.querySelector<HTMLDivElement>("#connectionState");
  const gatewayUrl = localStorage.getItem(storage.gatewayUrl) ?? "ws://127.0.0.1:18789";
  const gatewayToken = localStorage.getItem(storage.gatewayToken) ?? "";
  const sessionKey = localStorage.getItem(storage.sessionKey) ?? "main";
  if (!gatewayUrl) {
    connectInFlight = false;
    return;
  }
  localStorage.setItem(storage.gatewayUrl, gatewayUrl);
  localStorage.setItem(storage.gatewayToken, gatewayToken);
  localStorage.setItem(storage.sessionKey, sessionKey);
  if (reconnectTimer !== null) {
    window.clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  ws?.close();
  if (connectionStateEl) connectionStateEl.textContent = "Подключение к gateway...";
  const socketId = ++activeSocketId;
  ws = new WebSocket(gatewayUrl);
  const socket = ws;
  let handshakeDone = false;
  const handshakeTimeout = window.setTimeout(() => {
    if (handshakeDone) return;
    try {
      socket.close();
    } catch {
      // noop
    }
    if (connectionStateEl && socketId === activeSocketId) {
      connectionStateEl.textContent = "Таймаут подключения, повторяем...";
    }
  }, 12000);
  ws.onopen = async () => {
    if (socketId !== activeSocketId) return;
    if (connectionStateEl) connectionStateEl.textContent = "Открыт сокет, ждем challenge...";
  };
  ws.onmessage = async (event) => {
    if (socketId !== activeSocketId) return;
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
        handshakeDone = true;
        window.clearTimeout(handshakeTimeout);
        connectAttempt = 0;
        connectInFlight = false;
        if (connectionStateEl) connectionStateEl.textContent = "Подключено";
        await loadHistory();
      } catch (error) {
        connectInFlight = false;
        if (connectionStateEl) connectionStateEl.textContent = "Ошибка авторизации";
        scheduleReconnect(connectionStateEl, gatewayUrl);
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
    if (socketId !== activeSocketId) return;
    if (connectionStateEl) connectionStateEl.textContent = "Ошибка WebSocket";
  };
  ws.onclose = () => {
    if (socketId !== activeSocketId) return;
    window.clearTimeout(handshakeTimeout);
    connectInFlight = false;
    if (connectionStateEl) connectionStateEl.textContent = "Отключено";
    for (const [, reject] of pendingErr) {
      reject(new Error("Connection closed"));
    }
    pending.clear();
    pendingErr.clear();
    scheduleReconnect(connectionStateEl, gatewayUrl);
  };
}

function scheduleReconnect(connectionStateEl: HTMLDivElement | null, gatewayUrl: string) {
  if (reconnectTimer !== null) return;
  const delay = Math.min(10000, 1000 * 2 ** Math.min(connectAttempt, 3));
  connectAttempt += 1;
  if (connectionStateEl) {
    connectionStateEl.textContent = `Переподключение через ${Math.round(delay / 1000)}с...`;
  }
  reconnectTimer = window.setTimeout(() => {
    reconnectTimer = null;
    if (activeTab !== "chat") return;
    if (!gatewayUrl) return;
    void connectChat();
  }, delay);
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
  chatEl.addEventListener("scroll", () => {
    stickChatToBottom = isChatNearBottom();
  });
  const connectionStateEl = document.querySelector<HTMLDivElement>("#connectionState");
  const sendBtn = document.querySelector<HTMLButtonElement>("#sendBtn");
  const micBtn = document.querySelector<HTMLButtonElement>("#micBtn");
  const attachBtn = document.querySelector<HTMLButtonElement>("#attachBtn");
  const messageInput = document.querySelector<HTMLTextAreaElement>("#messageInput");
  const fileInput = document.querySelector<HTMLInputElement>("#fileInput");
  const fileState = document.querySelector<HTMLSpanElement>("#fileState");
  if (!sendBtn || !micBtn || !attachBtn || !messageInput || !fileInput || !fileState) {
    return;
  }
  if (autoPlannerAttachments.length > 0) {
    fileState.textContent = `Авто-вложения из уроков: ${autoPlannerAttachments.length} PDF`;
  }
  if (ws && ws.readyState === WebSocket.OPEN && !connectInFlight) {
    if (connectionStateEl) connectionStateEl.textContent = "Подключено";
    void loadHistory();
  } else {
    if (connectionStateEl) {
      connectionStateEl.textContent = connectInFlight
        ? "Подключение..."
        : "Нет активного соединения, подключаемся...";
    }
    void connectChat();
  }
  bindPlannerEvents();

  attachBtn.onclick = () => fileInput.click();
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

  micBtn.onclick = () => {
    toggleStt(messageInput, micBtn);
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
  const lowerName = file.name.toLowerCase();
  const isPdf = file.type === "application/pdf" || lowerName.endsWith(".pdf");
  if (isPdf && file.size > maxPdfBytesForWs) {
    attachment = null;
    fileInput.value = "";
    fileState.textContent = "";
    addMessage(
      "system",
      `PDF слишком большой для текущего канала (${Math.round(file.size / 1024)} KB). Лимит: ${Math.round(
        maxPdfBytesForWs / 1024,
      )} KB. Сожмите PDF или отправьте текст задания.`,
    );
    return;
  }
  reader.onload = () => {
    const dataUrl = String(reader.result ?? "");
    const b64 = dataUrl.split(",")[1] ?? "";
    const kind = isPdf ? "pdf" : file.type.startsWith("audio/") ? "audio" : "image";
    attachment = {
      type: kind,
      mimeType: file.type || (kind === "audio" ? "audio/mpeg" : kind === "pdf" ? "application/pdf" : "image/png"),
      content: b64,
      fileName: file.name,
    };
    const suffix = kind === "pdf" ? " • PDF" : "";
    fileState.textContent = `${file.name} (${Math.round(file.size / 1024)} KB)${suffix}`;
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
  if (!text && !attachment && autoPlannerAttachments.length === 0) return;
  try {
    const mergedAttachments = [...autoPlannerAttachments, ...(attachment ? [attachment] : [])];
    const messageToSend = buildOutgoingMessageWithAttachments(text, attachment, mergedAttachments);
    if (text) addMessage("user", text);
    if (!text && attachment?.type === "audio") {
      addMessage("user", "Аудио отправлено на STT и AI-анализ.");
    }
    if (mergedAttachments.some((item) => item.type === "pdf")) {
      const pdfNames = mergedAttachments
        .filter((item): item is PdfAttachment => item.type === "pdf")
        .map((item) => item.fileName)
        .join(", ");
      addMessage("user", `PDF отправлен в планировщик: ${pdfNames}`);
    }
    resetTypingBubble();
    await ensurePlannerSystemRole(sessionKey);
    try {
      await withTimeout(
        request("chat.send", {
          sessionKey,
          message: messageToSend,
          idempotencyKey: id(),
          deliver: false,
          attachments: mergedAttachments.length > 0 ? mergedAttachments : undefined,
        }),
        30000,
        "Планировщик долго не отвечает. Проверьте gateway и подключение.",
      );
    } catch (primaryError) {
      // Fallback: if gateway rejects attachments (often PDF), retry without attachments
      if (mergedAttachments.length > 0 && isAttachmentTransportError(primaryError)) {
        addMessage(
          "system",
          "Gateway отклонил вложение (часто это PDF). Отправляю запрос без вложения, чтобы планировщик ответил.",
        );
        await ensureSocketReady(8000);
        const fallbackMessage = `${text || "Составь план выполнения домашнего задания."}\n\nPDF не удалось передать как вложение. Учитывай только текст задания из сообщения.`;
        await withTimeout(
          request("chat.send", {
            sessionKey,
            message: fallbackMessage,
            idempotencyKey: id(),
            deliver: false,
          }),
          30000,
          "Планировщик долго не отвечает. Проверьте gateway и подключение.",
        );
      } else if (mergedAttachments.length > 0 && isConnectionDropError(primaryError)) {
        addMessage(
          "system",
          "Соединение разорвалось при отправке вложения. Переподключаюсь и повторяю отправку без PDF.",
        );
        await ensureSocketReady(10000);
        const fallbackMessage = `${text || "Составь план выполнения домашнего задания."}\n\nВложение не доставлено из-за ограничения канала. Построй план по тексту задания.`;
        await withTimeout(
          request("chat.send", {
            sessionKey,
            message: fallbackMessage,
            idempotencyKey: id(),
            deliver: false,
          }),
          30000,
          "Планировщик долго не отвечает. Проверьте gateway и подключение.",
        );
      } else {
        throw primaryError;
      }
    }
    messageInput.value = "";
    fileInput.value = "";
    attachment = null;
    autoPlannerAttachments = [];
    fileState.textContent = "";
    startPendingHistoryRefresh();
  } catch (error) {
    const errorText = formatUnknownError(error);
    console.error("Send error:", errorText);
    if (/payload|size|too large|limit|attachment|mime|pdf|unsupported/i.test(errorText)) {
      addMessage(
        "system",
        `Ошибка отправки PDF: ${errorText}. Попробуйте файл меньшего размера или отправьте текст задания без вложения.`,
      );
    } else {
      addMessage("system", `Ошибка отправки в планировщик: ${errorText}`);
    }
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
  const profileTopBtn = document.querySelector<HTMLButtonElement>("#profileTopBtn");
  const settingsTopBtn = document.querySelector<HTMLButtonElement>("#settingsTopBtn");
  const userRole = (localStorage.getItem(storage.userRole) as UserRole | null) ?? "student";
  navBtns.forEach((btn) => {
    btn.onclick = () => {
      activeTab = (btn.dataset.tab as "profile" | "diary" | "chat" | "events" | "plans") ?? "diary";
      renderApp(true, loadDiaryRows());
    };
  });
  profileTopBtn?.addEventListener("click", () => {
    activeTab = "profile";
    renderApp(true, loadDiaryRows());
  });
  settingsTopBtn?.addEventListener("click", () => {
    activeTab = "profile";
    renderApp(true, loadDiaryRows());
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
  const deleteButtons = Array.from(document.querySelectorAll<HTMLButtonElement>(".delete-task-btn"));
  clearBtn?.addEventListener("click", () => {
    plannerItems = [];
    savePlannerItems();
    renderApp(true, loadDiaryRows());
  });
  deleteButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const taskId = btn.dataset.taskId ?? "";
      if (!taskId) return;
      plannerItems = plannerItems.filter((item) => item.id !== taskId);
      savePlannerItems();
      renderApp(true, loadDiaryRows());
    });
  });
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
        "query projectSortList($isArchive: Boolean!, $order: [OrderInputObject], $pagination: PaginationFilter = {limit: 100}, $type: ProjectSortPageType!, $directions: [Direction], $ages: [String], $tags: [Uuid], $regionID: Uuid, $search: String) { projectSortList( isArchive: $isArchive order: $order pagination: $pagination type: $type directions: $directions ages: $ages tags: $tags regionID: $regionID search: $search ) { totalCount nodes { project { ...MainProjectItem __typename } superProject { ...MainSuperProjectItem __typename } projectType __typename } __typename } } fragment MainProjectItem on ProjectObject { ID publicID title photoUrl dateStart dateEnd registrationStart registrationEnd minAge maxAge territoryLevel activitiesCount externalUrl displayedTerritoryLevel status tags { ID name __typename } direction __typename } fragment MainSuperProjectItem on SuperProjectObject { ID name minAge maxAge beginsAt endsAt publicID imageUrl territoryLevel externalUrl status activeProjectsCount tags { ID name __typename } userRoles { ID name description __typename } __typename }",
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
  const toPlannerDayButtons = Array.from(
    document.querySelectorAll<HTMLButtonElement>(".to-planner-day-btn"),
  );
  toPlannerDayButtons.forEach((btn) => {
    btn.addEventListener("click", async () => {
      const day = (btn.dataset.day as WeekdayKey | undefined) ?? "monday";
      const schedule = loadScheduleRows();
      const lessons = schedule[day] ?? [];
      const prioritizedLessons = lessons
        .filter((lesson) => lesson.homework.trim())
        .sort((a, b) => b.score - a.score);
      const homeworkLines = prioritizedLessons
        .map((lesson) => `- [${lesson.score}/10] ${lesson.subject} (${lesson.time}): ${lesson.homework}`)
        .join("\n");
      if (!homeworkLines) return;
      const dayPdfAttachments: PdfAttachment[] = [];
      for (const lesson of prioritizedLessons) {
        const ref = lesson.textbook;
        if (!ref) continue;
        const data = await getLessonPdfFromCacheOrDb(ref);
        if (!data) continue;
        dayPdfAttachments.push({
          type: "pdf",
          mimeType: data.mimeType,
          content: data.content,
          fileName: data.fileName,
        });
      }
      autoPlannerAttachments = dedupeAttachmentsByNameAndSize(
        dayPdfAttachments.filter((pdf) => {
          const approxBytes = Math.ceil((pdf.content.length * 3) / 4);
          return approxBytes <= maxPdfBytesForWs;
        }),
      );
      const droppedCount = dayPdfAttachments.length - autoPlannerAttachments.length;
      if (droppedCount > 0) {
        addMessage(
          "system",
          `Часть PDF не приложена автоматически (${droppedCount}) из-за лимита размера WebSocket.`,
        );
      }
      const dayLabel = weekDays.find((item) => item.key === day)?.label ?? day;
      openPlannerWithDraft(
        `Составь план выполнения домашнего задания на ${dayLabel}. Сначала выполняй задачи с более высокими баллами приоритета.\nВот все задания за день (уже отсортированы по баллам):\n${homeworkLines}\n${
          autoPlannerAttachments.length > 0
            ? `\nИспользуй также приложенные PDF учебники (${autoPlannerAttachments.map((a) => a.fileName).join(", ")}) для оценки сложности заданий.`
            : ""
        }`,
      );
      if (prioritizedLessons.some((lesson) => lesson.textbook) && autoPlannerAttachments.length === 0) {
        addMessage(
          "system",
          "PDF учебник не удалось прикрепить автоматически. Прикрепите файл вручную через скрепку.",
        );
      }
    });
  });

  if (role !== "teacher") return;
  const addScheduleLessonButtons = Array.from(
    document.querySelectorAll<HTMLButtonElement>(".add-schedule-lesson-btn"),
  );
  const lessonPdfButtons = Array.from(document.querySelectorAll<HTMLButtonElement>(".lesson-pdf-btn"));
  const lessonPdfInputs = Array.from(document.querySelectorAll<HTMLInputElement>(".lesson-pdf-input"));
  const saveScheduleBtn = document.querySelector<HTMLButtonElement>("#saveScheduleBtn");
  addScheduleLessonButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const day = (btn.dataset.day as WeekdayKey | undefined) ?? "monday";
      const schedule = collectScheduleRowsFromInputs();
      schedule[day].push({
        time: "09:00",
        subject: "Новый предмет",
        homework: "",
        grade: "",
        score: 5,
        textbook: null,
      });
      saveScheduleRows(schedule);
      renderApp(true, loadDiaryRows());
    });
  });
  lessonPdfButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const day = btn.dataset.day ?? "";
      const lessonIndex = btn.dataset.lessonIndex ?? "";
      const input = document.querySelector<HTMLInputElement>(
        `.lesson-pdf-input[data-day="${day}"][data-lesson-index="${lessonIndex}"]`,
      );
      input?.click();
    });
  });
  lessonPdfInputs.forEach((input) => {
    input.addEventListener("change", () => {
      const file = input.files?.[0];
      if (!file) return;
      const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      if (!isPdf) return;
      const day = input.dataset.day as WeekdayKey | undefined;
      const lessonIndex = Number(input.dataset.lessonIndex ?? "-1");
      if (!day || Number.isNaN(lessonIndex) || lessonIndex < 0) return;
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = String(reader.result ?? "");
        const b64 = dataUrl.split(",")[1] ?? "";
        const schedule = collectScheduleRowsFromInputs();
        const lesson = schedule[day][lessonIndex];
        if (!lesson) return;
        const cacheKey = `${day}:${lessonIndex}:${Date.now()}`;
        const pdfPayload = {
          mimeType: file.type || "application/pdf",
          content: b64,
          fileName: file.name,
        };
        lessonPdfCache.set(cacheKey, pdfPayload);
        void putLessonPdfToDb(cacheKey, pdfPayload);
        lesson.textbook = {
          mimeType: file.type || "application/pdf",
          fileName: file.name,
          cacheKey,
        };
        saveScheduleRows(schedule);
        renderApp(true, loadDiaryRows());
      };
      reader.readAsDataURL(file);
    });
  });
  saveScheduleBtn?.addEventListener("click", () => {
    const schedule = collectScheduleRowsFromInputs();
    saveScheduleRows(schedule);
    renderApp(true, loadDiaryRows());
  });
  bindTeacherScheduleAutosave();
}

function openPlannerWithDraft(text: string) {
  activeTab = "chat";
  renderApp(true, loadDiaryRows());
  const messageInput = document.querySelector<HTMLTextAreaElement>("#messageInput");
  if (!messageInput) return;
  messageInput.value = text;
  messageInput.focus();
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

function collectScheduleRowsFromInputs(): WeekSchedule {
  const existing = loadScheduleRows();
  const rows = createEmptyWeekSchedule();
  const timeInputs = Array.from(
    document.querySelectorAll<HTMLInputElement>('input[data-kind="schedule-time"]'),
  );
  timeInputs.forEach((timeInput) => {
    const day = timeInput.dataset.day as WeekdayKey | undefined;
    const lessonIndex = Number(timeInput.dataset.lessonIndex ?? "-1");
    if (!day || Number.isNaN(lessonIndex) || lessonIndex < 0) return;
    const subjectInput = document.querySelector<HTMLInputElement>(
      `input[data-kind="schedule-subject"][data-day="${day}"][data-lesson-index="${lessonIndex}"]`,
    );
    const homeworkInput = document.querySelector<HTMLInputElement>(
      `input[data-kind="schedule-homework"][data-day="${day}"][data-lesson-index="${lessonIndex}"]`,
    );
    const scoreInput = document.querySelector<HTMLInputElement>(
      `input[data-kind="schedule-score"][data-day="${day}"][data-lesson-index="${lessonIndex}"]`,
    );
    const gradeInput = document.querySelector<HTMLInputElement>(
      `input[data-kind="schedule-grade"][data-day="${day}"][data-lesson-index="${lessonIndex}"]`,
    );
    const scoreRaw = Number(scoreInput?.value ?? "5");
    const score = Math.min(10, Math.max(1, Number.isFinite(scoreRaw) ? Math.round(scoreRaw) : 5));
    rows[day].push({
      time: timeInput.value.trim(),
      subject: subjectInput?.value.trim() ?? "",
      homework: homeworkInput?.value.trim() ?? "",
      grade: gradeInput?.value.trim() ?? "",
      score,
      textbook: existing[day]?.[lessonIndex]?.textbook ?? null,
    });
  });
  return rows;
}

function bindTeacherScheduleAutosave() {
  const watchedInputs = Array.from(
    document.querySelectorAll<HTMLInputElement>(
      'input[data-kind="schedule-time"], input[data-kind="schedule-subject"], input[data-kind="schedule-homework"], input[data-kind="schedule-score"], input[data-kind="schedule-grade"]',
    ),
  );
  let timer: number | null = null;
  const persist = () => {
    const schedule = collectScheduleRowsFromInputs();
    saveScheduleRows(schedule);
  };
  watchedInputs.forEach((input) => {
    input.addEventListener("input", () => {
      if (timer !== null) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        persist();
        timer = null;
      }, 300);
    });
    input.addEventListener("blur", persist);
    input.addEventListener("change", persist);
  });
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

function loadScheduleRows(): WeekSchedule {
  const raw = localStorage.getItem(storage.schedule);
  if (!raw) {
    const schedule = createEmptyWeekSchedule();
    schedule.monday.push({
      time: "09:00",
      subject: "Математика",
      homework: "Решить №1-6 на дроби",
      grade: "5",
      score: 8,
      textbook: null,
    });
    schedule.tuesday.push({
      time: "10:00",
      subject: "Русский язык",
      homework: "Написать сжатое изложение",
      grade: "4",
      score: 6,
      textbook: null,
    });
    return schedule;
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    return normalizeWeekSchedule(parsed);
  } catch {
    return createEmptyWeekSchedule();
  }
}

function saveScheduleRows(rows: WeekSchedule) {
  try {
    localStorage.setItem(storage.schedule, JSON.stringify(normalizeWeekSchedule(rows)));
  } catch (error) {
    console.error("Save schedule error:", formatUnknownError(error));
    addMessage(
      "system",
      "Не удалось сохранить расписание. Возможно, слишком большой объем данных в браузере.",
    );
  }
}

function createEmptyWeekSchedule(): WeekSchedule {
  return {
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: [],
  };
}

function normalizeWeekSchedule(value: unknown): WeekSchedule {
  const week = createEmptyWeekSchedule();
  if (!value) return week;

  if (Array.isArray(value)) {
    for (const raw of value) {
      const row = raw as Partial<{
        day: string;
        time: string;
        subject: string;
        homework: string;
        grade: string;
        score: number | string;
        textbook: LessonPdfRef | LessonPdf | null;
      }>;
      const dayKey = mapLegacyDayToWeekday(row.day ?? "");
      if (!dayKey) continue;
      const rawScore = Number(row.score ?? 5);
      week[dayKey].push({
        time: (row.time ?? "").trim(),
        subject: (row.subject ?? "").trim(),
        homework: (row.homework ?? "").trim(),
        grade: (row.grade ?? "").trim(),
        score: Math.min(10, Math.max(1, Number.isFinite(rawScore) ? Math.round(rawScore) : 5)),
        textbook: normalizeLessonPdfRef(row.textbook),
      });
    }
    return week;
  }

  const record = value as Partial<Record<WeekdayKey, unknown>>;
  for (const day of weekDays) {
    const dayLessons = record[day.key];
    if (!Array.isArray(dayLessons)) continue;
    week[day.key] = dayLessons.map((item) => {
      const lesson = item as Partial<ScheduleLesson>;
      const rawScore = Number(lesson.score ?? 5);
      return {
        time: (lesson.time ?? "").trim(),
        subject: (lesson.subject ?? "").trim(),
        homework: (lesson.homework ?? "").trim(),
        grade: (lesson.grade ?? "").trim(),
        score: Math.min(10, Math.max(1, Number.isFinite(rawScore) ? Math.round(rawScore) : 5)),
        textbook: normalizeLessonPdfRef((lesson as Partial<ScheduleLesson>).textbook),
      };
    });
  }
  return week;
}

function normalizeLessonPdfRef(value: unknown): LessonPdfRef | null {
  if (!value || typeof value !== "object") return null;
  const data = value as Partial<LessonPdfRef & LessonPdf>;
  const mimeType = typeof data.mimeType === "string" ? data.mimeType.trim() : "";
  const fileName = typeof data.fileName === "string" ? data.fileName.trim() : "";
  const cacheKey = typeof data.cacheKey === "string" ? data.cacheKey.trim() : "";
  if (!mimeType || !fileName) return null;
  if (cacheKey) return { mimeType, fileName, cacheKey };

  const legacyContent = typeof data.content === "string" ? data.content.trim() : "";
  if (!legacyContent) return null;
  const legacyKey = `legacy:${fileName}:${legacyContent.length}`;
  if (!lessonPdfCache.has(legacyKey)) {
    lessonPdfCache.set(legacyKey, { mimeType, fileName, content: legacyContent });
  }
  return { mimeType, fileName, cacheKey: legacyKey };
}

function dedupeAttachmentsByNameAndSize(items: ChatAttachment[]): ChatAttachment[] {
  const out: ChatAttachment[] = [];
  const seen = new Set<string>();
  for (const item of items) {
    const key = `${item.fileName.toLowerCase()}|${item.content.length}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

function openLessonPdfDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(lessonPdfDbName, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(lessonPdfStoreName)) {
        db.createObjectStore(lessonPdfStoreName);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB open failed"));
  });
}

async function putLessonPdfToDb(cacheKey: string, pdf: LessonPdf): Promise<void> {
  try {
    const db = await openLessonPdfDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(lessonPdfStoreName, "readwrite");
      tx.objectStore(lessonPdfStoreName).put(pdf, cacheKey);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("IndexedDB write failed"));
    });
    db.close();
  } catch (error) {
    console.error("PDF store error:", formatUnknownError(error));
  }
}

async function getLessonPdfFromCacheOrDb(ref: LessonPdfRef): Promise<LessonPdf | null> {
  const fromMemory = lessonPdfCache.get(ref.cacheKey);
  if (fromMemory) return fromMemory;
  try {
    const db = await openLessonPdfDb();
    const fromDb = await new Promise<LessonPdf | null>((resolve, reject) => {
      const tx = db.transaction(lessonPdfStoreName, "readonly");
      const req = tx.objectStore(lessonPdfStoreName).get(ref.cacheKey);
      req.onsuccess = () => {
        const value = req.result as LessonPdf | undefined;
        resolve(value ?? null);
      };
      req.onerror = () => reject(req.error ?? new Error("IndexedDB read failed"));
    });
    db.close();
    if (fromDb) lessonPdfCache.set(ref.cacheKey, fromDb);
    return fromDb;
  } catch (error) {
    console.error("PDF read error:", formatUnknownError(error));
    return null;
  }
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, timeoutMessage: string): Promise<T> {
  let timer: number | null = null;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = window.setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timer !== null) window.clearTimeout(timer);
  }
}

function mapLegacyDayToWeekday(day: string): WeekdayKey | null {
  const normalized = day.trim().toLowerCase();
  if (normalized.startsWith("пн")) return "monday";
  if (normalized.startsWith("вт")) return "tuesday";
  if (normalized.startsWith("ср")) return "wednesday";
  if (normalized.startsWith("чт")) return "thursday";
  if (normalized.startsWith("пт")) return "friday";
  if (normalized.startsWith("сб")) return "saturday";
  if (normalized.startsWith("вс")) return "sunday";
  return null;
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

function toggleStt(messageInput: HTMLTextAreaElement, micBtn: HTMLButtonElement) {
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
      const err = event.error ?? "unknown";
      if (err === "network" && !sttRetriedAfterNetwork) {
        sttRetriedAfterNetwork = true;
        try {
          sttRecognition?.stop();
        } catch {
          // noop
        }
        setTimeout(() => {
          try {
            sttRecognition?.start();
            sttListening = true;
            setMicButtonState(micBtn, true);
          } catch {
            addMessage(
              "system",
              "STT недоступен (network). Проверьте интернет и доступ к распознаванию речи в браузере.",
            );
          }
        }, 250);
        return;
      }
      addMessage(
        "system",
        `STT error: ${err}. Проверьте интернет, разрешение микрофона и повторите попытку.`,
      );
      sttListening = false;
      setMicButtonState(micBtn, false);
    };
    sttRecognition.onend = () => {
      sttListening = false;
      sttRetriedAfterNetwork = false;
      setMicButtonState(micBtn, false);
    };
  }
  if (sttListening) {
    sttRecognition.stop();
    sttListening = false;
    setMicButtonState(micBtn, false);
  } else {
    sttRecognition.start();
    sttListening = true;
    setMicButtonState(micBtn, true);
  }
}

function setMicButtonState(button: HTMLButtonElement, active: boolean) {
  button.classList.toggle("bg-[#570AA4]", active);
  button.classList.toggle("text-white", active);
  button.classList.toggle("text-[#570AA4]", !active);
  button.title = active ? "Остановить STT" : "STT микрофон";
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
    normalized === "ты планировщик учебного процесса, ты должен составлять план действий для пользователя на основе его сообщений. ты не должен решать задания за пользователя, только планировать выполнение." ||
    normalized === "system role: skillset planner" ||
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
    scrollChatToBottomIfNeeded();
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

function parseAndStoreTasksFromAssistant(text: string) {
  const tasks = extractTasksFromPlanText(text);
  if (tasks.length === 0) return;
  const merged = [...tasks, ...plannerItems];
  const unique: PlannerItem[] = [];
  const seen = new Set<string>();
  for (const item of merged) {
    const key = `${item.title.toLowerCase()}|${item.details.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(item);
  }
  plannerItems = unique.slice(0, 60);
  savePlannerItems();
}

function extractTasksFromPlanText(text: string): PlannerItem[] {
  const normalized = text.trim();
  if (!normalized) return [];

  const lines = normalized
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const taskLines = lines.filter((line) => /^(\d+[\.\)]|-|•)\s+/.test(line));
  const candidates = taskLines.length > 0 ? taskLines : lines.slice(0, 8).map((line) => `- ${line}`);

  const tasks = candidates
    .map((line) => {
      const clean = line.replace(/^(\d+[\.\)]|-|•)\s+/, "").trim();
      if (!clean) return null;
      const inlineScoreMatch = clean.match(/\b(10|[1-9])\s*\/\s*10\b|\bприоритет[:\s]+(10|[1-9])\b/i);
      const scoreFromText = inlineScoreMatch
        ? Number(inlineScoreMatch[1] ?? inlineScoreMatch[2] ?? 5)
        : null;
      const rawPriority =
        typeof scoreFromText === "number" && Number.isFinite(scoreFromText)
          ? scoreFromText
          : inferPriority(clean);
      const priority = Math.min(10, Math.max(1, rawPriority));
      return {
        id: id(),
        title: clean.slice(0, 90),
        details: clean,
        priority,
        createdAt: Date.now(),
      } satisfies PlannerItem;
    })
    .filter((item): item is PlannerItem => Boolean(item));

  return tasks.slice(0, 10);
}

function inferPriority(text: string): number {
  const low = text.toLowerCase();
  if (/(экзамен|контрольн|срочно|дедлайн|важно|сложно)/i.test(low)) return 9;
  if (/(проект|подготов|повторить|дз|домашн)/i.test(low)) return 7;
  return 5;
}

function confirmPlannerItem(text: string) {
  const parsed = extractTasksFromPlanText(text);
  if (parsed.length === 0) return;
  const merged = [...parsed, ...plannerItems];
  const unique: PlannerItem[] = [];
  const seen = new Set<string>();
  for (const item of merged) {
    const key = `${item.title.toLowerCase()}|${item.details.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(item);
  }
  plannerItems = unique.slice(0, 60);
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
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const entry = item as Partial<PlannerItem> & { text?: string };
        if (typeof entry.title === "string") {
          const rawPriority = Number(entry.priority ?? 5);
          const priority = Math.min(10, Math.max(1, Number.isFinite(rawPriority) ? Math.round(rawPriority) : 5));
          return {
            id: typeof entry.id === "string" ? entry.id : id(),
            title: entry.title.trim() || "Задание",
            details: typeof entry.details === "string" ? entry.details : "",
            priority,
            createdAt: typeof entry.createdAt === "number" ? entry.createdAt : Date.now(),
          } satisfies PlannerItem;
        }
        if (typeof entry.text === "string") {
          return {
            id: typeof entry.id === "string" ? entry.id : id(),
            title: entry.text.slice(0, 90).trim() || "Задание",
            details: entry.text.trim(),
            priority: 5,
            createdAt: typeof entry.createdAt === "number" ? entry.createdAt : Date.now(),
          } satisfies PlannerItem;
        }
        return null;
      })
      .filter((item): item is PlannerItem => Boolean(item));
  } catch {
    return [];
  }
}

function startPendingHistoryRefresh() {
  stopPendingHistoryRefresh();
  let attempts = 0;
  pendingHistoryTimer = window.setInterval(() => {
    attempts += 1;
    void loadHistory().catch(async () => {
      if (activeTab !== "chat") return;
      try {
        await ensureSocketReady(3000);
      } catch {
        // keep waiting; reconnect/backoff handles this
      }
    });
    // Long-running homework analysis can take more than 20s.
    if (attempts >= 120) stopPendingHistoryRefresh();
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
  if (currentAttachment?.type === "pdf") {
    return [
      "Проанализируй вложенный PDF-учебник или задание.",
      "Определи темы, уровень сложности и выдели конкретные задания.",
      "Для каждого задания укажи приоритет сложности в баллах от 1 до 10.",
      "Верни результат в формате списка шагов, чтобы задачи можно было выполнить по очереди от самых важных/сложных.",
      "Не решай задания за пользователя, только планируй выполнение.",
    ].join("\n");
  }
  return text;
}

function buildOutgoingMessageWithAttachments(
  text: string,
  currentAttachment: ChatAttachment | null,
  attachments: ChatAttachment[],
): string {
  const base = buildOutgoingMessage(text, currentAttachment);
  const pdfNames = attachments
    .filter((item): item is PdfAttachment => item.type === "pdf")
    .map((item) => item.fileName);
  if (pdfNames.length === 0) return base;
  const suffix = [
    "",
    `Используй вложенные PDF для анализа сложности заданий: ${pdfNames.join(", ")}.`,
    "Оцени сложность каждого задания по шкале 1-10 и выдай порядок выполнения от более сложного к более простому.",
    "Не решай задания за пользователя, только планируй.",
  ].join("\n");
  return `${base}${suffix}`;
}

function isAttachmentTransportError(error: unknown): boolean {
  const text = formatUnknownError(error).toLowerCase();
  return (
    text.includes("attachment") ||
    text.includes("mime") ||
    text.includes("payload") ||
    text.includes("unsupported") ||
    text.includes("too large") ||
    text.includes("limit") ||
    text.includes("max payload") ||
    text.includes("pdf")
  );
}

function isConnectionDropError(error: unknown): boolean {
  const text = formatUnknownError(error).toLowerCase();
  return text.includes("connection closed") || text.includes("not connected") || text.includes("code=1006");
}

async function ensureSocketReady(timeoutMs: number): Promise<void> {
  if (ws && ws.readyState === WebSocket.OPEN && !connectInFlight) return;
  void connectChat();
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (ws && ws.readyState === WebSocket.OPEN && !connectInFlight) return;
    await new Promise((resolve) => window.setTimeout(resolve, 250));
  }
  throw new Error("Не удалось переподключиться к gateway вовремя");
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
  return "Ты планировщик учебного процесса. Отвечай строго на русском языке, без иероглифов и без других языков. Ты должен составлять план действий для пользователя на основе его сообщений. Ты не должен решать задания за пользователя, только планировать выполнение.";
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
