"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, BookOpenCheck, CheckCheck, ClipboardCheck, Dumbbell, ListTodo, LoaderCircle, Utensils, X } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { isoDate } from "@/lib/productivity/date";
import { navigateTo } from "@/lib/navigationEvents";
import { dismissNotification, loadNotifications, markAllNotificationsRead, markNotificationRead, syncNotifications } from "@/lib/notifications/service";
import { friendlyNotificationError } from "@/lib/notifications/errors";
import type { AppNotification, NotificationKind } from "@/lib/notifications/types";

const KIND_META: Record<NotificationKind, { label: string; Icon: typeof Bell; color: string }> = {
  habit: { label: "Hábito", Icon: CheckCheck, color: "#22C55E" },
  task: { label: "Tarefa", Icon: ListTodo, color: "#3B82F6" },
  training: { label: "Treino", Icon: Dumbbell, color: "#F97316" },
  diet: { label: "Dieta", Icon: Utensils, color: "#14B8A6" },
  weekly_review: { label: "Revisão", Icon: BookOpenCheck, color: "#A855F7" },
  daily_summary: { label: "Resumo", Icon: ClipboardCheck, color: "#E3AD52" },
  system: { label: "Apex", Icon: Bell, color: "#94A3B8" },
};

export default function NotificationBell() {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const unread = items.filter((item) => !item.readAt).length;

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true); setError("");
    try {
      await syncNotifications(isoDate(new Date()));
      setItems(await loadNotifications(user.id));
    } catch (loadError) {
      setError(friendlyNotificationError(loadError));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading || !user) return;
    void refresh();
    const interval = window.setInterval(() => void refresh(), 5 * 60_000);
    const onProductivityChanged = () => void refresh();
    window.addEventListener("apex-productivity-changed", onProductivityChanged);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("apex-productivity-changed", onProductivityChanged);
    };
  }, [authLoading, refresh, user]);

  async function openNotification(item: AppNotification) {
    if (!user) return;
    if (!item.readAt) {
      setItems((current) => current.map((candidate) => candidate.id === item.id ? { ...candidate, readAt: new Date().toISOString() } : candidate));
      await markNotificationRead(user.id, item.id).catch(() => undefined);
    }
    setOpen(false);
    if (item.actionDestination) navigateTo(item.actionDestination);
  }

  async function dismiss(item: AppNotification) {
    if (!user) return;
    setItems((current) => current.filter((candidate) => candidate.id !== item.id));
    try { await dismissNotification(user.id, item.id); }
    catch (dismissError) { setError(friendlyNotificationError(dismissError)); await refresh(); }
  }

  async function markAll() {
    if (!user || unread === 0) return;
    setItems((current) => current.map((item) => ({ ...item, readAt: item.readAt ?? new Date().toISOString() })));
    try { await markAllNotificationsRead(user.id); }
    catch (markError) { setError(friendlyNotificationError(markError)); await refresh(); }
  }

  return <div className="relative">
    <button type="button" onClick={() => { setOpen((value) => !value); if (!open) void refresh(); }} aria-label={unread ? `${unread} notificações não lidas` : "Notificações"} className="relative flex h-11 w-11 items-center justify-center rounded-full border border-line bg-surface-raised text-ink-muted transition-colors hover:border-line-strong hover:text-accent">
      <Bell size={17} />
      {unread > 0 && <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full border-2 border-canvas bg-accent px-1 font-stat text-[8px] font-bold text-ink-inverse">{unread > 9 ? "9+" : unread}</span>}
    </button>

    <AnimatePresence>
      {open && <>
        <button type="button" aria-label="Fechar notificações" onClick={() => setOpen(false)} className="fixed inset-0 z-40 cursor-default" />
        <motion.section initial={{ opacity: 0, scale: .97, y: -6 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: .97, y: -6 }} className="absolute right-0 top-full z-50 mt-2 w-[min(380px,calc(100vw-24px))] overflow-hidden rounded-panel border border-line bg-surface-overlay shadow-float">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <div><p className="apex-kicker">Central</p><h2 className="mt-1 text-[13px] font-semibold text-ink">Notificações</h2></div>
            <button type="button" disabled={!unread} onClick={() => void markAll()} className="min-h-8 text-[9px] font-semibold text-accent disabled:opacity-40">Marcar como lidas</button>
          </div>
          <div className="max-h-[min(520px,70vh)] overflow-y-auto p-2">
            {loading && !items.length && <div className="flex items-center justify-center gap-2 p-8 text-[9px] text-ink-muted"><LoaderCircle size={13} className="animate-spin text-accent" />Atualizando...</div>}
            {error && <p role="alert" className="m-2 rounded-control border border-red-400/20 bg-red-400/5 p-3 text-[8px] leading-relaxed text-red-300">{error}</p>}
            {!loading && !error && !items.length && <div className="p-10 text-center"><Bell size={20} className="mx-auto text-ink-faint" /><p className="mt-3 text-[10px] font-semibold text-ink-secondary">Tudo em dia</p><p className="mt-1 text-[8px] text-ink-muted">Os avisos do Apex aparecerão aqui.</p></div>}
            <div className="space-y-1">
              {items.map((item) => {
                const meta = KIND_META[item.kind]; const Icon = meta.Icon;
                return <div key={item.id} className={`group flex items-start gap-3 rounded-control border p-3 ${item.readAt ? "border-transparent bg-transparent" : "border-line bg-surface"}`}>
                  <button type="button" onClick={() => void openNotification(item)} className="flex min-w-0 flex-1 items-start gap-3 text-left">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control border" style={{ color: meta.color, borderColor: `${meta.color}35`, background: `${meta.color}12` }}><Icon size={14} /></span>
                    <span className="min-w-0 flex-1"><span className="flex items-center gap-2"><span className="text-[7px] font-semibold uppercase tracking-wide" style={{ color: meta.color }}>{meta.label}</span>{!item.readAt && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}</span><span className="mt-1 block text-[10px] font-semibold text-ink">{item.title}</span><span className="mt-1 block text-[8px] leading-relaxed text-ink-muted">{item.body}</span><span className="mt-2 block font-stat text-[7px] text-ink-faint">{formatNotificationTime(item.scheduledFor)}</span></span>
                  </button>
                  <button type="button" onClick={() => void dismiss(item)} aria-label={`Dispensar ${item.title}`} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-control text-ink-faint opacity-60 hover:bg-surface hover:text-ink group-hover:opacity-100"><X size={11} /></button>
                </div>;
              })}
            </div>
          </div>
        </motion.section>
      </>}
    </AnimatePresence>
  </div>;
}

function formatNotificationTime(value: string) {
  const date = new Date(value);
  const today = new Date();
  const sameDay = date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate();
  return new Intl.DateTimeFormat("pt-BR", sameDay ? { hour: "2-digit", minute: "2-digit" } : { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(date).replace(".", "");
}
