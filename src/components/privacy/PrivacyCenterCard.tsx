"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Download, ExternalLink, LoaderCircle, Save, Send, ShieldCheck } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { CollapsibleCard } from "@/components/profile/ProfileFields";
import { buildAccountExport, downloadAccountExport } from "@/lib/account/service";
import { DATA_CONTROLLER_NAME, PRIVACY_CONTACT_EMAIL } from "@/lib/privacy/documents";
import { friendlyPrivacyError, loadPrivacyCenter, recordPrivacyChoice, savePrivacyPreferences, submitPrivacyRequest } from "@/lib/privacy/service";
import type { PrivacyCenterState, PrivacyChoiceEvent, PrivacyDocumentType, PrivacyPreferences, PrivacyRequestType } from "@/lib/privacy/types";

const REQUEST_LABELS: Record<PrivacyRequestType, string> = {
  confirmation: "Confirmar tratamento",
  access: "Acessar meus dados",
  correction: "Corrigir dados",
  anonymization: "Anonimizar ou bloquear",
  deletion: "Eliminar dados",
  portability: "Solicitar portabilidade",
  sharing_information: "Saber com quem são compartilhados",
  consent_revocation: "Revogar consentimento",
  objection: "Apresentar oposição",
  automated_decision_review: "Revisar decisão automatizada",
  other: "Outro assunto",
};

const STATUS_LABELS = { received: "Recebida", in_review: "Em análise", waiting_user: "Aguardando você", completed: "Concluída", rejected: "Não atendida", canceled: "Cancelada" } as const;
const DOCUMENT_ORDER: PrivacyDocumentType[] = ["terms_of_use", "privacy_notice", "health_data_consent"];

