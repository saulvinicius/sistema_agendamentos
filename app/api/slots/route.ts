import { NextResponse } from "next/server";
import { buildSlots, getBookings, getProfessional, getSettings, todayISO } from "@/lib/store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") || todayISO();
  const professionalId = searchParams.get("professionalId") || "";
  const [settings, bookings] = await Promise.all([getSettings(), getBookings()]);
  const professional = getProfessional(settings, professionalId || undefined);
  if (!professional) {
    return NextResponse.json({ date, professionalId: "", slots: [] });
  }
  const slots = buildSlots(date, settings, bookings, professional.id);
  return NextResponse.json({ date, professionalId: professional.id, slots });
}
