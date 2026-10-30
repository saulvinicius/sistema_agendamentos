"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import Logo from "@/components/Logo";
import { Booking, Service, Slot } from "@/lib/types";

type PublicSettings = {
  shopName: string;
  tagline: string;
  openTime: string;
  closeTime: string;
  slotInterval: number;
  closedDays: number[];
  services: Service[];
};

const WEEK = [
  { id: 0, label: "Dom" },
  { id: 1, label: "Seg" },
  { id: 2, label: "Ter" },
  { id: 3, label: "Qua" },
  { id: 4, label: "Qui" },
  { id: 5, label: "Sex" },
  { id: 6, label: "Sab" },
];

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function OwnerPage() {
  const [pin, setPin] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [settings, setSettings] = useState<PublicSettings | null>(null);
  const [date, setDate] = useState(todayISO());
  const [slots, setSlots] = useState<Slot[]>([]);
  const [tab, setTab] = useState<"agenda" | "horarios" | "loja">("agenda");
  const [message, setMessage] = useState("");
  const [newPin, setNewPin] = useState("");

  async function login(e: FormEvent) {
    e.preventDefault();
    setAuthError("");
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });
    if (!res.ok) {
      setAuthError("PIN incorreto.");
      return;
    }
    setAuthed(true);
  }

  async function loadAll(currentPin: string, currentDate: string) {
    const [b, s, sl] = await Promise.all([
      fetch(`/api/bookings?pin=${encodeURIComponent(currentPin)}`).then((r) => r.json()),
      fetch("/api/settings").then((r) => r.json()),
      fetch(`/api/slots?date=${currentDate}`).then((r) => r.json()),
    ]);
    if (Array.isArray(b)) setBookings(b);
    setSettings(s);
    setSlots(sl.slots || []);
  }

  useEffect(() => {
    if (authed) loadAll(pin, date);
  }, [authed, date, pin]);

  const dayBookings = useMemo(
    () =>
      bookings
        .filter((b) => b.date === date)
        .sort((a, b) => a.time.localeCompare(b.time)),
    [bookings, date]
  );

  const upcoming = useMemo(
    () =>
      bookings
        .filter((b) => b.status === "confirmed" && b.date >= todayISO())
        .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)),
    [bookings]
  );

  function serviceName(id: string) {
    return settings?.services.find((s) => s.id === id)?.name || id;
  }

  async function cancelBooking(id: string) {
    const res = await fetch(`/api/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });
    if (res.ok) {
      await loadAll(pin, date);
      setMessage("Agendamento cancelado.");
    }
  }

  async function toggleSlot(time: string, available: boolean, reason?: string) {
    if (reason === "booked" || reason === "past" || reason === "closed") return;
    await fetch("/api/blocked", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pin,
        date,
        time,
        action: available ? "block" : "unblock",
      }),
    });
    await loadAll(pin, date);
  }

  async function saveShop(e: FormEvent) {
    e.preventDefault();
    if (!settings) return;
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...settings, pin, newPin: newPin || undefined }),
    });
    if (!res.ok) {
      setMessage("Nao foi possivel salvar.");
      return;
    }
    if (newPin) {
      setPin(newPin);
      setNewPin("");
    }
    setMessage("Configuracoes salvas.");
    await loadAll(newPin || pin, date);
  }

  if (!authed) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <motion.form
          onSubmit={login}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm rounded-2xl border border-white/10 bg-ink-800 p-8 text-center shadow-lift"
        >
          <Logo className="justify-center" />
          <p className="mt-6 text-xs tracking-[0.3em] uppercase text-gold-400">Area do dono</p>
          <p className="mt-2 text-sm text-cream/60">Digite o PIN para gerenciar os horarios.</p>
          <input
            autoFocus
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            type="password"
            inputMode="numeric"
            placeholder="PIN"
            className="mt-6 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-center tracking-[0.4em] outline-none focus:border-gold-400"
          />
          {authError && <p className="mt-3 text-sm text-red-400">{authError}</p>}
          <button className="mt-6 w-full rounded-xl bg-gold-400 py-3 text-xs tracking-[0.28em] uppercase text-ink-950">
            Entrar
          </button>
          <p className="mt-4 text-[11px] text-cream/35">PIN inicial: 1234</p>
          <Link href="/" className="mt-6 inline-block text-xs text-cream/40 hover:text-gold-400">
            Voltar ao agendamento
          </Link>
        </motion.form>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 pb-16">
      <header className="mx-auto flex max-w-6xl items-center justify-between py-6">
        <Logo />
        <Link href="/" className="text-xs tracking-[0.22em] uppercase text-cream/50 hover:text-gold-400">
          Ver site
        </Link>
      </header>

      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap gap-2">
          {(
            [
              ["agenda", "Agenda"],
              ["horarios", "Horarios"],
              ["loja", "Loja"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`rounded-full border px-5 py-2 text-xs tracking-[0.22em] uppercase transition ${
                tab === id
                  ? "border-gold-400 bg-gold-400 text-ink-950"
                  : "border-white/10 text-cream/60 hover:border-gold-400/40"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <AnimatePresence>
          {message && (
            <motion.p
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 text-sm text-gold-300"
            >
              {message}
            </motion.p>
          )}
        </AnimatePresence>

        {tab === "agenda" && (
          <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="font-display text-4xl">Proximos cortes</h2>
                <p className="mt-1 text-sm text-cream/50">{upcoming.length} confirmados a partir de hoje</p>
              </div>
            </div>
            <div className="overflow-hidden rounded-2xl border border-white/10">
              {upcoming.length === 0 ? (
                <p className="p-8 text-sm text-cream/45">Nenhum agendamento futuro.</p>
              ) : (
                <ul>
                  {upcoming.map((b, i) => (
                    <motion.li
                      key={b.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 px-5 py-4 last:border-0"
                    >
                      <div>
                        <p className="font-medium text-cream">{b.name}</p>
                        <p className="text-xs text-cream/45">
                          {b.date.split("-").reverse().join("/")} · {b.time} · {serviceName(b.serviceId)} · {b.phone}
                        </p>
                      </div>
                      <button
                        onClick={() => cancelBooking(b.id)}
                        className="text-xs tracking-wider uppercase text-red-400/80 hover:text-red-300"
                      >
                        Cancelar
                      </button>
                    </motion.li>
                  ))}
                </ul>
              )}
            </div>
          </motion.section>
        )}

        {tab === "horarios" && (
          <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mb-6 flex flex-wrap items-end gap-4">
              <div className="flex-1">
                <h2 className="font-display text-4xl">Grade do dia</h2>
                <p className="mt-1 text-sm text-cream/50">
                  Clique em um horario livre para bloquear. Clique de novo para liberar.
                </p>
              </div>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="rounded-xl border border-white/10 bg-ink-800 px-4 py-2 outline-none focus:border-gold-400"
              />
            </div>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-6">
              {slots.map((slot) => {
                const booking = dayBookings.find((b) => b.time === slot.time && b.status === "confirmed");
                const tone = !slot.available
                  ? slot.reason === "blocked"
                    ? "border-amber-500/40 bg-amber-500/10 text-amber-200"
                    : slot.reason === "booked"
                      ? "border-gold-400/40 bg-gold-400/10 text-gold-200"
                      : "border-white/5 text-white/25"
                  : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200 hover:border-emerald-300";
                return (
                  <button
                    key={slot.time}
                    onClick={() => toggleSlot(slot.time, slot.available, slot.reason)}
                    className={`rounded-xl border px-3 py-3 text-left transition ${tone}`}
                  >
                    <div className="text-sm font-medium">{slot.time}</div>
                    <div className="mt-1 truncate text-[11px] uppercase tracking-wider opacity-80">
                      {booking
                        ? booking.name
                        : slot.reason === "blocked"
                          ? "Bloqueado"
                          : slot.reason === "past"
                            ? "Passou"
                            : slot.reason === "closed"
                              ? "Fechado"
                              : "Livre"}
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.section>
        )}

        {tab === "loja" && settings && (
          <motion.form
            onSubmit={saveShop}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid max-w-xl gap-5"
          >
            <h2 className="font-display text-4xl">Funcionamento</h2>
            <label className="block">
              <span className="mb-2 block text-xs tracking-[0.22em] uppercase text-gold-400">Nome da loja</span>
              <input
                value={settings.shopName}
                onChange={(e) => setSettings({ ...settings, shopName: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 outline-none focus:border-gold-400"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs tracking-[0.22em] uppercase text-gold-400">Frase</span>
              <input
                value={settings.tagline}
                onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 outline-none focus:border-gold-400"
              />
            </label>
            <div className="grid grid-cols-3 gap-3">
              <label>
                <span className="mb-2 block text-xs tracking-[0.22em] uppercase text-gold-400">Abre</span>
                <input
                  type="time"
                  value={settings.openTime}
                  onChange={(e) => setSettings({ ...settings, openTime: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 outline-none focus:border-gold-400"
                />
              </label>
              <label>
                <span className="mb-2 block text-xs tracking-[0.22em] uppercase text-gold-400">Fecha</span>
                <input
                  type="time"
                  value={settings.closeTime}
                  onChange={(e) => setSettings({ ...settings, closeTime: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 outline-none focus:border-gold-400"
                />
              </label>
              <label>
                <span className="mb-2 block text-xs tracking-[0.22em] uppercase text-gold-400">Intervalo</span>
                <select
                  value={settings.slotInterval}
                  onChange={(e) => setSettings({ ...settings, slotInterval: Number(e.target.value) })}
                  className="w-full rounded-xl border border-white/10 bg-ink-800 px-3 py-3 outline-none focus:border-gold-400"
                >
                  <option value={15}>15 min</option>
                  <option value={30}>30 min</option>
                  <option value={45}>45 min</option>
                  <option value={60}>60 min</option>
                </select>
              </label>
            </div>
            <div>
              <span className="mb-2 block text-xs tracking-[0.22em] uppercase text-gold-400">Dias fechados</span>
              <div className="flex flex-wrap gap-2">
                {WEEK.map((d) => {
                  const on = settings.closedDays.includes(d.id);
                  return (
                    <button
                      type="button"
                      key={d.id}
                      onClick={() => {
                        const next = on
                          ? settings.closedDays.filter((x) => x !== d.id)
                          : [...settings.closedDays, d.id];
                        setSettings({ ...settings, closedDays: next });
                      }}
                      className={`rounded-full border px-3 py-1.5 text-xs ${
                        on ? "border-gold-400 bg-gold-400 text-ink-950" : "border-white/10 text-cream/60"
                      }`}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <label className="block">
              <span className="mb-2 block text-xs tracking-[0.22em] uppercase text-gold-400">Novo PIN (opcional)</span>
              <input
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                placeholder="Deixe vazio para manter"
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 outline-none focus:border-gold-400"
              />
            </label>
            <button className="rounded-xl bg-gold-400 py-3 text-xs tracking-[0.28em] uppercase text-ink-950">
              Salvar
            </button>
          </motion.form>
        )}
      </div>
    </main>
  );
}
