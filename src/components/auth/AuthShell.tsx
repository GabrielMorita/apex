import Link from "next/link";
import BrandMark from "@/components/layout/BrandMark";

export default function AuthShell({
  eyebrow,
  title,
  description,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Link href="/" aria-label="Apex">
            <BrandMark />
          </Link>
        </div>

        <section className="apex-card-emphasis overflow-hidden p-6 sm:p-8">
          <p className="apex-kicker mb-3 text-accent">{eyebrow}</p>
          <h1 className="text-2xl font-semibold tracking-[-0.03em] text-ink sm:text-[28px]">{title}</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">{description}</p>
          <div className="mt-7">{children}</div>
        </section>

        {footer && <div className="mt-5 text-center text-[12px] text-ink-muted">{footer}</div>}
        <div className="mt-3 flex flex-wrap justify-center gap-4 text-[10px] text-ink-faint"><Link href="/termos" className="hover:text-accent">Termos</Link><Link href="/privacidade" className="hover:text-accent">Privacidade</Link><Link href="/dados-saude" className="hover:text-accent">Dados de saúde</Link><Link href="/suporte" className="hover:text-accent">Suporte</Link></div>
      </div>
    </main>
  );
}
