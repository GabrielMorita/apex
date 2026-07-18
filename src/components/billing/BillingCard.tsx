"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, CreditCard, Crown, ExternalLink, LoaderCircle, ShieldCheck, Sparkles } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { CollapsibleCard } from "@/components/profile/ProfileFields";
import { friendlyBillingError } from "@/lib/billing/errors";
import { loadBillingState, openBillingPortal, startCheckout } from "@/lib/billing/service";
import type { BillingInvoice, BillingPlan, BillingState } from "@/lib/billing/types";

type Action = "idle" | "checkout" | "portal";

export default function BillingCard() {
  const { user, loading: authLoading } = useAuth();
  const [state, setState] = useState<BillingState | null>(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<Action>("idle");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); setError("Sua sessão não está disponível."); return; }
    let active = true;
    const params = new URLSearchParams(window.location.search);
    if (params.get("cobranca") === "sucesso") setNotice("Checkout concluído. O status será atualizado assim que o provedor confirmar o pagamento.");
    if (params.get("cobranca") === "cancelada") setNotice("Checkout cancelado. Nenhuma cobrança foi concluída.");
    setLoading(true); setError("");
    void loadBillingState(user.id)
      .then((loaded) => { if (active) setState(loaded); })
      .catch((loadError) => { if (active) setError(friendlyBillingError(loadError)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [authLoading, user]);

  const proPlan = useMemo(() => state?.plans.find((plan) => plan.tier === "pro") ?? null, [state]);
  const paidSubscription = state?.subscriptions.find((subscription) => ["trialing", "active", "past_due", "paused"].includes(subscription.status));
  const trialAlreadyUsed = state?.subscriptions.some((subscription) => Boolean(subscription.trialStart)) ?? false;

  async function checkout(plan: BillingPlan) {
    if (action !== "idle") return;
    setAction("checkout"); setError(""); setNotice("");
    try { window.location.assign(await startCheckout(plan.code)); }
    catch (checkoutError) { setError(friendlyBillingError(checkoutError)); setAction("idle"); }
  }

  async function portal() {
    if (action !== "idle") return;
    setAction("portal"); setError("");
    try { window.location.assign(await openBillingPortal()); }
    catch (portalError) { setError(friendlyBillingError(portalError)); setAction("idle"); }
  }

  return <CollapsibleCard title="Assinatura" icon={CreditCard} defaultOpen={false}>
    {loading && <p className="flex items-center gap-2 text-[10px] text-apex-muted"><LoaderCircle size={13} className="animate-spin text-gold" />Carregando sua assinatura...</p>}
    {!loading && error && !state && <p role="alert" className="flex items-start gap-2 rounded-lg border border-red-400/20 bg-red-400/5 p-3 text-[9px] leading-relaxed text-red-300"><AlertCircle size={13} className="mt-0.5 shrink-0" />{error}</p>}
    {!loading && state && <div className="space-y-4">
      <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-4">
        <div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-emerald-400/20 bg-emerald-400/10 text-emerald-300">{state.access.tier === "pro" ? <Crown size={17} /> : <Sparkles size={17} />}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-[12px] font-semibold text-apex-white">{state.access.planName}</p><span className="rounded-full border border-emerald-400/25 px-2 py-0.5 text-[7px] font-semibold uppercase tracking-wide text-emerald-300">{accessLabel(state.access.status)}</span></div><p className="mt-1 text-[9px] leading-relaxed text-apex-muted">{state.access.tier === "beta" ? "Todas as funcionalidades atuais permanecem disponíveis durante o Beta. Não existe cobrança ativa." : state.access.cancelAtPeriodEnd ? "Seu plano continuará disponível até o fim do período atual." : "Sua assinatura está sincronizada com o provedor."}</p>{state.access.accessUntil && <p className="mt-2 font-mono text-[8px] text-apex-faint">Período atual até {formatDate(state.access.accessUntil)}</p>}</div></div>
      </div>

      {notice && <p className="flex items-start gap-2 rounded-lg border border-amber-300/20 bg-amber-300/5 p-3 text-[9px] leading-relaxed text-amber-100"><CheckCircle2 size={13} className="mt-0.5 shrink-0" />{notice}</p>}
      {error && <p role="alert" className="flex items-start gap-2 rounded-lg border border-red-400/20 bg-red-400/5 p-3 text-[9px] leading-relaxed text-red-300"><AlertCircle size={13} className="mt-0.5 shrink-0" />{error}</p>}

      {proPlan && !paidSubscription && <div className="rounded-xl border border-apex-border bg-apex-surface p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start"><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><Crown size={14} className="text-gold" /><p className="text-[11px] font-semibold text-apex-white">{proPlan.name}</p>{!proPlan.isActive && <span className="rounded-full border border-apex-border px-2 py-0.5 text-[7px] font-semibold uppercase text-apex-faint">Em preparação</span>}</div><p className="mt-2 text-[9px] leading-relaxed text-apex-muted">{proPlan.description}</p><p className="mt-3 font-mono text-[13px] font-semibold text-gold">{formatPlanPrice(proPlan)}</p>{proPlan.trialDays > 0 && <p className={`mt-1 text-[8px] ${trialAlreadyUsed ? "text-apex-faint" : "text-emerald-300"}`}>{trialAlreadyUsed ? "Teste gratuito já utilizado nesta conta" : `${proPlan.trialDays} dias grátis na primeira assinatura`}</p>}<p className="mt-2 text-[8px] leading-relaxed text-apex-faint">Cartão e Apple Pay quando disponíveis no dispositivo. O método é confirmado no checkout seguro.</p>{proPlan.trialDays > 0 && !trialAlreadyUsed && <p className="mt-1 text-[8px] leading-relaxed text-apex-faint">A primeira cobrança ocorre após os {proPlan.trialDays} dias. Cancele antes do término para não ser cobrado.</p>}</div><button type="button" disabled={!proPlan.isActive || action !== "idle"} onClick={() => void checkout(proPlan)} className="flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-gold px-4 text-[10px] font-semibold text-apex-bg disabled:cursor-not-allowed disabled:opacity-45">{action === "checkout" ? <LoaderCircle size={13} className="animate-spin" /> : <CreditCard size={13} />}{proPlan.isActive ? proPlan.trialDays > 0 && !trialAlreadyUsed ? `Começar ${proPlan.trialDays} dias grátis` : "Assinar com segurança" : "Ainda não disponível"}</button></div>
        {!proPlan.isActive && <p className="mt-3 border-t border-apex-border pt-3 text-[8px] leading-relaxed text-apex-faint">Os 7 dias gratuitos estão configurados, mas o Apex não inicia checkout enquanto preço, conta Stripe e ativação comercial não forem confirmados.</p>}
      </div>}

      {(paidSubscription || state.hasProviderCustomer) && <button type="button" disabled={action !== "idle"} onClick={() => void portal()} className="flex min-h-10 items-center gap-2 rounded-lg border border-apex-border bg-apex-surface px-4 text-[10px] font-semibold text-apex-muted hover:border-apex-border2 hover:text-apex-white disabled:opacity-45">{action === "portal" ? <LoaderCircle size={13} className="animate-spin" /> : <ExternalLink size={13} />}Gerenciar pagamento e cancelamento</button>}

      {state.invoices.length > 0 && <div><p className="mb-2 text-[8px] font-semibold uppercase tracking-wider text-apex-faint">Histórico de cobranças</p><div className="space-y-2">{state.invoices.slice(0, 5).map((invoice) => <InvoiceRow key={invoice.id} invoice={invoice} />)}</div></div>}

      <div className="flex items-start gap-2 rounded-lg border border-apex-border bg-apex-surface/60 p-3"><ShieldCheck size={14} className="mt-0.5 shrink-0 text-gold" /><p className="text-[8px] leading-relaxed text-apex-faint">Dados de cartão não passam pelo banco do Apex. Checkout e gestão de pagamento usam páginas hospedadas pelo provedor. O aplicativo recebe apenas identificadores e estados de cobrança confirmados por webhook.</p></div>
    </div>}
  </CollapsibleCard>;
}

function InvoiceRow({ invoice }: { invoice: BillingInvoice }) {
  const url = invoice.hostedInvoiceUrl || invoice.invoicePdfUrl;
  const content = <><span><span className="block text-[9px] font-semibold text-apex-white">{invoiceLabel(invoice.status)}</span><span className="mt-0.5 block font-mono text-[8px] text-apex-faint">{formatDate(invoice.createdAt)}</span></span><span className="ml-auto font-mono text-[10px] text-apex-muted">{formatMoney(invoice.amountPaid || invoice.amountDue, invoice.currency)}</span>{url && <ExternalLink size={11} className="text-apex-faint" />}</>;
  return url ? <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-lg border border-apex-border bg-apex-surface px-3 py-2.5 hover:border-apex-border2">{content}</a> : <div className="flex items-center gap-3 rounded-lg border border-apex-border bg-apex-surface px-3 py-2.5">{content}</div>;
}

function formatPlanPrice(plan: BillingPlan) {
  if (plan.unitAmount === null) return "Preço a definir";
  if (plan.unitAmount === 0) return "Gratuito";
  return `${formatMoney(plan.unitAmount, plan.currency)}${plan.billingInterval === "month" ? "/mês" : plan.billingInterval === "year" ? "/ano" : ""}`;
}

function formatMoney(cents: number, currency: string) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: currency.toUpperCase() }).format(cents / 100);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value)).replace(".", "");
}

function accessLabel(status: string) {
  return ({ beta: "Beta completo", active: "Ativo", trialing: "Período gratuito", past_due: "Pagamento pendente", paused: "Pausado", canceled: "Cancelado" } as Record<string, string>)[status] ?? status;
}

function invoiceLabel(status: BillingInvoice["status"]) {
  return ({ draft: "Em preparação", open: "Em aberto", paid: "Pago", void: "Cancelado", uncollectible: "Não recebido", failed: "Pagamento falhou" } as Record<BillingInvoice["status"], string>)[status];
}
