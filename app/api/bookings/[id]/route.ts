import { NextResponse } from "next/server";
import { getBookings, getSettings, saveBookings } from "@/lib/store";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const pin = String(body.pin || "");
  const settings = await getSettings();
  if (pin !== settings.ownerPin) {
    return NextResponse.json({ error: "PIN invalido" }, { status: 401 });
  }
  const bookings = await getBookings();
  const idx = bookings.findIndex((b) => b.id === id);
  if (idx < 0) {
    return NextResponse.json({ error: "Agendamento nao encontrado" }, { status: 404 });
  }
  bookings[idx] = { ...bookings[idx], status: "cancelled" };
  await saveBookings(bookings);
  return NextResponse.json(bookings[idx]);
}
