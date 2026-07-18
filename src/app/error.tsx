"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return <main className="flex min-h-screen items-center justify-center bg-apex-bg px-4 text-apex-white"><section className="apex-card max-w-md p-8 text-center"><p className="apex-kicker">Algo deu errado</p><h1 className="mt-3 text-2xl font-semibold">Não foi possível concluir esta ação</h1><p className="mt-3 text-sm text-apex-muted">Tente novamente. Se o problema persistir, fale com o suporte.</p><div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row"><button className="apex-button-primary" onClick={reset}>Tentar novamente</button><Link href="/suporte" className="apex-button-secondary">Abrir suporte</Link></div></section></main>;
}
