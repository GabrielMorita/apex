import Link from "next/link";
import { AlertTriangle, ArrowLeft, ShieldCheck } from "lucide-react";
import BrandMark from "@/components/layout/BrandMark";
import { DATA_CONTROLLER_NAME, PRIVACY_CONTACT_EMAIL, PRIVACY_DOCUMENT_VERSION, type LegalDocumentContent } from "@/lib/privacy/documents";

export default function LegalDocumentPage({ document }: { document: LegalDocumentContent }) {
  const productionReady = Boolean(DATA_CONTROLLER_NAME && PRIVACY_CONTACT_EMAIL);
  return (
    <main className="min-h-screen bg-apex-bg px-4 py-8 text-apex-white sm:py-12">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <Link href="/" aria-label="Voltar ao Apex"><BrandMark /></Link>
          <Link href="/" className="flex items-center gap-2 text-[10px] font-semibold text-apex-muted hover:text-gold"><ArrowLeft size={13} />Voltar ao Apex</Link>
        </div>
        {!productionReady && <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-300/25 bg-amber-300/5 p-4 text-amber-100"><AlertTriangle size={16} className="mt-0.5 shrink-0" /><div><p className="text-[11px] font-semibold">Minuta para revisão profissional</p><p className="mt-1 text-[9px] leading-relaxed text-amber-100/75">Identidade do controlador e canal de privacidade precisam ser configurados antes do lançamento comercial.</p></div></div>}
        <article className="overflow-hidden rounded-2xl border border-apex-border bg-apex-card">
          <header className="border-b border-apex-border bg-apex-surface p-6 sm:p-8">
            <p className="flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-gold"><ShieldCheck size={14} />{document.eyebrow}</p>
            <h1 className="mt-3 text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">{document.title}</h1>
            <p className="mt-3 max-w-2xl text-[12px] leading-relaxed text-apex-muted">{document.summary}</p>
            <p className="mt-4 font-mono text-[8px] text-apex-faint">Versão {PRIVACY_DOCUMENT_VERSION} · vigente desde 18/07/2026</p>
          </header>
          <div className="space-y-7 p-6 sm:p-8">
            {document.sections.map((section) => <section key={section.title}><h2 className="text-[14px] font-semibold text-apex-white">{section.title}</h2>{section.paragraphs?.map((paragraph) => <p key={paragraph} className="mt-3 text-[11px] leading-6 text-apex-muted">{paragraph}</p>)}{section.bullets && <ul className="mt-3 space-y-2 pl-4 text-[11px] leading-5 text-apex-muted">{section.bullets.map((item) => <li key={item} className="list-disc pl-1 marker:text-gold">{item}</li>)}</ul>}</section>)}
          </div>
        </article>
        <nav className="mt-5 flex flex-wrap justify-center gap-4 text-[10px] text-apex-muted"><Link href="/termos" className="hover:text-gold">Termos de Uso</Link><Link href="/privacidade" className="hover:text-gold">Aviso de Privacidade</Link><Link href="/dados-saude" className="hover:text-gold">Dados de Saúde</Link><Link href="/suporte" className="hover:text-gold">Suporte</Link></nav>
      </div>
    </main>
  );
}
