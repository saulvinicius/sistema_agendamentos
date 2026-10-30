import { NextResponse } from "next/server";
import { getSettings, saveSettings, slugify, uid } from "@/lib/store";
import { Professional } from "@/lib/types";

function sanitizeProfessionals(raw: unknown, current: Professional[]): Professional[] {
  if (!Array.isArray(raw)) return current;
  const used = new Set<string>();
  return raw
    .map((item, index) => {
      const p = item as Partial<Professional>;
      const name = String(p.name || "").trim().slice(0, 40);
      if (!name) return null;
      let id = String(p.id || slugify(name) || `pro-${index + 1}`);
      while (used.has(id)) id = `${id}-${uid().slice(-4)}`;
      used.add(id);
      return {
        id,
        name,
        role: String(p.role || "Barbeiro").trim().slice(0, 40) || "Barbeiro",
        active: p.active !== false,
        openTime: String(p.openTime || "09:00"),
        closeTime: String(p.closeTime || "19:00"),
        slotInterval: Number(p.slotInterval || 30),
        closedDays: Array.isArray(p.closedDays) ? p.closedDays.map(Number) : [],
      } as Professional;
    })
    .filter((p): p is Professional => Boolean(p));
}

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
  const professionals = sanitizeProfessionals(body.professionals, current.professionals);
  if (professionals.length === 0) {
    return NextResponse.json({ error: "Cadastre ao menos um profissional" }, { status: 400 });
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
    professionals,
  };
  const saved = await saveSettings(next);
  const { ownerPin: _pin2, ...publicSettings } = saved;
  return NextResponse.json(publicSettings);
}
