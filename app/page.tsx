"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Logo from "@/components/Logo";
import BookingForm from "@/components/BookingForm";
import { Service } from "@/lib/types";

type PublicSettings = {
  shopName: string;
  tagline: string;
  closedDays: number[];
  services: Service[];
  openTime: string;
  closeTime: string;
};

export default function HomePage() {
  const [settings, setSettings] = useState<PublicSettings | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then(setSettings)
      .catch(() => {
        setSettings({
          shopName: "Lamina",
          tagline: "Corte, barba e ritual.",
          closedDays: [0],
          services: [],
          openTime: "09:00",
          closeTime: "19:00",
        });
      });
  }, []);

  return (
    <main className="relative min-h-dvh overflow-x-hidden bg-mesh pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div className="orb pointer-events-none absolute -left-24 top-0 h-[280px] w-[280px] rounded-full bg-gold-400/20 blur-3xl sm:-left-32 sm:h-[560px] sm:w-[560px]" />
      <div className="orb orb-delay pointer-events-none absolute -right-16 bottom-0 h-[220px] w-[220px] rounded-full bg-volt-400/15 blur-3xl sm:-right-24 sm:h-[460px] sm:w-[460px]" />
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-[180px] w-[180px] -translate-x-1/2 rounded-full bg-gold-600/15 blur-3xl sm:h-[280px] sm:w-[280px]" />

      <header className="page-shell flex items-center justify-between gap-3 py-4 sm:py-6">
        <Logo />
        <Link
          href="/dono"
          className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-semibold tracking-wider uppercase text-cream/70 backdrop-blur-md transition hover:border-gold-400/60 hover:text-gold-300 sm:px-4 sm:text-xs"
        >
          Area do dono
        </Link>
      </header>

      <section className="page-shell grid items-start gap-8 pb-8 pt-2 sm:gap-10 sm:pt-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center lg:gap-12 lg:pt-10">
        <div className="min-w-0">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex max-w-full items-center gap-2 rounded-full border border-gold-400/30 bg-gold-400/10 px-3 py-1 text-[10px] font-semibold tracking-widest uppercase text-gold-300 sm:text-xs"
          >
            Barbearia contemporanea
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="mt-4 break-words font-display font-extrabold leading-[0.92] tracking-tight text-cream"
            style={{ fontSize: "clamp(2.5rem, 8vw + 1rem, 6rem)" }}
          >
            {settings?.shopName || "Lamina"}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
            className="mt-4 max-w-md text-sm leading-relaxed text-cream/70 sm:mt-6 sm:text-base"
          >
            {settings?.tagline || "Corte, barba e ritual."} Escolha o servico, o dia e o horario. Sem ligar, sem esperar.
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.28 }}
            className="mt-6 flex flex-wrap gap-2 text-[10px] font-semibold tracking-wider uppercase sm:mt-8 sm:gap-3 sm:text-xs"
          >
            <span className="rounded-full border border-volt-400/30 bg-volt-400/10 px-3 py-1.5 text-volt-300">
              Abre {settings?.openTime || "09:00"}
            </span>
            <span className="rounded-full border border-gold-600/40 bg-gold-600/15 px-3 py-1.5 text-gold-300">
              Fecha {settings?.closeTime || "19:00"}
            </span>
            <span className="rounded-full border border-gold-400/30 bg-gold-400/10 px-3 py-1.5 text-gold-300">
              Horarios em tempo real
            </span>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.5 }}
          className="glass-panel min-w-0 rounded-2xl border border-white/10 p-4 backdrop-blur-xl sm:rounded-3xl sm:p-6 lg:p-7"
        >
          {settings ? (
            <BookingForm services={settings.services} closedDays={settings.closedDays} />
          ) : (
            <div className="h-[min(480px,70dvh)] animate-pulse rounded-2xl bg-white/5" />
          )}
        </motion.div>
      </section>
    </main>
  );
}
