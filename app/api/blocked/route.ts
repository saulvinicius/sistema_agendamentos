import { NextResponse } from "next/server";
import { getSettings, saveSettings, slotKey } from "@/lib/store";

export async function POST(request: Request) {
  const body = await request.json();
  const pin = String(body.pin || "");
  const date = String(body.date || "");
  const time = String(body.time || "");
  const action = String(body.action || "toggle");
  const settings = await getSettings();
  if (pin !== settings.ownerPin) {
    return NextResponse.json({ error: "PIN invalido" }, { status: 401 });
  }
  const key = slotKey(date, time);
  const set = new Set(settings.blockedSlots);
  if (action === "block" || (action === "toggle" && !set.has(key))) {
    set.add(key);
  } else {
    set.delete(key);
  }
  const saved = await saveSettings({ ...settings, blockedSlots: [...set] });
  return NextResponse.json({ blockedSlots: saved.blockedSlots });
}
