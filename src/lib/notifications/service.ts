import { createClient } from "@/lib/supabase/client";
import type { Database, Json } from "@/lib/supabase/database.types";
import type { AppNotification, NotificationPreferences } from "@/lib/notifications/types";

type PreferenceRow = Database["public"]["Tables"]["notification_preferences"]["Row"];

function toPreferences(row: PreferenceRow): NotificationPreferences {
  return {
    inAppEnabled: row.in_app_enabled, emailEnabled: row.email_enabled, pushEnabled: row.push_enabled,
    habitReminders: row.habit_reminders, taskReminders: row.task_reminders, trainingReminders: row.training_reminders,
    dietReminders: row.diet_reminders, weeklyReviewReminders: row.weekly_review_reminders,
    dailySummaryEnabled: row.daily_summary_enabled, reminderLeadMinutes: row.reminder_lead_minutes,
    dailySummaryTime: row.daily_summary_time.slice(0, 5), weeklyReviewTime: row.weekly_review_time.slice(0, 5),
    quietHoursEnabled: row.quiet_hours_enabled, quietHoursStart: row.quiet_hours_start.slice(0, 5), quietHoursEnd: row.quiet_hours_end.slice(0, 5),
    timezone: row.timezone,
  };
}

function detectedTimezone() {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Sao_Paulo"; }
  catch { return "America/Sao_Paulo"; }
}

export async function loadNotificationPreferences(userId: string) {
  const supabase = createClient();
  const current = await supabase.from("notification_preferences").select("*").eq("user_id", userId).maybeSingle();
  if (current.error) throw current.error;
  if (current.data) return toPreferences(current.data);
  const inserted = await supabase.from("notification_preferences").insert({ user_id: userId, timezone: detectedTimezone() }).select("*").single();
  if (inserted.error) throw inserted.error;
  return toPreferences(inserted.data);
}

export async function saveNotificationPreferences(userId: string, preferences: NotificationPreferences) {
  const payload: Database["public"]["Tables"]["notification_preferences"]["Insert"] = {
    user_id: userId, in_app_enabled: preferences.inAppEnabled, email_enabled: preferences.emailEnabled, push_enabled: preferences.pushEnabled,
    habit_reminders: preferences.habitReminders, task_reminders: preferences.taskReminders, training_reminders: preferences.trainingReminders,
    diet_reminders: preferences.dietReminders, weekly_review_reminders: preferences.weeklyReviewReminders,
    daily_summary_enabled: preferences.dailySummaryEnabled, reminder_lead_minutes: preferences.reminderLeadMinutes,
    daily_summary_time: preferences.dailySummaryTime, weekly_review_time: preferences.weeklyReviewTime,
    quiet_hours_enabled: preferences.quietHoursEnabled, quiet_hours_start: preferences.quietHoursStart,
    quiet_hours_end: preferences.quietHoursEnd, timezone: preferences.timezone,
  };
  const { data, error } = await createClient().from("notification_preferences").upsert(payload, { onConflict: "user_id" }).select("*").single();
  if (error) throw error;
  return toPreferences(data);
}

export async function syncNotifications(localDate: string) {
  const { data, error } = await createClient().rpc("sync_my_notifications", { p_local_date: localDate });
  if (error) throw error;
  return data ?? 0;
}

export async function loadNotifications(userId: string) {
  const now = new Date().toISOString();
  const { data, error } = await createClient().from("notifications").select("*").eq("user_id", userId).is("dismissed_at", null).lte("scheduled_for", now).or(`expires_at.is.null,expires_at.gt.${now}`).order("scheduled_for", { ascending: false }).limit(50);
  if (error) throw error;
  return (data ?? []).map((row): AppNotification => ({
    id: row.id, kind: row.kind, title: row.title, body: row.body, actionDestination: row.action_destination,
    sourceType: row.source_type, sourceId: row.source_id, scheduledFor: row.scheduled_for, expiresAt: row.expires_at,
    readAt: row.read_at, payload: jsonObject(row.payload),
  }));
}

function jsonObject(value: Json): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value : {};
}

export async function markNotificationRead(userId: string, notificationId: string) {
  const { error } = await createClient().from("notifications").update({ read_at: new Date().toISOString() }).eq("id", notificationId).eq("user_id", userId);
  if (error) throw error;
}

export async function markAllNotificationsRead(userId: string) {
  const { error } = await createClient().from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", userId).is("dismissed_at", null).is("read_at", null).lte("scheduled_for", new Date().toISOString());
  if (error) throw error;
}

export async function dismissNotification(userId: string, notificationId: string) {
  const { error } = await createClient().from("notifications").update({ dismissed_at: new Date().toISOString() }).eq("id", notificationId).eq("user_id", userId);
  if (error) throw error;
}
