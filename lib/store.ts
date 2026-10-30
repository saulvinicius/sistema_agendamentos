import { promises as fs } from "fs";
import path from "path";
import { Booking, Settings, Slot } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const BOOKINGS_FILE = path.join(DATA_DIR, "bookings.json");
const SETTINGS_FILE = path.join(DATA_DIR, "settings.json");

export const DEFAULT_SETTINGS: Settings = {
  shopName: "Lamina",
  tagline: "Corte, barba e ritual.",
  ownerPin: "1234",
  openTime: "09:00",
  closeTime: "19:00",
  slotInterval: 30,
  closedDays: [0],
  blockedSlots: [],
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
  const parsed = JSON.parse(raw) as Settings;
  return { ...DEFAULT_SETTINGS, ...parsed };
}

export async function saveSettings(next: Settings): Promise<Settings> {
  await ensureFiles();
  await fs.writeFile(SETTINGS_FILE, JSON.stringify(next, null, 2), "utf8");
  return next;
}

export async function getBookings(): Promise<Booking[]> {
  await ensureFiles();
  const raw = await fs.readFile(BOOKINGS_FILE, "utf8");
  return JSON.parse(raw) as Booking[];
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

export function slotKey(date: string, time: string): string {
  return `${date}|${time}`;
}

export function generateTimes(settings: Settings): string[] {
  const start = toMinutes(settings.openTime);
  const end = toMinutes(settings.closeTime);
  const times: string[] = [];
  for (let t = start; t < end; t += settings.slotInterval) {
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

export function buildSlots(
  date: string,
  settings: Settings,
  bookings: Booking[],
  now = new Date()
): Slot[] {
  const times = generateTimes(settings);
  const weekday = weekdayOf(date);
  const isClosed = settings.closedDays.includes(weekday);
  const today = todayISO(now);
  const current = nowHHMM(now);

  return times.map((time) => {
    if (isClosed) return { time, available: false, reason: "closed" as const };
    if (settings.blockedSlots.includes(slotKey(date, time))) {
      return { time, available: false, reason: "blocked" as const };
    }
    const taken = bookings.some(
      (b) => b.status === "confirmed" && b.date === date && b.time === time
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
