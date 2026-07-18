import Link from "next/link";
import { LifeBuoy, Mail } from "lucide-react";

const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || "";

export default function SupportPage() {
  return (
    <main className="min-h-screen bg-apex-bg px-4 py-12 text-apex-white">
      <section className="mx-auto max-w-xl rounded-card border border-apex-border bg-apex-surface-raised p-6 shadow-card sm:p-8">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-amber-300/20 bg-amber-300/10 text-gold"><LifeBuoy size={20} /></div>
        <p className="apex-kicker mt-5">Ajuda do Apex</p>
        <h1 className="mt-2 text-2xl font-semibold">Suporte</h1>
        <p className="mt-3 text-sm leading-relaxed text-apex-muted">Durante o beta, dúvidas, falhas e sugestões serão atendidas diretamente por e-mail.</p>
        {supportEmail ? (
          <a className="apex-button-primary mt-6 w-full sm:w-auto" href={`mailto:${supportEmail}?subject=Suporte%20Apex`}><Mail size={16} />Enviar e-mail para o suporte</a>
        ) : (
          <div className="mt-6 rounded-xl border border-amber-300/20 bg-amber-300/5 p-4 text-sm text-amber-100">O canal de suporte ainda não foi configurado. Defina <code className="text-xs">NEXT_PUBLIC_SUPPORT_EMAIL</code> antes de publicar o beta.</div>
        )}
        <nav className="mt-8 flex flex-wrap gap-4 text-xs text-apex-muted"><Link className="hover:text-gold" href="/entrar">Entrar</Link><Link className="hover:text-gold" href="/termos">Termos</Link><Link className="hover:text-gold" href="/privacidade">Privacidade</Link></nav>
      </section>
    </main>
  );
}
