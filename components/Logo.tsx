export default function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg width="34" height="34" viewBox="0 0 34 34" fill="none" aria-hidden>
        <rect x="1" y="1" width="32" height="32" rx="4" stroke="#d4af37" strokeWidth="1.4" />
        <path
          d="M10 24.5L17 8.5L24 24.5"
          stroke="#d4af37"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M12.5 19H21.5" stroke="#d4af37" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <span className="font-display text-2xl tracking-[0.28em] uppercase text-gold-400">
        Lamina
      </span>
    </div>
  );
}
