import fs from "node:fs/promises";
import path from "node:path";

export type EduRole = "student" | "teacher" | "parent";
export type AssignmentStatus = "todo" | "in_progress" | "done" | "late";

export type Assignment = {
  id: string;
  title: string;
  description: string;
  subject: string;
  studentId: string;
  teacherId?: string;
  dueDate: string;
  estimatedHours: number;
  status: AssignmentStatus;
  createdAt: string;
  completedAt?: string;
};

export type EduStore = {
  users: Array<{ id: string; name: string; schoolId: string; role: EduRole }>;
  assignments: Assignment[];
  attempts: Array<{ assignmentId: string; studentId: string; minutesSpent: number; at: string }>;
  points: Record<string, number>;
  healthUsageMinutes: Record<string, number>;
  pets: Record<string, { level: number; hunger: number; exp: number }>;
  loyaltyWallets: Record<string, number>;
  loyaltyCatalog: Array<{ sku: string; title: string; cost: number; category: string }>;
  transactions: Array<{ userId: string; amount: number; reason: string; at: string }>;
};

export const defaultStore = (): EduStore => ({
  users: [],
  assignments: [],
  attempts: [],
  points: {},
  healthUsageMinutes: {},
  pets: {},
  loyaltyWallets: {},
  loyaltyCatalog: [
    { sku: "merch-hoodie", title: "Фирменный худи", cost: 1800, category: "merch" },
    { sku: "course-general", title: "Курс общего развития", cost: 1400, category: "course" },
    { sku: "course-freelance", title: "Курс по фрилансу", cost: 2200, category: "course" },
  ],
  transactions: [],
});

export async function loadStore(filePath: string): Promise<EduStore> {
  try {
    const content = await fs.readFile(filePath, "utf8");
    return { ...defaultStore(), ...(JSON.parse(content) as Partial<EduStore>) };
  } catch {
    return defaultStore();
  }
}

export async function saveStore(filePath: string, store: EduStore): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(store, null, 2), "utf8");
}

