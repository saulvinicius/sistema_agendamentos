"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import Logo from "@/components/Logo";
import { Booking, Professional, Service, Slot } from "@/lib/types";

type PublicSettings = {
  shopName: string;
  tagline: string;
  openTime: string;
  closeTime: string;
  slotInterval: number;
  closedDays: number[];
  services: Service[];
  professionals: Professional[];
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

function emptyProfessional(): Professional {
  return {
    id: "",
    name: "",
    role: "Barbeiro",
    active: true,
    openTime: "09:00",
    closeTime: "19:00",
    slotInterval: 30,
    closedDays: [0],
  };
}

export default function OwnerPage() {
  const [pin, setPin] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [settings, setSettings] = useState<PublicSettings | null>(null);
  const [date, setDate] = useState(todayISO());
  const [slots, setSlots] = useState<Slot[]>([]);
  const [tab, setTab] = useState<"agenda" | "horarios" | "equipe" | "loja">("agenda");
  const [message, setMessage] = useState("");
  const [newPin, setNewPin] = useState("");
  const [professionalId, setProfessionalId] = useState("");

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

  async function loadAll(currentPin: string, currentDate: string, currentProId?: string) {
    const s = await fetch("/api/settings").then((r) => r.json());
    setSettings(s);
    const nextProId = currentProId || professionalId || s.professionals?.[0]?.id || "";
    if (!professionalId && nextProId) setProfessionalId(nextProId);
    const [b, sl] = await Promise.all([
      fetch(`/api/bookings?pin=${encodeURIComponent(currentPin)}`).then((r) => r.json()),
      fetch(
        `/api/slots?date=${currentDate}${nextProId ? `&professionalId=${encodeURIComponent(nextProId)}` : ""}`
      ).then((r) => r.json()),
    ]);
    if (Array.isArray(b)) setBookings(b);
    setSlots(sl.slots || []);
  }

  useEffect(() => {
    if (authed) loadAll(pin, date, professionalId);
  }, [authed, date, pin, professionalId]);

  const professionals = settings?.professionals || [];
  const selectedPro = professionals.find((p) => p.id === professionalId) || professionals[0];

  const dayBookings = useMemo(
    () =>
      bookings
        .filter((b) => b.date === date && (!professionalId || b.professionalId === professionalId))
        .sort((a, b) => a.time.localeCompare(b.time)),
    [bookings, date, professionalId]
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

  function professionalName(id: string) {
    return settings?.professionals.find((p) => p.id === id)?.name || id;
  }

  async function cancelBooking(id: string) {
    const res = await fetch(`/api/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });
    if (res.ok) {
      await loadAll(pin, date, professionalId);
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
        professionalId,
        action: available ? "block" : "unblock",
      }),
    });
    await loadAll(pin, date, professionalId);
  }

  async function saveShop(e?: FormEvent) {
    e?.preventDefault();
    if (!settings) return;
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...settings, pin, newPin: newPin || undefined }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setMessage(data.error || "Nao foi possivel salvar.");
      return;
    }
    if (newPin) {
      setPin(newPin);
      setNewPin("");
    }
    setMessage("Configuracoes salvas.");
    await loadAll(newPin || pin, date, professionalId);
  }

  function updateProfessional(id: string, patch: Partial<Professional>) {
    if (!settings) return;
    setSettings({
      ...settings,
      professionals: settings.professionals.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    });
  }

  function addProfessional() {
    if (!settings) return;
    const next = emptyProfessional();
    next.id = `novo-${Date.now().toString(36)}`;
    next.name = "Novo profissional";
    setSettings({ ...settings, professionals: [...settings.professionals, next] });
  }

  function removeProfessional(id: string) {
    if (!settings) return;
    if (settings.professionals.length <= 1) {
      setMessage("Mantenha ao menos um profissional.");
      return;
    }
    const next = settings.professionals.filter((p) => p.id !== id);
    setSettings({ ...settings, professionals: next });
    if (professionalId === id) setProfessionalId(next[0]?.id || "");
  }

  if (!authed) {
    return (
      <main className="relative flex min-h-dvh items-center justify-center overflow-x-hidden bg-mesh px-4 py-8 sm:px-6">
        <div className="orb pointer-events-none absolute -left-16 top-10 h-[240px] w-[240px] rounded-full bg-gold-400/20 blur-3xl sm:-left-24 sm:h-[420px] sm:w-[420px]" />
        <div className="orb orb-delay pointer-events-none absolute -right-10 bottom-0 h-[200px] w-[200px] rounded-full bg-volt-400/15 blur-3xl sm:-right-16 sm:h-[360px] sm:w-[360px]" />
        <motion.form
          onSubmit={login}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel relative w-full max-w-sm rounded-3xl border border-white/10 p-6 text-center backdrop-blur-xl sm:p-8"
        >
          <Logo className="justify-center" />
          <p className="mt-6 text-xs font-semibold tracking-widest uppercase text-gold-400">Area do dono</p>
          <p className="mt-2 text-sm text-cream/60">Digite o PIN para gerenciar os horarios.</p>
          <input
            autoFocus
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            type="password"
            inputMode="numeric"
            placeholder="PIN"
            className="mt-6 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-center font-semibold tracking-widest outline-none focus:border-gold-400 focus:shadow-gold"
          />
          {authError && <p className="mt-3 text-sm text-flame-400">{authError}</p>}
          <button className="btn-primary mt-6 w-full rounded-xl py-3 text-xs font-semibold tracking-wider uppercase text-ink-950">
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
    <main className="relative min-h-dvh overflow-x-hidden bg-mesh pb-[max(4rem,env(safe-area-inset-bottom))]">
      <div className="orb pointer-events-none absolute -left-20 top-0 h-[240px] w-[240px] rounded-full bg-gold-400/15 blur-3xl sm:-left-32 sm:h-[480px] sm:w-[480px]" />
      <div className="orb orb-delay pointer-events-none absolute -right-16 bottom-0 h-[200px] w-[200px] rounded-full bg-volt-400/12 blur-3xl sm:-right-24 sm:h-[400px] sm:w-[400px]" />

      <header className="page-shell relative flex items-center justify-between gap-3 py-4 sm:py-6">
        <Logo />
        <Link
          href="/"
          className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-semibold tracking-wider uppercase text-cream/70 backdrop-blur-md hover:border-gold-400/60 hover:text-gold-300 sm:px-4 sm:text-xs"
        >
          Ver site
        </Link>
      </header>

      <div className="page-shell relative">
        <div className="mb-6 flex w-full gap-2 overflow-x-auto scroll-fade pb-1 sm:mb-8 sm:flex-wrap sm:overflow-visible">
          {(
            [
              ["agenda", "Agenda"],
              ["horarios", "Horarios"],
              ["equipe", "Equipe"],
              ["loja", "Loja"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`shrink-0 rounded-full border px-4 py-2 text-[11px] font-semibold tracking-wider uppercase transition sm:px-5 sm:text-xs ${
                tab === id
                  ? "border-gold-400 bg-gradient-to-r from-gold-300 to-gold-500 text-ink-950 shadow-gold"
                  : "border-white/10 bg-white/5 text-cream/60 hover:border-gold-400/40"
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
              className="mb-6 inline-block max-w-full rounded-full border border-volt-400/30 bg-volt-400/10 px-4 py-2 text-sm text-volt-300"
            >
              {message}
            </motion.p>
          )}
        </AnimatePresence>

        {tab === "agenda" && (
          <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Proximos cortes</h2>
                <p className="mt-1 text-sm text-cream/50">{upcoming.length} confirmados a partir de hoje</p>
              </div>
            </div>
            <div className="glass-panel overflow-hidden rounded-2xl border border-white/10 sm:rounded-3xl">
              {upcoming.length === 0 ? (
                <p className="p-6 text-sm text-cream/45 sm:p-8">Nenhum agendamento futuro.</p>
              ) : (
                <ul>
                  {upcoming.map((b, i) => (
                    <motion.li
                      key={b.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="flex flex-col gap-3 border-b border-white/5 px-4 py-4 last:border-0 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-5"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-cream">{b.name}</p>
                        <p className="break-words text-xs text-cream/45">
                          {b.date.split("-").reverse().join("/")} · {b.time} · {professionalName(b.professionalId)} · {serviceName(b.serviceId)} · {b.phone}
                        </p>
                      </div>
                      <button
                        onClick={() => cancelBooking(b.id)}
                        className="self-start rounded-full border border-flame-400/30 bg-flame-400/10 px-3 py-1.5 text-xs tracking-wider uppercase text-flame-400 hover:bg-flame-400/20 sm:self-auto"
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
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Grade do dia</h2>
                <p className="mt-1 text-sm text-cream/50">
                  Cada profissional tem a propria grade. Clique para bloquear ou liberar.
                </p>
              </div>
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                <select
                  value={professionalId}
                  onChange={(e) => setProfessionalId(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-ink-800/80 px-4 py-2 outline-none backdrop-blur-md focus:border-gold-400 sm:w-auto"
                >
                  {professionals.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-ink-800/80 px-4 py-2 outline-none backdrop-blur-md focus:border-gold-400 sm:w-auto"
                />
              </div>
            </div>
            {selectedPro && (
              <p className="mb-4 text-xs uppercase tracking-wider text-cream/45">
                {selectedPro.name} · {selectedPro.openTime}–{selectedPro.closeTime} · intervalo {selectedPro.slotInterval} min
              </p>
            )}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {slots.map((slot) => {
                const booking = dayBookings.find((b) => b.time === slot.time && b.status === "confirmed");
                const tone = !slot.available
                  ? slot.reason === "blocked"
                    ? "border-amber-400/50 bg-amber-400/15 text-amber-200"
                    : slot.reason === "booked"
                      ? "border-gold-400/50 bg-gold-400/15 text-gold-200 shadow-gold"
                      : "border-white/5 bg-white/[0.02] text-white/25"
                  : "border-volt-400/40 bg-volt-400/10 text-volt-300 hover:border-volt-300 hover:shadow-volt";
                return (
                  <button
                    key={slot.time}
                    onClick={() => toggleSlot(slot.time, slot.available, slot.reason)}
                    className={`min-w-0 rounded-2xl border px-2 py-3 text-left transition sm:px-3 ${tone}`}
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

        {tab === "equipe" && settings && (
          <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Equipe</h2>
                <p className="mt-1 text-sm text-cream/50">Defina horarios e dias de cada profissional.</p>
              </div>
              <button
                type="button"
                onClick={addProfessional}
                className="rounded-full border border-gold-400/40 bg-gold-400/10 px-4 py-2 text-xs font-semibold tracking-wider uppercase text-gold-300"
              >
                Adicionar
              </button>
            </div>
            {settings.professionals.map((p) => (
              <div key={p.id} className="glass-panel grid gap-4 rounded-2xl border border-white/10 p-4 sm:rounded-3xl sm:p-6">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label>
                    <span className="mb-2 block text-xs font-semibold tracking-widest uppercase text-gold-400">Nome</span>
                    <input
                      value={p.name}
                      onChange={(e) => updateProfessional(p.id, { name: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 outline-none focus:border-gold-400"
                    />
                  </label>
                  <label>
                    <span className="mb-2 block text-xs font-semibold tracking-widest uppercase text-gold-400">Funcao</span>
                    <input
                      value={p.role}
                      onChange={(e) => updateProfessional(p.id, { role: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 outline-none focus:border-gold-400"
                    />
                  </label>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <label>
                    <span className="mb-2 block text-xs font-semibold tracking-widest uppercase text-gold-400">Abre</span>
                    <input
                      type="time"
                      value={p.openTime}
                      onChange={(e) => updateProfessional(p.id, { openTime: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 outline-none focus:border-gold-400"
                    />
                  </label>
                  <label>
                    <span className="mb-2 block text-xs font-semibold tracking-widest uppercase text-gold-400">Fecha</span>
                    <input
                      type="time"
                      value={p.closeTime}
                      onChange={(e) => updateProfessional(p.id, { closeTime: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 outline-none focus:border-gold-400"
                    />
                  </label>
                  <label>
                    <span className="mb-2 block text-xs font-semibold tracking-widest uppercase text-gold-400">Intervalo</span>
                    <select
                      value={p.slotInterval}
                      onChange={(e) => updateProfessional(p.id, { slotInterval: Number(e.target.value) })}
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
                  <span className="mb-2 block text-xs font-semibold tracking-widest uppercase text-gold-400">Folga</span>
                  <div className="flex flex-wrap gap-2">
                    {WEEK.map((d) => {
                      const on = p.closedDays.includes(d.id);
                      return (
                        <button
                          type="button"
                          key={d.id}
                          onClick={() => {
                            const next = on
                              ? p.closedDays.filter((x) => x !== d.id)
                              : [...p.closedDays, d.id];
                            updateProfessional(p.id, { closedDays: next });
                          }}
                          className={`rounded-full border px-3 py-1.5 text-xs ${
                            on
                              ? "border-gold-400 bg-gradient-to-r from-gold-300 to-gold-500 text-ink-950"
                              : "border-white/10 text-cream/60"
                          }`}
                        >
                          {d.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => updateProfessional(p.id, { active: !p.active })}
                    className={`rounded-full border px-4 py-2 text-xs font-semibold tracking-wider uppercase ${
                      p.active
                        ? "border-volt-400/40 bg-volt-400/10 text-volt-300"
                        : "border-white/10 text-cream/45"
                    }`}
                  >
                    {p.active ? "Ativo" : "Inativo"}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeProfessional(p.id)}
                    className="text-xs uppercase tracking-wider text-flame-400"
                  >
                    Remover
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={saveShop}
              className="btn-primary min-h-12 rounded-xl px-6 py-3 text-xs font-semibold tracking-wider uppercase text-ink-950"
            >
              Salvar equipe
            </button>
          </motion.section>
        )}

        {tab === "loja" && settings && (
          <motion.form
            onSubmit={saveShop}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel grid w-full max-w-xl gap-5 rounded-2xl border border-white/10 p-4 backdrop-blur-xl sm:rounded-3xl sm:p-6"
          >
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Funcionamento</h2>
            <label className="block">
              <span className="mb-2 block text-xs font-semibold tracking-widest uppercase text-gold-400">Nome da loja</span>
              <input
                value={settings.shopName}
                onChange={(e) => setSettings({ ...settings, shopName: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 outline-none focus:border-gold-400"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-semibold tracking-widest uppercase text-gold-400">Frase</span>
              <input
                value={settings.tagline}
                onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 outline-none focus:border-gold-400"
              />
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <label>
                <span className="mb-2 block text-xs font-semibold tracking-widest uppercase text-gold-400">Abre</span>
                <input
                  type="time"
                  value={settings.openTime}
                  onChange={(e) => setSettings({ ...settings, openTime: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 outline-none focus:border-gold-400"
                />
              </label>
              <label>
                <span className="mb-2 block text-xs font-semibold tracking-widest uppercase text-gold-400">Fecha</span>
                <input
                  type="time"
                  value={settings.closeTime}
                  onChange={(e) => setSettings({ ...settings, closeTime: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 outline-none focus:border-gold-400"
                />
              </label>
              <label>
                <span className="mb-2 block text-xs font-semibold tracking-widest uppercase text-gold-400">Intervalo</span>
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
              <span className="mb-2 block text-xs font-semibold tracking-widest uppercase text-gold-400">Dias fechados</span>
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
                        on
                          ? "border-gold-400 bg-gradient-to-r from-gold-300 to-gold-500 text-ink-950"
                          : "border-white/10 text-cream/60"
                      }`}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <label className="block">
              <span className="mb-2 block text-xs font-semibold tracking-widest uppercase text-gold-400">Novo PIN (opcional)</span>
              <input
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                placeholder="Deixe vazio para manter"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 outline-none focus:border-gold-400"
              />
            </label>
            <button className="btn-primary min-h-12 rounded-xl py-3 text-xs font-semibold tracking-wider uppercase text-ink-950">
              Salvar
            </button>
          </motion.form>
        )}
      </div>
    </main>
  );
}