export default function PrivacyCenterCard() {
  const { user, loading: authLoading } = useAuth();
  const [state, setState] = useState<PrivacyCenterState | null>(null);
  const [preferences, setPreferences] = useState<PrivacyPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState("idle");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [requestType, setRequestType] = useState<PrivacyRequestType>("sharing_information");
  const [requestDetails, setRequestDetails] = useState("");

  const reload = useCallback(async () => {
    if (!user) return;
    const loaded = await loadPrivacyCenter(user.id);
    setState(loaded);
    setPreferences(loaded.preferences);
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); setError("Sua sessão não está disponível."); return; }
    let active = true;
    setLoading(true); setError("");
    void loadPrivacyCenter(user.id).then((loaded) => { if (active) { setState(loaded); setPreferences(loaded.preferences); } }).catch((loadError) => { if (active) setError(friendlyPrivacyError(loadError)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [authLoading, user]);

  const documentStatus = useMemo(() => new Map((state?.documents ?? []).map((document) => {
    const latest = state?.consentEvents.find((event) => event.documentType === document.documentType);
    const validEvent = document.documentType === "privacy_notice" ? "acknowledged" : "accepted";
    return [document.documentType, latest?.documentVersion === document.version && latest.eventType === validEvent];
  })), [state]);

  async function choose(documentType: PrivacyDocumentType, eventType: PrivacyChoiceEvent) {
    if (action !== "idle") return;
    if (eventType === "withdrawn" && !window.confirm("Revogar o consentimento de dados de saúde? Isso pode limitar personalizações futuras. Para apagar dados existentes, use a exclusão ou envie uma solicitação.")) return;
    setAction(`choice:${documentType}`); setError(""); setNotice("");
    try {
      await recordPrivacyChoice(documentType, eventType);
      await reload();
      setNotice(eventType === "withdrawn" ? "Consentimento revogado e registrado." : "Sua escolha foi registrada com a versão atual.");
    } catch (choiceError) { setError(friendlyPrivacyError(choiceError)); }
    finally { setAction("idle"); }
  }

  async function savePreferences() {
    if (!user || !preferences || action !== "idle") return;
    setAction("preferences"); setError(""); setNotice("");
    try { await savePrivacyPreferences(user.id, preferences); await reload(); setNotice("Preferências opcionais salvas."); }
    catch (preferenceError) { setError(friendlyPrivacyError(preferenceError)); }
    finally { setAction("idle"); }
  }

  async function exportNow() {
    if (!user || action !== "idle") return;
    setAction("export"); setError(""); setNotice("");
    try { downloadAccountExport(await buildAccountExport(user)); setNotice("Cópia dos seus dados preparada."); }
    catch (exportError) { setError(friendlyPrivacyError(exportError)); }
    finally { setAction("idle"); }
  }

  async function sendRequest() {
    if (action !== "idle") return;
    setAction("request"); setError(""); setNotice("");
    try { await submitPrivacyRequest(requestType, requestDetails); setRequestDetails(""); await reload(); setNotice("Solicitação registrada. Você poderá acompanhar o estado nesta central."); }
    catch (requestError) { setError(friendlyPrivacyError(requestError)); }
    finally { setAction("idle"); }
  }

  return <CollapsibleCard title="Privacidade e dados pessoais" icon={ShieldCheck} defaultOpen={false}>
    {loading && <p className="flex items-center gap-2 text-[10px] text-apex-muted"><LoaderCircle size={13} className="animate-spin text-gold" />Carregando sua Central de Privacidade...</p>}
    {!loading && error && !state && <p role="alert" className="flex items-start gap-2 rounded-lg border border-red-400/20 bg-red-400/5 p-3 text-[9px] leading-relaxed text-red-300"><AlertCircle size={13} className="mt-0.5 shrink-0" />{error}</p>}
    {!loading && state && preferences && <div className="space-y-5">
      {(error || notice) && <p role={error ? "alert" : undefined} className={`flex items-start gap-2 rounded-lg border p-3 text-[9px] leading-relaxed ${error ? "border-red-400/20 bg-red-400/5 text-red-300" : "border-emerald-400/20 bg-emerald-400/5 text-emerald-300"}`}>{error ? <AlertCircle size={13} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={13} className="mt-0.5 shrink-0" />}{error || notice}</p>}

      <section><p className="text-[11px] font-semibold text-apex-white">Documentos e escolhas atuais</p><p className="mt-1 text-[9px] leading-relaxed text-apex-faint">Termos, ciência do aviso e consentimento de saúde são registrados por versão. O histórico não pode ser reescrito pelo navegador.</p><div className="mt-3 space-y-2">{DOCUMENT_ORDER.map((type) => { const document = state.documents.find((item) => item.documentType === type); if (!document) return null; const current = Boolean(documentStatus.get(type)); const latest = state.consentEvents.find((event) => event.documentType === type); return <div key={type} className="rounded-lg border border-apex-border bg-apex-surface p-3"><div className="flex flex-col gap-3 sm:flex-row sm:items-center"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-[10px] font-semibold text-apex-white">{document.title}</p><span className={`rounded-full border px-2 py-0.5 text-[7px] font-semibold uppercase ${current ? "border-emerald-400/20 text-emerald-300" : "border-amber-300/20 text-amber-200"}`}>{current ? "Atual" : latest?.eventType === "withdrawn" ? "Revogado" : "Pendente"}</span></div><p className="mt-1 font-mono text-[7px] text-apex-faint">Versão {document.version}{latest ? ` · última escolha em ${formatDate(latest.createdAt)}` : ""}</p><Link href={document.publicPath} target="_blank" className="mt-2 inline-flex items-center gap-1 text-[8px] font-semibold text-gold hover:text-amber-300">Ler documento <ExternalLink size={9} /></Link></div><div className="flex shrink-0 gap-2">{!current && <button type="button" disabled={action !== "idle"} onClick={() => void choose(type, type === "privacy_notice" ? "acknowledged" : "accepted")} className="apex-button-primary min-h-9 px-3 text-[9px]">{action === `choice:${type}` ? <LoaderCircle size={11} className="animate-spin" /> : null}{type === "privacy_notice" ? "Registrar ciência" : "Aceitar versão"}</button>}{type === "health_data_consent" && current && <button type="button" disabled={action !== "idle"} onClick={() => void choose(type, "withdrawn")} className="apex-button-secondary min-h-9 px-3 text-[9px]">Revogar</button>}</div></div></div>; })}</div></section>

      <section className="border-t border-apex-border pt-4"><p className="text-[11px] font-semibold text-apex-white">Usos opcionais</p><p className="mt-1 text-[9px] leading-relaxed text-apex-faint">Esses usos começam desativados. A versão atual ainda não envia marketing, pesquisa ou análise opcional; as escolhas preparam um controle explícito para futuras ativações.</p><div className="mt-3 space-y-2"><PreferenceToggle label="Atualizações de produto" description="Novidades não essenciais sobre o Apex." checked={preferences.productUpdatesEnabled} onChange={(value) => setPreferences({ ...preferences, productUpdatesEnabled: value })} /><PreferenceToggle label="Análise anônima de uso" description="Métricas opcionais para melhorar o produto, sem conteúdo pessoal." checked={preferences.anonymousUsageAnalyticsEnabled} onChange={(value) => setPreferences({ ...preferences, anonymousUsageAnalyticsEnabled: value })} /><PreferenceToggle label="Convites para pesquisa" description="Contato opcional para entrevistas e testes de produto." checked={preferences.researchParticipationEnabled} onChange={(value) => setPreferences({ ...preferences, researchParticipationEnabled: value })} /></div><button type="button" disabled={action !== "idle"} onClick={() => void savePreferences()} className="apex-button-secondary mt-3 min-h-9 px-3 text-[9px]"><Save size={11} />{action === "preferences" ? "Salvando..." : "Salvar preferências"}</button></section>

      <section className="border-t border-apex-border pt-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-[11px] font-semibold text-apex-white">Seus direitos</p><p className="mt-1 text-[9px] leading-relaxed text-apex-faint">A exportação oferece acesso imediato. Outras solicitações ficam registradas para atendimento autenticado.</p></div><button type="button" disabled={action !== "idle"} onClick={() => void exportNow()} className="apex-button-secondary min-h-9 shrink-0 px-3 text-[9px]"><Download size={11} />{action === "export" ? "Preparando..." : "Baixar meus dados"}</button></div><div className="mt-3 grid gap-3"><select value={requestType} onChange={(event) => setRequestType(event.target.value as PrivacyRequestType)} className="apex-input">{(Object.entries(REQUEST_LABELS) as Array<[PrivacyRequestType, string]>).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><textarea value={requestDetails} maxLength={4000} onChange={(event) => setRequestDetails(event.target.value)} placeholder="Descreva sua solicitação e indique os dados envolvidos, se necessário." className="apex-input min-h-24 resize-y" /><button type="button" disabled={action !== "idle"} onClick={() => void sendRequest()} className="apex-button-primary w-fit min-h-9 px-3 text-[9px]"><Send size={11} />{action === "request" ? "Registrando..." : "Registrar solicitação"}</button></div>{state.requests.length > 0 && <div className="mt-4 space-y-2"><p className="text-[8px] font-semibold uppercase tracking-wider text-apex-faint">Solicitações recentes</p>{state.requests.slice(0, 5).map((request) => <div key={request.id} className="flex items-center gap-3 rounded-lg border border-apex-border bg-apex-surface px-3 py-2"><span className="min-w-0 flex-1"><span className="block text-[9px] font-semibold text-apex-white">{REQUEST_LABELS[request.requestType]}</span><span className="mt-0.5 block font-mono text-[7px] text-apex-faint">{formatDate(request.createdAt)}</span></span><span className="rounded-full border border-apex-border px-2 py-1 text-[7px] font-semibold text-apex-muted">{STATUS_LABELS[request.status]}</span></div>)}</div>}</section>

      <section className="border-t border-apex-border pt-4"><p className="text-[11px] font-semibold text-apex-white">Retenção por categoria</p><div className="mt-3 space-y-2">{state.retentionRules.map((rule) => <details key={rule.code} className="rounded-lg border border-apex-border bg-apex-surface p-3"><summary className="cursor-pointer text-[9px] font-semibold text-apex-white">{rule.dataCategory}</summary><div className="mt-2 space-y-2 text-[8px] leading-relaxed text-apex-faint"><p><strong className="text-apex-muted">Conta ativa:</strong> {rule.activeAccountPeriod}</p><p><strong className="text-apex-muted">Após exclusão:</strong> {rule.afterAccountDeletion}</p><p><strong className="text-apex-muted">Justificativa:</strong> {rule.rationale}</p></div></details>)}</div></section>

      <section className="rounded-lg border border-amber-300/20 bg-amber-300/5 p-3"><p className="text-[9px] font-semibold text-amber-100">Canal e revisão jurídica</p><p className="mt-1 text-[8px] leading-relaxed text-amber-100/70">Controlador: {DATA_CONTROLLER_NAME || "não configurado"}. Canal: {PRIVACY_CONTACT_EMAIL || "não configurado"}. Preencha essas informações e revise as minutas com profissional habilitado antes do lançamento comercial.</p></section>
    </div>}
  </CollapsibleCard>;
}

function PreferenceToggle({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-apex-border bg-apex-surface px-3 py-2.5"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-amber-400" /><span className="min-w-0 flex-1"><span className="block text-[9px] font-semibold text-apex-white">{label}</span><span className="mt-0.5 block text-[8px] text-apex-faint">{description}</span></span></label>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value)).replace(".", "");
}
