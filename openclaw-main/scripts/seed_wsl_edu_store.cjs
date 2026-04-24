const fs = require("fs");
const os = require("os");
const path = require("path");

const p = path.join(
  os.homedir(),
  ".skillset",
  "workspace",
  "data",
  "edu-planner",
  "store.json",
);
fs.mkdirSync(path.dirname(p), { recursive: true });

const d = {
  users: [
    { id: "teacher-1", name: "Иван Петров", schoolId: "school-7", role: "teacher" },
    { id: "student-1", name: "Аня Смирнова", schoolId: "school-7", role: "student" },
    { id: "parent-1", name: "Елена Смирнова", schoolId: "school-7", role: "parent" },
  ],
  assignments: [
    {
      id: "a-demo-1",
      title: "Алгебра",
      description: "15 задач",
      subject: "math",
      studentId: "student-1",
      teacherId: "teacher-1",
      dueDate: new Date(Date.now() + 172800000).toISOString(),
      estimatedHours: 3,
      status: "todo",
      createdAt: new Date().toISOString(),
    },
  ],
  attempts: [],
  points: { "student-1": 100 },
  healthUsageMinutes: { "student-1": 60 },
  pets: { "student-1": { level: 1, hunger: 20, exp: 10 } },
  loyaltyWallets: { "student-1": 300 },
  loyaltyCatalog: [
    { sku: "course-general", title: "Курс общего развития", cost: 1400, category: "course" },
  ],
  transactions: [],
};

fs.writeFileSync(p, JSON.stringify(d, null, 2));
console.log(p);
