"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Service, Slot } from "@/lib/types";

type Props = {
  services: Service[];
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

export default function BookingForm({ services, closedDays }: Props) {
  const dates = useMemo(
    () => Array.from({ length: 14 }, (_, i) => isoFromOffset(i)),
    []
  );
  const [serviceId, setServiceId] = useState(services[0]?.id || "");
  const [date, setDate] = useState(dates[0].iso);
  const [time, setTime] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState<{ name: string; date: string; time: string; service: string } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setTime("");
    fetch(`/api/slots?date=${date}`)
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
  }, [date]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!time) {
      setError("Escolha um horario.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, serviceId, date, time }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Nao foi possivel agendar.");
        return;
      }
      const service = services.find((s) => s.id === serviceId);
      setDone({
        name,
        date,
        time,
        service: service?.name || "",
      });
      setName("");
      setPhone("");
      setTime("");
      const refreshed = await fetch(`/api/slots?date=${date}`).then((r) => r.json());
      setSlots(refreshed.slots || []);
    } finally {
      setSaving(false);
    }
  }

  const selectedService = services.find((s) => s.id === serviceId);

  return (
    <div className="relative">
      <AnimatePresence>
        {done && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-ink-900/95 p-8 text-center backdrop-blur-sm"
          >
            <motion.div
              initial={{ y: 24, opacity: 0, scale: 0.96 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 220, damping: 22 }}
              className="max-w-sm"
            >
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-gold-400 text-gold-400">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </div>
              <p className="font-display text-4xl text-cream">Agendado</p>
              <p className="mt-3 text-sm leading-relaxed text-cream/70">
                {done.name}, seu {done.service.toLowerCase()} esta marcado para {done.date.split("-").reverse().join("/")} as {done.time}.
              </p>
              <button
                onClick={() => setDone(null)}
                className="mt-7 border border-gold-400 px-6 py-2 text-xs tracking-[0.22em] uppercase text-gold-400 transition hover:bg-gold-400 hover:text-ink-950"
              >
                Novo agendamento
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={onSubmit} className="space-y-8">
        <section>
          <p className="mb-4 text-xs tracking-[0.28em] uppercase text-gold-400">Servico</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {services.map((s) => {
              const active = s.id === serviceId;
              return (
                <motion.button
                  key={s.id}
                  type="button"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setServiceId(s.id)}
                  className={`rounded-xl border p-4 text-left transition ${
                    active
                      ? "border-gold-400 bg-gold-400/10 shadow-gold"
                      : "border-white/10 bg-white/[0.03] hover:border-white/25"
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-display text-xl text-cream">{s.name}</span>
                    <span className="text-sm text-gold-400">R$ {s.price}</span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-cream/55">{s.description}</p>
                  <p className="mt-2 text-[11px] tracking-wider uppercase text-cream/40">{s.duration} min</p>
                </motion.button>
              );
            })}
          </div>
        </section>

        <section>
          <p className="mb-4 text-xs tracking-[0.28em] uppercase text-gold-400">Dia</p>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {dates.map((d) => {
              const closed = closedDays.includes(d.weekday);
              const active = d.iso === date;
              return (
                <button
                  key={d.iso}
                  type="button"
                  disabled={closed}
                  onClick={() => setDate(d.iso)}
                  className={`min-w-[68px] rounded-xl border px-3 py-3 text-center transition ${
                    closed
                      ? "cursor-not-allowed border-white/5 text-white/20"
                      : active
                        ? "border-gold-400 bg-gold-400 text-ink-950"
                        : "border-white/10 hover:border-gold-400/50"
                  }`}
                >
                  <div className="text-[10px] tracking-widest uppercase">{WEEK[d.weekday]}</div>
                  <div className="font-display text-2xl leading-none">{d.day}</div>
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <p className="mb-4 text-xs tracking-[0.28em] uppercase text-gold-400">Horario</p>
          {loading ? (
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="h-11 animate-pulse rounded-lg bg-white/5" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
              {slots.map((slot) => {
                const active = slot.time === time;
                return (
                  <motion.button
                    key={slot.time}
                    type="button"
                    disabled={!slot.available}
                    whileTap={slot.available ? { scale: 0.96 } : undefined}
                    onClick={() => setTime(slot.time)}
                    className={`h-11 rounded-lg border text-sm tracking-wide transition ${
                      !slot.available
                        ? "cursor-not-allowed border-white/5 text-white/20 line-through"
                        : active
                          ? "border-gold-400 bg-gold-400 text-ink-950"
                          : "border-white/10 hover:border-gold-400 hover:text-gold-300"
                    }`}
                  >
                    {slot.time}
                  </motion.button>
                );
              })}
            </div>
          )}
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-xs tracking-[0.28em] uppercase text-gold-400">Nome</span>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome"
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 outline-none transition placeholder:text-white/25 focus:border-gold-400"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-xs tracking-[0.28em] uppercase text-gold-400">WhatsApp</span>
            <input
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(11) 99999-0000"
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 outline-none transition placeholder:text-white/25 focus:border-gold-400"
            />
          </label>
        </section>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <motion.button
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.99 }}
          disabled={saving}
          className="w-full rounded-xl bg-gold-400 py-4 text-sm tracking-[0.28em] uppercase text-ink-950 transition hover:bg-gold-300 disabled:opacity-50"
        >
          {saving ? "Reservando..." : `Confirmar ${selectedService ? selectedService.name : ""}`}
        </motion.button>
      </form>
    </div>
  );
}
