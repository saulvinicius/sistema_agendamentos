import { NextResponse } from "next/server";
import { getSettings } from "@/lib/store";

export async function POST(request: Request) {
  const body = await request.json();
  const pin = String(body.pin || "");
  const settings = await getSettings();
  if (pin !== settings.ownerPin) {
    return NextResponse.json({ error: "PIN invalido" }, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}
