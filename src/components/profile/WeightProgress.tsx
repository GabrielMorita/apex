"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CalendarRange, CheckCircle2, Flag, LoaderCircle, Scale, TrendingUp } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Card, IconTile, SectionHeader } from "@/components/ui/primitives";
import { loadProfile, loadWeightHistory, recordWeight } from "@/lib/profile/service";
import type { ApexProfile, WeightHistoryEntry } from "@/lib/profile/types";
import { dailyWeightPoints, shiftWeightDate, weeklyWeightSummaries, weightVariation, weightWeekStart, type DailyWeightPoint } from "@/lib/profile/weightAnalytics";
import { navigateTo } from "@/lib/navigationEvents";

type WeightPeriodWeeks = 4 | 8 | 12;

const PERIODS: WeightPeriodWeeks[] = [4, 8, 12];
const GOAL_LABELS = { lose_weight: "Emagrecer", maintain_weight: "Manter peso", gain_muscle: "Ganhar massa" } as const;
const SOURCE_LABELS = { profile: "Perfil", dashboard: "Hoje", progress: "Progresso", integration: "Integração" } as const;

function isoDate(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatWeight(value: number | null | undefined) {
  return value === null || value === undefined ? "—" : `${value.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 2 })} kg`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" })
    .format(new Date(`${value}T12:00:00Z`))
    .replace(".", "");
}

function friendlyWeightError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  if (message.includes("failed to fetch") || message.includes("network") || message.includes("connection")) return "Não foi possível conectar ao Supabase. Verifique sua internet e tente novamente.";
  if (message.includes("jwt") || message.includes("session") || message.includes("authentication")) return "Sua sessão expirou. Entre novamente para acessar o histórico.";
  if (message.includes("weight_history") || message.includes("record_weight")) return "A migration v0.10.0 do Perfil ainda não está disponível neste Supabase.";
  return "Não foi possível carregar ou salvar o histórico de peso.";
}

