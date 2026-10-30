import { NextResponse } from "next/server";
import { getSettings, saveSettings } from "@/lib/store";

export async function GET() {
  const settings = await getSettings();
  const { ownerPin: _pin, ...publicSettings } = settings;
  return NextResponse.json(publicSettings);
}

export async function PUT(request: Request) {
  const body = await request.json();
  const pin = String(body.pin || "");
  const current = await getSettings();
  if (pin !== current.ownerPin) {
    return NextResponse.json({ error: "PIN invalido" }, { status: 401 });
  }
  const next = {
    ...current,
    shopName: String(body.shopName || current.shopName).slice(0, 40),
    tagline: String(body.tagline || current.tagline).slice(0, 80),
    openTime: String(body.openTime || current.openTime),
    closeTime: String(body.closeTime || current.closeTime),
    slotInterval: Number(body.slotInterval || current.slotInterval),
    closedDays: Array.isArray(body.closedDays)
      ? body.closedDays.map(Number)
      : current.closedDays,
    ownerPin: body.newPin ? String(body.newPin).slice(0, 8) : current.ownerPin,
  };
  const saved = await saveSettings(next);
  const { ownerPin: _pin2, ...publicSettings } = saved;
  return NextResponse.json(publicSettings);
}
