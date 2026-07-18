import { Database, KeyRound, ShieldCheck } from "lucide-react";
import BrandMark from "@/components/layout/BrandMark";

export default function ConfigureSupabasePage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="apex-card-emphasis w-full max-w-2xl p-6 sm:p-8">
        <BrandMark />
        <p className="apex-kicker mb-3 mt-8 text-accent">Configuração necessária</p>
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-ink">Conecte o projeto ao Supabase</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">O Apex está em modo seguro e não libera as telas privadas sem as credenciais do backend.</p>

        <div className="mt-7 space-y-3">
          {[
            { Icon: Database, text: "Crie um projeto gratuito no Supabase." },
            { Icon: ShieldCheck, text: "Execute a migration SQL da pasta supabase/migrations." },
            { Icon: KeyRound, text: "Copie .env.example para .env.local e informe a URL e a Publishable Key." },
          ].map(({ Icon, text }, index) => (
            <div key={text} className="flex gap-3 rounded-card border border-line bg-surface p-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control border border-line-accent bg-accent-subtle text-accent"><Icon size={16} /></span>
              <div><p className="text-[10px] font-semibold uppercase tracking-[.14em] text-ink-faint">Passo {index + 1}</p><p className="mt-1 text-[13px] text-ink-secondary">{text}</p></div>
            </div>
          ))}
        </div>

        <p className="mt-6 rounded-control border border-line bg-surface px-3 py-2.5 font-mono text-[11px] text-ink-muted">Consulte o arquivo ETAPA_2_SUPABASE.md para o passo a passo completo.</p>
      </section>
    </main>
  );
}