export default function WeightProgress() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<ApexProfile | null>(null);
  const [entries, setEntries] = useState<WeightHistoryEntry[]>([]);
  const [periodWeeks, setPeriodWeeks] = useState<WeightPeriodWeeks>(4);
  const [weightInput, setWeightInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [inputError, setInputError] = useState("");
  const [success, setSuccess] = useState("");
  const today = isoDate(new Date());
  const currentWeekStart = weightWeekStart(today);
  const dateFrom = shiftWeightDate(currentWeekStart, -(periodWeeks - 1) * 7);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      setError("Sua sessão não está disponível. Entre novamente para consultar a evolução de peso.");
      return;
    }
    let active = true;
    setLoading(true);
    setError("");
    void Promise.all([loadProfile(user), loadWeightHistory(user.id, dateFrom, today)])
      .then(([loadedProfile, loadedEntries]) => {
        if (!active) return;
        setProfile(loadedProfile);
        setEntries(loadedEntries);
        setWeightInput((current) => current || (loadedProfile.weight_kg === null ? "" : String(loadedProfile.weight_kg).replace(".", ",")));
      })
      .catch((loadError) => { if (active) setError(friendlyWeightError(loadError)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [authLoading, dateFrom, today, user]);

  const points = useMemo(() => dailyWeightPoints(entries), [entries]);
  const weeks = useMemo(() => weeklyWeightSummaries(points, currentWeekStart, periodWeeks), [currentWeekStart, periodWeeks, points]);
  const currentWeek = weeks.at(-1);
  const previousWeek = weeks.at(-2);
  const currentWeight = profile?.weight_kg ?? points.at(-1)?.weight_kg ?? null;
  const variation = weightVariation(points);
  const targetWeight = profile?.target_weight_kg ?? null;
  const recentPoints = [...points].reverse().slice(0, 8);

  async function saveWeight() {
    if (!user || saving) return;
    const parsed = Number(weightInput.trim().replace(",", "."));
    if (!weightInput.trim()) return setInputError("Informe o peso atual.");
    if (!Number.isFinite(parsed) || parsed < 30 || parsed > 350) return setInputError("Use um valor entre 30 e 350 kg.");
    const todayPoint = points.find((point) => point.date === today);
    if (todayPoint && Math.abs(todayPoint.weight_kg - parsed) < 0.001) {
      setInputError("");
      setSuccess("Este peso já foi registrado hoje.");
      return;
    }
    setSaving(true);
    setInputError("");
    setSuccess("");
    try {
      await recordWeight(parsed, "progress");
      const [nextProfile, nextEntries] = await Promise.all([loadProfile(user), loadWeightHistory(user.id, dateFrom, today)]);
      setProfile(nextProfile);
      setEntries(nextEntries);
      setWeightInput(String(parsed).replace(".", ","));
      setSuccess("Peso registrado e Perfil atualizado.");
    } catch (saveError) {
      setInputError(friendlyWeightError(saveError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section>
      <SectionHeader eyebrow="Dados reais do Perfil" title="Evolução de peso" />
      {loading && <Card className="flex items-center gap-2 p-5 text-[10px] text-ink-muted"><LoaderCircle size={14} className="animate-spin text-accent" />Carregando histórico de peso...</Card>}
      {!loading && error && <Card className="flex items-start gap-3 border-red-400/20 p-5 text-[10px] leading-relaxed text-red-300"><AlertCircle size={15} className="mt-0.5 shrink-0" />{error}</Card>}
      {!loading && !error && profile && (
        <div className="space-y-4">
          <Card emphasis className="p-4 sm:p-5">
            <div className="flex flex-col gap-4 border-b border-line-subtle pb-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-3">
                <IconTile Icon={Scale} active />
                <div><p className="text-[13px] font-semibold text-ink">Acompanhe registros, não oscilações isoladas</p><p className="mt-1 text-[9px] leading-relaxed text-ink-muted">A tendência é descritiva e considera o último registro de cada dia.</p></div>
              </div>
              <div className="flex rounded-control border border-line-subtle bg-canvas p-1" aria-label="Período da evolução de peso">
                {PERIODS.map((period) => <button key={period} type="button" aria-pressed={periodWeeks === period} onClick={() => setPeriodWeeks(period)} className={`min-h-9 flex-1 rounded-[9px] px-3 text-[9px] font-semibold transition-colors ${periodWeeks === period ? "bg-accent text-black" : "text-ink-muted hover:bg-surface-hover hover:text-ink"}`}>{period} semanas</button>)}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
              <WeightMetric label="Peso atual" value={formatWeight(currentWeight)} detail={points.at(-1) ? `último registro em ${formatDate(points.at(-1)!.date)}` : "valor atual do Perfil"} Icon={Scale} emphasis />
              <WeightMetric label="Variação no período" value={variation === null ? "—" : `${variation > 0 ? "+" : variation < 0 ? "−" : ""}${Math.abs(variation).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} kg`} detail={variation === null ? "são necessários dois dias registrados" : `entre ${formatDate(points[0].date)} e ${formatDate(points.at(-1)!.date)}`} Icon={TrendingUp} />
              <WeightMetric label="Média desta semana" value={formatWeight(currentWeek?.average_weight_kg)} detail={currentWeek?.recorded_days ? `${currentWeek.recorded_days} ${currentWeek.recorded_days === 1 ? "dia registrado" : "dias registrados"}` : "sem registros nesta semana"} Icon={CalendarRange} />
              <WeightMetric label="Peso-meta" value={targetWeight ? formatWeight(targetWeight) : profile.goal === "maintain_weight" ? "Manutenção" : "—"} detail={targetWeight && currentWeight !== null ? `${Math.abs(targetWeight - currentWeight).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} kg de diferença atual` : profile.goal ? `objetivo: ${GOAL_LABELS[profile.goal]}` : "configure o Objetivo no Perfil"} Icon={Flag} />
            </div>
          </Card>

          <div className="grid gap-4 xl:grid-cols-[1.4fr_.6fr]">
            <Card className="p-4 sm:p-5">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><p className="apex-kicker">Tendência de {periodWeeks} semanas</p><p className="mt-2 text-[12px] font-semibold text-ink">Histórico registrado</p></div><p className="text-[8px] text-ink-muted">{points.length} {points.length === 1 ? "dia" : "dias"} no gráfico</p></div>
              {points.length === 0 ? <EmptyWeightHistory onOpenProfile={() => navigateTo("configuracoes")} /> : <WeightTrendChart points={points} targetWeight={targetWeight} dateFrom={dateFrom} dateTo={today} />}
              <p className="mt-3 text-[8px] leading-relaxed text-ink-faint">O gráfico não estima perda ou ganho futuro. Valores do mesmo dia são consolidados pelo registro mais recente.</p>
            </Card>

            <Card className="p-4 sm:p-5">
              <p className="apex-kicker">Novo registro</p>
              <p className="mt-2 text-[12px] font-semibold text-ink">Peso de hoje</p>
              <p className="mt-1 text-[8px] text-ink-muted">{formatDate(today)} · origem Progresso</p>
              <label className="mt-4 block"><span className="mb-1.5 block text-[8px] font-semibold uppercase tracking-wide text-ink-faint">Peso atual</span><span className={`flex items-center rounded-control border bg-surface ${inputError ? "border-red-400/60" : "border-line"}`}><input inputMode="decimal" value={weightInput} onChange={(event) => { setWeightInput(event.target.value); setInputError(""); setSuccess(""); }} onKeyDown={(event) => { if (event.key === "Enter") void saveWeight(); }} className="h-11 min-w-0 flex-1 bg-transparent px-3 font-stat text-[12px] text-ink outline-none" placeholder="Ex.: 78,5" /><span className="pr-3 text-[9px] text-ink-muted">kg</span></span></label>
              <button type="button" disabled={saving} onClick={() => void saveWeight()} className="apex-button-primary mt-3 w-full disabled:cursor-not-allowed disabled:opacity-50">{saving ? <><LoaderCircle size={13} className="animate-spin" />Salvando...</> : "Registrar peso"}</button>
              {inputError && <p className="mt-2 flex items-start gap-1.5 text-[8px] leading-relaxed text-red-300"><AlertCircle size={11} className="mt-0.5 shrink-0" />{inputError}</p>}
              {success && <p className="mt-2 flex items-start gap-1.5 text-[8px] leading-relaxed text-emerald-300"><CheckCircle2 size={11} className="mt-0.5 shrink-0" />{success}</p>}
              <button type="button" onClick={() => navigateTo("configuracoes")} className="mt-4 min-h-9 w-full text-[9px] font-semibold text-ink-muted hover:text-accent">Editar meta no Perfil</button>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="p-4 sm:p-5">
              <p className="apex-kicker">Comparação semanal</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <WeekAverage label="Semana atual" average={currentWeek?.average_weight_kg ?? null} days={currentWeek?.recorded_days ?? 0} />
                <WeekAverage label="Semana anterior" average={previousWeek?.average_weight_kg ?? null} days={previousWeek?.recorded_days ?? 0} />
              </div>
              <p className="mt-3 text-[8px] leading-relaxed text-ink-muted">{currentWeek?.average_weight_kg !== null && currentWeek?.average_weight_kg !== undefined && previousWeek?.average_weight_kg !== null && previousWeek?.average_weight_kg !== undefined ? `Diferença entre as médias: ${(currentWeek.average_weight_kg - previousWeek.average_weight_kg) > 0 ? "+" : ""}${(currentWeek.average_weight_kg - previousWeek.average_weight_kg).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} kg.` : "Registre peso nas duas semanas para comparar as médias."}</p>
            </Card>

            <Card className="p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3"><div><p className="apex-kicker">Histórico recente</p><p className="mt-2 text-[12px] font-semibold text-ink">Últimos registros diários</p></div><span className="text-[8px] text-ink-muted">até 8 registros</span></div>
              {recentPoints.length === 0 ? <p className="mt-5 text-[9px] text-ink-muted">Nenhum peso registrado neste período.</p> : <div className="mt-4 divide-y divide-line-subtle">{recentPoints.map((point) => <div key={point.date} className="flex items-center justify-between gap-3 py-2.5"><div><p className="text-[9px] font-semibold text-ink-secondary">{formatDate(point.date)}</p><p className="mt-0.5 text-[7px] text-ink-faint">Origem: {SOURCE_LABELS[point.source]}</p></div><p className="font-stat text-[11px] font-semibold text-ink">{formatWeight(point.weight_kg)}</p></div>)}</div>}
            </Card>
          </div>
        </div>
      )}
    </section>
  );
}

function WeightMetric({ label, value, detail, Icon, emphasis = false }: { label: string; value: string; detail: string; Icon: typeof Scale; emphasis?: boolean }) {
  return <div className="rounded-card border border-line-subtle bg-surface p-3.5"><div className="flex items-center justify-between gap-2"><p className="apex-kicker">{label}</p><Icon size={13} className={emphasis ? "text-accent" : "text-ink-faint"} /></div><p className={`mt-3 font-stat text-[20px] font-semibold ${emphasis ? "text-accent" : "text-ink"}`}>{value}</p><p className="mt-1.5 text-[8px] leading-relaxed text-ink-muted">{detail}</p></div>;
}

function WeekAverage({ label, average, days }: { label: string; average: number | null; days: number }) {
  return <div className="rounded-control border border-line-subtle bg-surface p-3"><p className="apex-kicker">{label}</p><p className="mt-2 font-stat text-[15px] font-semibold text-ink">{formatWeight(average)}</p><p className="mt-1 text-[7px] text-ink-muted">{days} {days === 1 ? "dia" : "dias"} com registro</p></div>;
}

function EmptyWeightHistory({ onOpenProfile }: { onOpenProfile: () => void }) {
  return <div className="rounded-card border border-dashed border-line p-8 text-center"><Scale size={21} className="mx-auto text-ink-faint" /><p className="mt-3 text-[11px] font-semibold text-ink-secondary">O histórico ainda não começou</p><p className="mx-auto mt-2 max-w-md text-[8px] leading-relaxed text-ink-muted">Registre o peso aqui ou altere-o em Dados físicos no Perfil.</p><button type="button" onClick={onOpenProfile} className="apex-button-secondary mt-4">Abrir Perfil</button></div>;
}

function WeightTrendChart({ points, targetWeight, dateFrom, dateTo }: { points: DailyWeightPoint[]; targetWeight: number | null; dateFrom: string; dateTo: string }) {
  const width = 760;
  const height = 240;
  const margin = { left: 50, right: 22, top: 20, bottom: 34 };
  const values = [...points.map((point) => point.weight_kg), ...(targetWeight === null ? [] : [targetWeight])];
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const padding = Math.max(0.8, (rawMax - rawMin) * 0.18);
  const min = rawMin - padding;
  const max = rawMax + padding;
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const dateMs = (value: string) => Date.parse(`${value}T00:00:00Z`);
  const rangeMs = Math.max(86_400_000, dateMs(dateTo) - dateMs(dateFrom));
  const x = (date: string) => margin.left + ((dateMs(date) - dateMs(dateFrom)) / rangeMs) * plotWidth;
  const y = (weight: number) => margin.top + ((max - weight) / Math.max(0.1, max - min)) * plotHeight;
  const polyline = points.map((point) => `${x(point.date)},${y(point.weight_kg)}`).join(" ");
  const gridValues = [max, (max + min) / 2, min];

  return <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label={`Tendência de peso de ${formatDate(dateFrom)} a ${formatDate(dateTo)}`}>
    {gridValues.map((value) => <g key={value}><line x1={margin.left} x2={width - margin.right} y1={y(value)} y2={y(value)} stroke="var(--border-subtle)" strokeWidth="1" /><text x={margin.left - 8} y={y(value) + 3} textAnchor="end" fill="var(--text-faint)" fontSize="8">{value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}</text></g>)}
    {targetWeight !== null && <g><line x1={margin.left} x2={width - margin.right} y1={y(targetWeight)} y2={y(targetWeight)} stroke="var(--accent-muted)" strokeWidth="1.5" strokeDasharray="5 5" /><text x={width - margin.right} y={y(targetWeight) - 5} textAnchor="end" fill="var(--accent-primary)" fontSize="8">Meta {targetWeight.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} kg</text></g>}
    {points.length > 1 && <polyline points={polyline} fill="none" stroke="var(--accent-primary)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />}
    {points.map((point, index) => <circle key={point.date} cx={x(point.date)} cy={y(point.weight_kg)} r={index === points.length - 1 ? 4.5 : 3} fill={index === points.length - 1 ? "var(--accent-primary)" : "var(--surface-overlay)"} stroke="var(--accent-primary)" strokeWidth="1.5"><title>{formatDate(point.date)}: {formatWeight(point.weight_kg)}</title></circle>)}
    <text x={margin.left} y={height - 8} fill="var(--text-faint)" fontSize="8">{formatDate(dateFrom)}</text><text x={width - margin.right} y={height - 8} textAnchor="end" fill="var(--text-faint)" fontSize="8">{formatDate(dateTo)}</text>
  </svg>;
}
