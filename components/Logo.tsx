export default function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex min-w-0 items-center gap-2 sm:gap-3 ${className}`}>
      <svg className="h-8 w-8 shrink-0 sm:h-[38px] sm:w-[38px]" viewBox="0 0 38 38" fill="none" aria-hidden>
        <defs>
          <linearGradient id="logoStroke" x1="0" y1="0" x2="38" y2="38">
            <stop stopColor="#6ee7b7" />
            <stop offset="0.55" stopColor="#34d399" />
            <stop offset="1" stopColor="#4ade80" />
          </linearGradient>
        </defs>
        <rect x="1.5" y="1.5" width="35" height="35" rx="10" stroke="url(#logoStroke)" strokeWidth="1.6" />
        <path
          d="M11 27L19 9L27 27"
          stroke="url(#logoStroke)"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M14 21H24" stroke="url(#logoStroke)" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
      <span className="font-display truncate text-xl font-semibold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-gold-300 via-gold-400 to-volt-400 sm:text-2xl">
        Lamina
      </span>
    </div>
  );
}
