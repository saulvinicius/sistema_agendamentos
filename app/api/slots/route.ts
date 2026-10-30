import { NextResponse } from "next/server";
import { buildSlots, getBookings, getSettings, todayISO } from "@/lib/store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") || todayISO();
  const [settings, bookings] = await Promise.all([getSettings(), getBookings()]);
  const slots = buildSlots(date, settings, bookings);
  return NextResponse.json({ date, slots });
}
