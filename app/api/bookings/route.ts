import { NextResponse } from "next/server";
import {
  buildSlots,
  getBookings,
  getSettings,
  saveBookings,
  uid,
} from "@/lib/store";
import { Booking } from "@/lib/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pin = searchParams.get("pin") || "";
  const settings = await getSettings();
  if (pin !== settings.ownerPin) {
    return NextResponse.json({ error: "PIN invalido" }, { status: 401 });
  }
  const bookings = await getBookings();
  const sorted = [...bookings].sort((a, b) =>
    `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)
  );
  return NextResponse.json(sorted);
}

export async function POST(request: Request) {
  const body = await request.json();
  const name = String(body.name || "").trim();
  const phone = String(body.phone || "").trim();
  const serviceId = String(body.serviceId || "");
  const date = String(body.date || "");
  const time = String(body.time || "");

  if (!name || !phone || !serviceId || !date || !time) {
    return NextResponse.json({ error: "Preencha todos os campos" }, { status: 400 });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
    return NextResponse.json({ error: "Data ou horario invalido" }, { status: 400 });
  }

  const [settings, bookings] = await Promise.all([getSettings(), getBookings()]);
  const service = settings.services.find((s) => s.id === serviceId);
  if (!service) {
    return NextResponse.json({ error: "Servico invalido" }, { status: 400 });
  }

  const slots = buildSlots(date, settings, bookings);
  const slot = slots.find((s) => s.time === time);
  if (!slot?.available) {
    return NextResponse.json(
      { error: "Esse horario nao esta mais disponivel" },
      { status: 409 }
    );
  }

  const booking: Booking = {
    id: uid(),
    name: name.slice(0, 60),
    phone: phone.slice(0, 20),
    serviceId,
    date,
    time,
    createdAt: new Date().toISOString(),
    status: "confirmed",
  };
  bookings.push(booking);
  await saveBookings(bookings);
  return NextResponse.json(booking, { status: 201 });
}
