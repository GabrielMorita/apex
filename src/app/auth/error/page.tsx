import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";

export default function AuthErrorPage() {
  return (
    <AuthShell eyebrow="Não foi possível confirmar" title="Link inválido ou expirado" description="Solicite um novo link e tente novamente.">
      <div className="text-center">
        <AlertTriangle size={30} className="mx-auto text-amber-300" />
        <div className="mt-5 grid gap-2">
          <Link href="/entrar" className="apex-button-primary">Voltar para o login</Link>
          <Link href="/recuperar-senha" className="apex-button-secondary">Recuperar senha</Link>
        </div>
      </div>
    </AuthShell>
  );
}
