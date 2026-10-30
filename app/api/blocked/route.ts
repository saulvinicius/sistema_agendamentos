import { NextResponse } from "next/server";
import { getProfessional, getSettings, saveSettings, slotKey } from "@/lib/store";

export async function POST(request: Request) {
  const body = await request.json();
  const pin = String(body.pin || "");
  const date = String(body.date || "");
  const time = String(body.time || "");
  const action = String(body.action || "toggle");
  const professionalId = String(body.professionalId || "");
  const settings = await getSettings();
  if (pin !== settings.ownerPin) {
    return NextResponse.json({ error: "PIN invalido" }, { status: 401 });
  }
  const professional = getProfessional(settings, professionalId || undefined);
  if (!professional) {
    return NextResponse.json({ error: "Profissional invalido" }, { status: 400 });
  }
  const key = slotKey(date, time, professional.id);
  const set = new Set(settings.blockedSlots);
  if (action === "block" || (action === "toggle" && !set.has(key))) {
    set.add(key);
  } else {
    set.delete(key);
  }
  const saved = await saveSettings({ ...settings, blockedSlots: [...set] });
  return NextResponse.json({ blockedSlots: saved.blockedSlots });
}
