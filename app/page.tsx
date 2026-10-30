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
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute -left-32 top-0 h-[520px] w-[520px] rounded-full bg-gold-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-[420px] w-[420px] rounded-full bg-gold-600/10 blur-3xl" />

      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Logo />
        <Link
          href="/dono"
          className="text-xs tracking-[0.22em] uppercase text-cream/50 transition hover:text-gold-400"
        >
          Area do dono
        </Link>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-8 pt-4 lg:grid-cols-[1.05fr_0.95fr] lg:pt-10">
        <div>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs tracking-[0.4em] uppercase text-gold-400"
          >
            Barbearia contemporanea
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="mt-4 font-display text-6xl leading-[0.9] text-cream sm:text-7xl lg:text-8xl"
          >
            {settings?.shopName || "Lamina"}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
            className="mt-6 max-w-md text-base leading-relaxed text-cream/65"
          >
            {settings?.tagline || "Corte, barba e ritual."} Escolha o servico, o dia e o horario. Sem ligar, sem esperar.
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.28 }}
            className="mt-8 flex flex-wrap gap-6 text-xs tracking-[0.2em] uppercase text-cream/45"
          >
            <span>Abre {settings?.openTime || "09:00"}</span>
            <span>Fecha {settings?.closeTime || "19:00"}</span>
            <span>Horarios em tempo real</span>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.5 }}
          className="rounded-2xl border border-white/10 bg-ink-800/80 p-5 shadow-lift backdrop-blur-md sm:p-7"
        >
          {settings ? (
            <BookingForm services={settings.services} closedDays={settings.closedDays} />
          ) : (
            <div className="h-[480px] animate-pulse rounded-xl bg-white/5" />
          )}
        </motion.div>
      </section>
    </main>
  );
}
