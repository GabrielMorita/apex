import { Mountain } from "lucide-react";

interface BrandMarkProps {
  compact?: boolean;
}

export default function BrandMark({ compact = false }: BrandMarkProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-control border border-line-accent bg-accent-subtle shadow-gold">
        <Mountain size={18} className="text-accent" strokeWidth={2.25} />
        <span className="absolute bottom-1 left-2 right-2 h-px bg-accent opacity-50" />
      </div>
      {!compact && (
        <div className="min-w-0">
          <p className="text-[14px] font-bold uppercase leading-none tracking-[0.24em] text-ink">Apex</p>
          <p className="mt-1.5 text-[8px] font-medium uppercase tracking-[0.19em] text-ink-muted">Sistema pessoal</p>
        </div>
      )}
    </div>
  );
}
