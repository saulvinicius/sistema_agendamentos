import { promises as fs } from "fs";
import path from "path";
import { Booking, Professional, Settings, Slot } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const BOOKINGS_FILE = path.join(DATA_DIR, "bookings.json");
const SETTINGS_FILE = path.join(DATA_DIR, "settings.json");

export const DEFAULT_PROFESSIONALS: Professional[] = [
  {
    id: "rafael",
    name: "Rafael",
    role: "Barbeiro senior",
    active: true,
    openTime: "09:00",
    closeTime: "19:00",
    slotInterval: 30,
    closedDays: [0],
  },
  {
    id: "lucas",
    name: "Lucas",
    role: "Especialista em barba",
    active: true,
    openTime: "10:00",
    closeTime: "18:00",
    slotInterval: 30,
    closedDays: [0, 1],
  },
  {
    id: "marina",
    name: "Marina",
    role: "Cortes e sobrancelha",
    active: true,
    openTime: "09:00",
    closeTime: "17:00",
    slotInterval: 30,
    closedDays: [0],
  },
];

export const DEFAULT_SETTINGS: Settings = {
  shopName: "Lamina",
  tagline: "Corte, barba e ritual.",
  ownerPin: "1234",
  openTime: "09:00",
  closeTime: "19:00",
  slotInterval: 30,
  closedDays: [0],
  blockedSlots: [],
  professionals: DEFAULT_PROFESSIONALS,
  services: [
    {
      id: "corte",
      name: "Corte classico",
      description: "Tesoura e maquina, alinhado ao seu estilo.",
      duration: 30,
      price: 45,
    },
    {
      id: "barba",
      name: "Barba premium",
      description: "Toalha quente, navalha e oleo de finalizacao.",
      duration: 30,
      price: 40,
    },
    {
      id: "combo",
      name: "Corte + Barba",
      description: "O ritual completo. Sai pronto para qualquer cena.",
      duration: 60,
      price: 75,
    },
    {
      id: "sobrancelha",
      name: "Sobrancelha",
      description: "Design rapido, acabamento limpo.",
      duration: 15,
      price: 20,
    },
  ],
};

function normalizeProfessionals(raw: unknown, fallback: Settings): Professional[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return fallback.professionals.map((p) => ({ ...p }));
  }
  return raw.map((item, index) => {
    const p = item as Partial<Professional>;
    return {
      id: String(p.id || `pro-${index + 1}`),
      name: String(p.name || `Profissional ${index + 1}`).slice(0, 40),
      role: String(p.role || "Barbeiro").slice(0, 40),
      active: p.active !== false,
      openTime: String(p.openTime || fallback.openTime),
      closeTime: String(p.closeTime || fallback.closeTime),
      slotInterval: Number(p.slotInterval || fallback.slotInterval),
      closedDays: Array.isArray(p.closedDays) ? p.closedDays.map(Number) : [...fallback.closedDays],
    };
  });
}

async function ensureFiles() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(BOOKINGS_FILE);
  } catch {
    await fs.writeFile(BOOKINGS_FILE, "[]", "utf8");
  }
  try {
    await fs.access(SETTINGS_FILE);
  } catch {
    await fs.writeFile(
      SETTINGS_FILE,
      JSON.stringify(DEFAULT_SETTINGS, null, 2),
      "utf8"
    );
  }
}

export async function getSettings(): Promise<Settings> {
  await ensureFiles();
  const raw = await fs.readFile(SETTINGS_FILE, "utf8");
  const parsed = JSON.parse(raw) as Partial<Settings>;
  const merged: Settings = {
    ...DEFAULT_SETTINGS,
    ...parsed,
    services: parsed.services?.length ? parsed.services : DEFAULT_SETTINGS.services,
    blockedSlots: Array.isArray(parsed.blockedSlots) ? parsed.blockedSlots : [],
    closedDays: Array.isArray(parsed.closedDays) ? parsed.closedDays : DEFAULT_SETTINGS.closedDays,
    professionals: normalizeProfessionals(parsed.professionals, DEFAULT_SETTINGS),
  };
  return merged;
}

export async function saveSettings(next: Settings): Promise<Settings> {
  await ensureFiles();
  await fs.writeFile(SETTINGS_FILE, JSON.stringify(next, null, 2), "utf8");
  return next;
}

export async function getBookings(): Promise<Booking[]> {
  await ensureFiles();
  const raw = await fs.readFile(BOOKINGS_FILE, "utf8");
  const parsed = JSON.parse(raw) as Booking[];
  const fallbackId = DEFAULT_PROFESSIONALS[0].id;
  return parsed.map((b) => ({
    ...b,
    professionalId: b.professionalId || fallbackId,
  }));
}

export async function saveBookings(bookings: Booking[]): Promise<void> {
  await ensureFiles();
  await fs.writeFile(BOOKINGS_FILE, JSON.stringify(bookings, null, 2), "utf8");
}

export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function fromMinutes(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function slotKey(date: string, time: string, professionalId?: string): string {
  return professionalId ? `${professionalId}|${date}|${time}` : `${date}|${time}`;
}

export function generateTimes(openTime: string, closeTime: string, slotInterval: number): string[] {
  const start = toMinutes(openTime);
  const end = toMinutes(closeTime);
  const times: string[] = [];
  for (let t = start; t < end; t += slotInterval) {
    times.push(fromMinutes(t));
  }
  return times;
}

export function todayISO(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function nowHHMM(now = new Date()): string {
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

export function weekdayOf(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d).getDay();
}

export function getProfessional(settings: Settings, professionalId?: string): Professional | undefined {
  if (professionalId) {
    return settings.professionals.find((p) => p.id === professionalId);
  }
  return settings.professionals.find((p) => p.active) || settings.professionals[0];
}

export function buildSlots(
  date: string,
  settings: Settings,
  bookings: Booking[],
  professionalId?: string,
  now = new Date()
): Slot[] {
  const professional = getProfessional(settings, professionalId);
  if (!professional || !professional.active) {
    return [];
  }

  const times = generateTimes(professional.openTime, professional.closeTime, professional.slotInterval);
  const weekday = weekdayOf(date);
  const isClosed = settings.closedDays.includes(weekday) || professional.closedDays.includes(weekday);
  const today = todayISO(now);
  const current = nowHHMM(now);

  return times.map((time) => {
    if (isClosed) return { time, available: false, reason: "closed" as const };
    const personalKey = slotKey(date, time, professional.id);
    const legacyKey = slotKey(date, time);
    if (settings.blockedSlots.includes(personalKey) || settings.blockedSlots.includes(legacyKey)) {
      return { time, available: false, reason: "blocked" as const };
    }
    const taken = bookings.some(
      (b) =>
        b.status === "confirmed" &&
        b.date === date &&
        b.time === time &&
        (b.professionalId || professional.id) === professional.id
    );
    if (taken) return { time, available: false, reason: "booked" as const };
    if (date < today || (date === today && time <= current)) {
      return { time, available: false, reason: "past" as const };
    }
    return { time, available: true };
  });
}

export function upcomingDates(days = 14, now = new Date()): string[] {
  const list: string[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    list.push(todayISO(d));
  }
  return list;
}

export function formatDateBR(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function weekdayLabel(iso: string): string {
  const names = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
  return names[weekdayOf(iso)];
}

export function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function slugify(value: string): string {
  const base = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 24);
  return base || uid();
}
