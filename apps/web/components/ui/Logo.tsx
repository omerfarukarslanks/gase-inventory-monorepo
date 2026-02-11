export default function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary to-accent shadow-glow flex items-center justify-center">
        <svg width="24" height="24" viewBox="0 0 32 32" fill="none" className="text-white">
          <rect x="2" y="6" width="3" height="20" rx="1" fill="currentColor" />
          <rect x="7" y="6" width="1.5" height="20" rx="0.5" fill="currentColor" opacity="0.7" />
          <rect x="10.5" y="6" width="3" height="20" rx="1" fill="currentColor" />
          <rect x="15.5" y="6" width="1.5" height="20" rx="0.5" fill="currentColor" opacity="0.5" />
          <rect x="19" y="6" width="2" height="20" rx="0.5" fill="currentColor" opacity="0.8" />
          <rect x="23" y="6" width="3" height="20" rx="1" fill="currentColor" />
          <rect x="28" y="6" width="1.5" height="20" rx="0.5" fill="currentColor" opacity="0.6" />
        </svg>
      </div>
      <div>
        <div className="text-[22px] font-bold leading-tight tracking-tight">StockPulse</div>
        <div className="mt-0.5 text-[10px] font-medium tracking-[0.25em] uppercase text-muted">
          Stok Yönetim Sistemi
        </div>
      </div>
    </div>
  );
}
