import Link from "next/link";

export default function NotFound() {
  return <main className="flex min-h-screen items-center justify-center bg-apex-bg px-4 text-apex-white"><section className="apex-card max-w-md p-8 text-center"><p className="apex-kicker">Erro 404</p><h1 className="mt-3 text-2xl font-semibold">Página não encontrada</h1><p className="mt-3 text-sm text-apex-muted">O endereço pode ter mudado ou não existir.</p><Link href="/" className="apex-button-primary mt-6">Voltar ao Apex</Link></section></main>;
}
