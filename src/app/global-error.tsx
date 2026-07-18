"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <html lang="pt-BR"><body><main style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#100d09", color: "#f5f2ea", padding: 24 }}><section style={{ maxWidth: 460, textAlign: "center" }}><h1>O Apex encontrou um erro</h1><p style={{ color: "#b8ae9d", lineHeight: 1.6 }}>Atualize a página ou tente novamente. Seus dados já salvos permanecem na sua conta.</p><button onClick={reset} style={{ marginTop: 16, minHeight: 44, border: 0, borderRadius: 12, padding: "0 18px", background: "#e3ad52", color: "#181108", fontWeight: 700 }}>Tentar novamente</button></section></main></body></html>;
}
