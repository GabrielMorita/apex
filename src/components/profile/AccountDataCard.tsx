"use client";

import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import { CheckCircle2, Database, Download, LoaderCircle, Trash2 } from "lucide-react";
import { CollapsibleCard, TextInput, friendlyProfileError } from "@/components/profile/ProfileFields";
import { buildAccountExport, deleteAccount, downloadAccountExport } from "@/lib/account/service";
import { createClient } from "@/lib/supabase/client";

type ActionStatus = "idle" | "loading" | "success" | "error";

function clearUserCache(userId: string) {
  for (let index = localStorage.length - 1; index >= 0; index -= 1) {
    const key = localStorage.key(index);
    if (key?.endsWith(`::${userId}`)) localStorage.removeItem(key);
  }
}

export default function AccountDataCard({ user }: { user: User }) {
  const [exportStatus, setExportStatus] = useState<ActionStatus>("idle");
  const [exportError, setExportError] = useState("");
  const [deleteStatus, setDeleteStatus] = useState<ActionStatus>("idle");
  const [deleteError, setDeleteError] = useState("");
  const [confirmation, setConfirmation] = useState("");

  async function exportData() {
    setExportStatus("loading");
    setExportError("");
    try {
      downloadAccountExport(await buildAccountExport(user));
      setExportStatus("success");
      window.setTimeout(() => setExportStatus("idle"), 3500);
    } catch (error) {
      setExportError(friendlyProfileError(error));
      setExportStatus("error");
    }
  }

  async function removeAccount() {
    if (confirmation !== "EXCLUIR") return;
    if (!window.confirm("Esta ação é permanente. Excluir definitivamente sua conta e os dados associados?")) return;
    setDeleteStatus("loading");
    setDeleteError("");
    try {
      await deleteAccount();
      clearUserCache(user.id);
      await createClient().auth.signOut({ scope: "local" });
      window.location.assign("/entrar?conta=excluida");
    } catch (error) {
      const raw = error instanceof Error ? error.message.toLowerCase() : "";
      setDeleteError(raw.includes("active_subscription") ? "Cancele a renovação da assinatura em Assinatura antes de excluir a conta. Isso evita cobranças sem uma conta ativa." : raw.includes("edge function") || raw.includes("functions") ? "A função de exclusão ainda não foi publicada no Supabase. Siga as instruções da versão v0.11.0." : friendlyProfileError(error));
      setDeleteStatus("error");
    }
  }

  return (
    <CollapsibleCard title="Dados e exclusão da conta" icon={Database} defaultOpen={false}>
      <div className="space-y-5">
        <div>
          <p className="text-[11px] font-medium text-apex-white">Exportar meus dados</p>
          <p className="mb-3 mt-1 text-[10px] leading-relaxed text-apex-faint">Baixa um JSON com conta, Perfil, saúde, dieta, treino, produtividade, cobrança, privacidade e relação de arquivos privados.</p>
          <button type="button" onClick={() => void exportData()} disabled={exportStatus === "loading"} className="flex items-center gap-2 rounded-lg bg-gold px-4 py-2.5 text-[12px] font-medium text-apex-bg disabled:opacity-50">
            {exportStatus === "loading" ? <LoaderCircle size={13} className="animate-spin" /> : <Download size={13} />} {exportStatus === "loading" ? "Preparando..." : "Baixar meus dados"}
          </button>
          {exportStatus === "success" && <p className="mt-2 flex items-center gap-1.5 text-[10px] text-emerald-400"><CheckCircle2 size={12} />Arquivo exportado.</p>}
          {exportStatus === "error" && <p role="alert" className="mt-2 text-[10px] text-red-300">{exportError}</p>}
        </div>

        <div className="border-t border-red-400/15 pt-4">
          <div className="rounded-xl border border-red-400/20 bg-red-400/5 p-4">
            <div className="flex items-start gap-3"><Trash2 size={15} className="mt-0.5 shrink-0 text-red-300" /><div><p className="text-[11px] font-medium text-red-200">Excluir conta definitivamente</p><p className="mt-1 text-[10px] leading-relaxed text-red-200/70">Remove o usuário, Perfil, histórico, dados sincronizados e avatar. Esta ação não pode ser desfeita. Exporte seus dados antes, se desejar.</p></div></div>
            <div className="mt-3 max-w-xs"><p className="mb-1.5 text-[9px] uppercase tracking-wider text-red-200/60">Digite EXCLUIR para confirmar</p><TextInput value={confirmation} onChange={(event) => { setConfirmation(event.target.value.toUpperCase()); setDeleteStatus("idle"); }} placeholder="EXCLUIR" className="border-red-400/25" /></div>
            <button type="button" onClick={() => void removeAccount()} disabled={confirmation !== "EXCLUIR" || deleteStatus === "loading"} className="mt-3 flex items-center gap-2 rounded-lg border border-red-400/35 bg-red-400/10 px-4 py-2.5 text-[11px] font-semibold text-red-200 hover:bg-red-400/15 disabled:cursor-not-allowed disabled:opacity-40">
              {deleteStatus === "loading" ? <LoaderCircle size={13} className="animate-spin" /> : <Trash2 size={13} />} {deleteStatus === "loading" ? "Excluindo..." : "Excluir minha conta"}
            </button>
            {deleteStatus === "error" && <p role="alert" className="mt-2 text-[10px] text-red-300">{deleteError}</p>}
          </div>
        </div>
      </div>
    </CollapsibleCard>
  );
}
