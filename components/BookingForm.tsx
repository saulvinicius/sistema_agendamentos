"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Professional, Service, Slot } from "@/lib/types";

type Props = {
  services: Service[];
  professionals: Professional[];
  closedDays: number[];
};

const WEEK = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];

function isoFromOffset(offset: number) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return { iso: `${y}-${m}-${day}`, day: d.getDate(), weekday: d.getDay() };
}

export default function BookingForm({ services, professionals, closedDays }: Props) {
  const activePros = useMemo(
    () => professionals.filter((p) => p.active),
    [professionals]
  );
  const dates = useMemo(
    () => Array.from({ length: 14 }, (_, i) => isoFromOffset(i)),
    []
  );
  const [professionalId, setProfessionalId] = useState(activePros[0]?.id || "");
  const [serviceId, setServiceId] = useState(services[0]?.id || "");
  const [date, setDate] = useState(dates[0].iso);
  const [time, setTime] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState<{
    name: string;
    date: string;
    time: string;
    service: string;
    professional: string;
  } | null>(null);
  const [error, setError] = useState("");

  const selectedProfessional = activePros.find((p) => p.id === professionalId) || activePros[0];

  useEffect(() => {
    if (!professionalId && activePros[0]) setProfessionalId(activePros[0].id);
  }, [activePros, professionalId]);

  useEffect(() => {
    if (!professionalId) return;
    let ignore = false;
    setLoading(true);
    setTime("");
    fetch(`/api/slots?date=${date}&professionalId=${encodeURIComponent(professionalId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!ignore) setSlots(data.slots || []);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [date, professionalId]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!professionalId) {
      setError("Escolha um profissional.");
      return;
    }
    if (!time) {
      setError("Escolha um horario.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, serviceId, professionalId, date, time }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Nao foi possivel agendar.");
        return;
      }
      const service = services.find((s) => s.id === serviceId);
      const professional = activePros.find((p) => p.id === professionalId);
      setDone({
        name,
        date,
        time,
        service: service?.name || "",
        professional: professional?.name || "",
      });
      setName("");
      setPhone("");
      setTime("");
      const refreshed = await fetch(
        `/api/slots?date=${date}&professionalId=${encodeURIComponent(professionalId)}`
      ).then((r) => r.json());
      setSlots(refreshed.slots || []);
    } finally {
      setSaving(false);
    }
  }

  const selectedService = services.find((s) => s.id === serviceId);

  return (
    <div className="relative min-w-0">
      <AnimatePresence>
        {done && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-ink-900/95 p-5 text-center backdrop-blur-sm sm:p-8"
          >
            <motion.div
              initial={{ y: 24, opacity: 0, scale: 0.96 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 220, damping: 22 }}
              className="w-full max-w-sm px-1"
            >
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-volt-400 bg-volt-400/10 text-volt-400 shadow-volt sm:h-16 sm:w-16">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </div>
              <p className="font-display text-3xl font-bold tracking-tight text-cream sm:text-4xl">Agendado</p>
              <p className="mt-3 text-sm leading-relaxed text-cream/70">
                {done.name}, seu {done.service.toLowerCase()} com {done.professional} esta marcado para {done.date.split("-").reverse().join("/")} as {done.time}.
              </p>
              <button
                onClick={() => setDone(null)}
                className="mt-7 min-h-11 rounded-full border border-gold-400 px-6 py-2 text-xs font-semibold tracking-wider uppercase text-gold-400 transition hover:bg-gold-400 hover:text-ink-950"
              >
                Novo agendamento
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={onSubmit} className="space-y-6 sm:space-y-8">
        <section>
          <p className="mb-3 text-xs font-semibold tracking-widest uppercase text-gold-400 sm:mb-4">Profissional</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {activePros.map((p) => {
              const active = p.id === professionalId;
              return (
                <motion.button
                  key={p.id}
                  type="button"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setProfessionalId(p.id)}
                  className={`min-h-11 rounded-2xl border p-3 text-left transition sm:p-4 ${
                    active
                      ? "border-gold-400 bg-gold-400/15 shadow-gold"
                      : "border-white/10 bg-white/[0.04] hover:border-volt-400/40 hover:bg-white/[0.07]"
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="min-w-0 truncate font-display text-lg font-semibold tracking-tight text-cream sm:text-xl">{p.name}</span>
                    <span className={`shrink-0 text-[11px] uppercase tracking-wider ${active ? "text-gold-300" : "text-volt-400"}`}>
                      {p.openTime}–{p.closeTime}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-cream/55">{p.role}</p>
                </motion.button>
              );
            })}
          </div>
        </section>

        <section>
          <p className="mb-3 text-xs font-semibold tracking-widest uppercase text-gold-400 sm:mb-4">Servico</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {services.map((s) => {
              const active = s.id === serviceId;
              return (
                <motion.button
                  key={s.id}
                  type="button"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setServiceId(s.id)}
                  className={`min-h-11 rounded-2xl border p-3 text-left transition sm:p-4 ${
                    active
                      ? "border-gold-400 bg-gold-400/15 shadow-gold"
                      : "border-white/10 bg-white/[0.04] hover:border-volt-400/40 hover:bg-white/[0.07]"
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="min-w-0 truncate font-display text-lg font-semibold tracking-tight text-cream sm:text-xl">{s.name}</span>
                    <span className={`shrink-0 text-sm ${active ? "text-gold-300" : "text-volt-400"}`}>R$ {s.price}</span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-cream/55">{s.description}</p>
                  <p className="mt-2 text-[11px] tracking-wider uppercase text-cream/40">{s.duration} min</p>
                </motion.button>
              );
            })}
          </div>
        </section>

        <section className="min-w-0">
          <p className="mb-3 text-xs font-semibold tracking-widest uppercase text-gold-400 sm:mb-4">Dia</p>
          <div className="day-scroll max-w-full">
            <div className="flex w-max min-w-full gap-2 pb-3">
              {dates.map((d) => {
                const shopClosed = closedDays.includes(d.weekday);
                const proClosed = selectedProfessional?.closedDays.includes(d.weekday);
                const closed = shopClosed || Boolean(proClosed);
                const active = d.iso === date;
                return (
                  <button
                    key={d.iso}
                    type="button"
                    disabled={closed}
                    onClick={() => setDate(d.iso)}
                    className={`h-[4.5rem] w-[4.5rem] shrink-0 rounded-2xl border px-2 py-3 text-center transition ${
                      closed
                        ? "cursor-not-allowed border-white/5 text-white/20"
                        : active
                          ? "border-gold-400 bg-gradient-to-b from-gold-300 to-gold-500 text-ink-950 shadow-gold"
                          : "border-white/10 bg-white/[0.03] hover:border-gold-400/50 hover:bg-gold-400/5"
                    }`}
                  >
                    <div className="text-[10px] tracking-widest uppercase">{WEEK[d.weekday]}</div>
                    <div className="font-display text-2xl leading-none">{d.day}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section>
          <p className="mb-3 text-xs font-semibold tracking-widest uppercase text-gold-400 sm:mb-4">Horario</p>
          {loading ? (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="h-11 animate-pulse rounded-xl bg-white/5" />
              ))}
            </div>
          ) : slots.length === 0 ? (
            <p className="text-sm text-cream/50">Nenhum horario neste dia para este profissional.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
              {slots.map((slot) => {
                const active = slot.time === time;
                return (
                  <motion.button
                    key={slot.time}
                    type="button"
                    disabled={!slot.available}
                    whileTap={slot.available ? { scale: 0.96 } : undefined}
                    onClick={() => setTime(slot.time)}
                    className={`h-11 min-w-0 rounded-xl border text-sm tracking-wide transition ${
                      !slot.available
                        ? "cursor-not-allowed border-white/5 text-white/20 line-through"
                        : active
                          ? "border-gold-400 bg-gradient-to-b from-gold-300 to-gold-500 text-ink-950 shadow-gold"
                          : "border-white/10 bg-white/[0.03] hover:border-volt-400 hover:text-volt-300"
                    }`}
                  >
                    {slot.time}
                  </motion.button>
                );
              })}
            </div>
          )}
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block min-w-0">
            <span className="mb-2 block text-xs font-semibold tracking-widest uppercase text-gold-400">Nome</span>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome"
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 outline-none transition placeholder:text-white/25 focus:border-gold-400 focus:shadow-gold"
            />
          </label>
          <label className="block min-w-0">
            <span className="mb-2 block text-xs font-semibold tracking-widest uppercase text-gold-400">WhatsApp</span>
            <input
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(11) 99999-0000"
              inputMode="tel"
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 outline-none transition placeholder:text-white/25 focus:border-gold-400 focus:shadow-gold"
            />
          </label>
        </section>

        {error && <p className="text-sm text-flame-400">{error}</p>}

        <motion.button
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.99 }}
          disabled={saving}
          className="btn-primary min-h-12 w-full rounded-xl py-3 text-sm font-semibold tracking-wider uppercase text-ink-950 transition disabled:opacity-50 sm:py-4"
        >
          {saving ? "Reservando..." : `Confirmar ${selectedService ? selectedService.name : ""}`}
        </motion.button>
      </form>
    </div>
  );
}
