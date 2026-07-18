import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";
import type { ReadingCycle, ReadingProject, ReadingSession } from "@/data/readingData";
import type { CheckinEntry, FocusSession, Goal, GoalDraft, Habit, HabitDayPlan, HabitDraft, HabitEntry, HabitFrequency, HabitStatus, InboxItem, Task, TaskDraft, TaskEntry, TaskFrequency, WeeklyReview } from "@/lib/productivity/types";
import { reviewAnswersJson } from "@/lib/productivity/types";

const CATEGORY_TO_DB = { espiritual: "spiritual", treino: "training", foco: "focus", saude: "health", aprendizado: "learning", pessoal: "personal" } as const;
const CATEGORY_FROM_DB = { spiritual: "espiritual", training: "treino", focus: "foco", health: "saude", learning: "aprendizado", personal: "pessoal" } as const;

function habitFrequencyToDb(frequency: HabitFrequency) {
  if (frequency.type === "daily") return { frequency_type: "daily" as const, frequency_times: null, frequency_days: [] as number[] };
  if (frequency.type === "xPerWeek") return { frequency_type: "times_per_week" as const, frequency_times: frequency.times, frequency_days: [] as number[] };
  return { frequency_type: "specific_days" as const, frequency_times: null, frequency_days: frequency.days };
}

function taskFrequencyToDb(frequency: TaskFrequency) {
  if (frequency.type === "once") return { frequency_type: "once" as const, frequency_times: null, frequency_days: [] as number[] };
  if (frequency.type === "daily") return { frequency_type: "daily" as const, frequency_times: null, frequency_days: [] as number[] };
  if (frequency.type === "xPerWeek") return { frequency_type: "times_per_week" as const, frequency_times: frequency.times, frequency_days: [] as number[] };
  return { frequency_type: "specific_days" as const, frequency_times: null, frequency_days: frequency.days };
}

function habitFrequency(row: { frequency_type: string; frequency_times: number | null; frequency_days: number[] }): HabitFrequency {
  if (row.frequency_type === "times_per_week") return { type: "xPerWeek", times: row.frequency_times ?? 1 };
  if (row.frequency_type === "specific_days") return { type: "specificDays", days: row.frequency_days };
  return { type: "daily" };
}

function taskFrequency(row: { frequency_type: string; frequency_times: number | null; frequency_days: number[] }): TaskFrequency {
  if (row.frequency_type === "once") return { type: "once" };
  if (row.frequency_type === "times_per_week") return { type: "xPerWeek", times: row.frequency_times ?? 1 };
  if (row.frequency_type === "specific_days") return { type: "specificDays", days: row.frequency_days };
  return { type: "daily" };
}

export async function loadHabits(userId: string, includeArchived = false) {
  let query = createClient().from("productivity_habits").select("*").eq("user_id", userId).order("scheduled_time").order("created_at");
  if (!includeArchived) query = query.eq("is_archived", false);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row): Habit => ({
    id: row.id, name: row.name, time: row.scheduled_time.slice(0, 5), period: row.period,
    category: CATEGORY_FROM_DB[row.category], color: row.color, lucideIcon: row.icon_name,
    frequency: habitFrequency(row), weeklyGoal: row.weekly_goal, durationMinutes: row.duration_minutes,
    duration: row.duration_minutes ? `${row.duration_minutes} min` : undefined,
    opensReadingLog: row.opens_reading_log, status: "pending", streak: 0, isArchived: row.is_archived,
  }));
}

export async function saveHabit(userId: string, draft: HabitDraft) {
  const frequency = habitFrequencyToDb(draft.frequency);
  const payload: Database["public"]["Tables"]["productivity_habits"]["Insert"] = {
    user_id: userId, name: draft.name.trim(), scheduled_time: draft.time, period: draft.period,
    category: CATEGORY_TO_DB[draft.category], color: draft.color, icon_name: draft.lucideIcon,
    ...frequency, weekly_goal: draft.weeklyGoal, duration_minutes: draft.durationMinutes,
    opens_reading_log: draft.opensReadingLog, is_archived: false,
  };
  if (draft.id) {
    const { data, error } = await createClient().from("productivity_habits").update(payload).eq("id", draft.id).eq("user_id", userId).select("id").single();
    if (error) throw error; return data.id;
  }
  const { data, error } = await createClient().from("productivity_habits").insert(payload).select("id").single();
  if (error) throw error; return data.id;
}

export async function archiveHabit(userId: string, habitId: string) {
  const { error } = await createClient().from("productivity_habits").update({ is_archived: true }).eq("id", habitId).eq("user_id", userId);
  if (error) throw error;
}

export async function loadHabitEntries(userId: string, dateFrom: string, dateTo: string) {
  const { data, error } = await createClient().from("productivity_habit_entries").select("*").eq("user_id", userId).gte("entry_date", dateFrom).lte("entry_date", dateTo).order("entry_date");
  if (error) throw error;
  return (data ?? []).map((row): HabitEntry => ({ id: row.id, habitId: row.habit_id, date: row.entry_date, status: row.status, completedAt: row.completed_at }));
}

export async function setHabitStatus(habitId: string, date: string, status: HabitStatus) {
  const { error } = await createClient().rpc("set_habit_entry", { p_habit_id: habitId, p_entry_date: date, p_status: status });
  if (error) throw error;
}

export async function loadHabitDayPlans(userId: string, dateFrom: string, dateTo: string) {
  const { data, error } = await createClient().from("productivity_habit_day_plans").select("*").eq("user_id", userId).gte("plan_date", dateFrom).lte("plan_date", dateTo).order("plan_date");
  if (error) throw error;
  return (data ?? []).map((row): HabitDayPlan => ({ date: row.plan_date, habitIds: row.habit_ids }));
}

export async function saveHabitDayPlan(date: string, habitIds: string[]) {
  const { error } = await createClient().rpc("save_habit_day_plan", { p_plan_date: date, p_habit_ids: habitIds });
  if (error) throw error;
}

export async function clearHabitDayPlan(userId: string, date: string) {
  const { error } = await createClient().from("productivity_habit_day_plans").delete().eq("user_id", userId).eq("plan_date", date);
  if (error) throw error;
}

export async function loadTasks(userId: string, includeArchived = false) {
  let query = createClient().from("productivity_tasks").select("*").eq("user_id", userId).order("due_date").order("scheduled_time").order("created_at");
  if (!includeArchived) query = query.eq("is_archived", false);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row): Task => ({ id: row.id, name: row.title, time: row.scheduled_time?.slice(0, 5), frequency: taskFrequency(row), date: row.due_date ?? undefined, notes: row.notes, status: "pending", isArchived: row.is_archived }));
}

export async function saveTask(userId: string, draft: TaskDraft) {
  if (!draft.name.trim()) throw new Error("Invalid task title");
  if (draft.frequency.type === "specificDays" && draft.frequency.days.length === 0) throw new Error("Invalid task frequency");
  if (draft.frequency.type === "once" && !draft.date) throw new Error("Invalid task date");
  const frequency = taskFrequencyToDb(draft.frequency);
  const payload: Database["public"]["Tables"]["productivity_tasks"]["Insert"] = { user_id: userId, title: draft.name.trim(), scheduled_time: draft.time || null, ...frequency, due_date: draft.frequency.type === "once" ? draft.date : null, notes: draft.notes.trim(), is_archived: false };
  if (draft.id) {
    const { data, error } = await createClient().from("productivity_tasks").update(payload).eq("id", draft.id).eq("user_id", userId).select("id").single();
    if (error) throw error; return data.id;
  }
  const { data, error } = await createClient().from("productivity_tasks").insert(payload).select("id").single();
  if (error) throw error; return data.id;
}

export async function archiveTask(userId: string, taskId: string) {
  const { error } = await createClient().from("productivity_tasks").update({ is_archived: true }).eq("id", taskId).eq("user_id", userId);
  if (error) throw error;
}

export async function loadTaskEntries(userId: string, dateFrom: string, dateTo: string) {
  const { data, error } = await createClient().from("productivity_task_entries").select("*").eq("user_id", userId).gte("entry_date", dateFrom).lte("entry_date", dateTo).order("entry_date");
  if (error) throw error;
  return (data ?? []).map((row): TaskEntry => ({ id: row.id, taskId: row.task_id, date: row.entry_date, status: row.status, completedAt: row.completed_at }));
}

export async function setTaskStatus(taskId: string, date: string, status: HabitStatus) {
  const { error } = await createClient().rpc("set_task_entry", { p_task_id: taskId, p_entry_date: date, p_status: status });
  if (error) throw error;
}

export async function loadGoals(userId: string, includeArchived = false) {
  let query = createClient().from("productivity_goals").select("*").eq("user_id", userId).order("target_date");
  if (!includeArchived) query = query.neq("status", "archived");
  const [{ data: rows, error }, { data: habitLinks, error: habitError }, { data: templateLinks, error: templateError }] = await Promise.all([
    query,
    createClient().from("productivity_goal_habits").select("goal_id,habit_id").eq("user_id", userId),
    createClient().from("productivity_goal_training_templates").select("goal_id,template_id").eq("user_id", userId),
  ]);
  if (error) throw error; if (habitError) throw habitError; if (templateError) throw templateError;
  return (rows ?? []).map((row): Goal => ({ id: row.id, title: row.title, targetDate: row.target_date, current: Number(row.current_value), target: Number(row.target_value), unit: row.unit, status: row.status, linkedHabitIds: (habitLinks ?? []).filter((link) => link.goal_id === row.id).map((link) => link.habit_id), linkedWorkoutTemplateIds: (templateLinks ?? []).filter((link) => link.goal_id === row.id).map((link) => link.template_id) }));
}

export async function saveGoal(draft: GoalDraft) {
  const { data, error } = await createClient().rpc("save_productivity_goal", { p_goal_id: draft.id, p_title: draft.title.trim(), p_target_date: draft.targetDate, p_current_value: draft.current, p_target_value: draft.target, p_unit: draft.unit.trim(), p_status: draft.status, p_habit_ids: draft.linkedHabitIds, p_training_template_ids: draft.linkedWorkoutTemplateIds });
  if (error) throw error; return data;
}

export async function archiveGoal(userId: string, goalId: string) {
  const { error } = await createClient().from("productivity_goals").update({ status: "archived" }).eq("id", goalId).eq("user_id", userId);
  if (error) throw error;
}

export async function loadCheckins(userId: string, dateFrom: string, dateTo: string) {
  const { data, error } = await createClient().from("productivity_daily_checkins").select("*").eq("user_id", userId).gte("checkin_date", dateFrom).lte("checkin_date", dateTo).order("checkin_date");
  if (error) throw error;
  return (data ?? []).map((row): CheckinEntry => ({ date: row.checkin_date, energia: row.energy, sono: row.sleep, humor: row.mood, estresse: row.stress, dorMuscular: row.muscle_soreness, notes: row.notes }));
}

export async function saveCheckin(userId: string, entry: CheckinEntry) {
  const payload = { user_id: userId, checkin_date: entry.date, energy: entry.energia, sleep: entry.sono, mood: entry.humor, stress: entry.estresse, muscle_soreness: entry.dorMuscular, notes: entry.notes ?? "" };
  const { error } = await createClient().from("productivity_daily_checkins").upsert(payload, { onConflict: "user_id,checkin_date" });
  if (error) throw error;
}

export async function loadDayMood(userId: string, date: string) {
  const { data, error } = await createClient().from("productivity_day_moods").select("mood").eq("user_id", userId).eq("mood_date", date).maybeSingle();
  if (error) throw error;
  return data?.mood ?? null;
}

export async function saveDayMood(userId: string, date: string, mood: number) {
  const { error } = await createClient().from("productivity_day_moods").upsert({ user_id: userId, mood_date: date, mood }, { onConflict: "user_id,mood_date" });
  if (error) throw error;
}

export async function clearDayMood(userId: string, date: string) {
  const { error } = await createClient().from("productivity_day_moods").delete().eq("user_id", userId).eq("mood_date", date);
  if (error) throw error;
}

export async function loadInboxItems(userId: string, includeArchived = false) {
  let query = createClient().from("productivity_inbox_items").select("*").eq("user_id", userId).order("created_at", { ascending: false });
  if (!includeArchived) query = query.eq("is_archived", false);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row): InboxItem => ({ id: row.id, type: row.item_type, content: row.content, createdAt: row.created_at, archived: row.is_archived }));
}

export async function createInboxItem(userId: string, type: InboxItem["type"], content: string) {
  const { data, error } = await createClient().from("productivity_inbox_items").insert({ user_id: userId, item_type: type, content: content.trim() }).select("id").single();
  if (error) throw error; return data.id;
}

export async function archiveInboxItem(userId: string, itemId: string) {
  const { error } = await createClient().from("productivity_inbox_items").update({ is_archived: true }).eq("id", itemId).eq("user_id", userId);
  if (error) throw error;
}

export async function loadWeeklyReview(userId: string, week: string) {
  const { data, error } = await createClient().from("productivity_weekly_reviews").select("*").eq("user_id", userId).eq("week_start", week).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const answers = typeof data.answers === "object" && data.answers && !Array.isArray(data.answers) ? Object.fromEntries(Object.entries(data.answers).filter((entry): entry is [string, string] => typeof entry[1] === "string")) : {};
  return { weekStart: data.week_start, answers, updatedAt: data.updated_at } satisfies WeeklyReview;
}

export async function saveWeeklyReview(userId: string, review: WeeklyReview) {
  const { error } = await createClient().from("productivity_weekly_reviews").upsert({ user_id: userId, week_start: review.weekStart, answers: reviewAnswersJson(review.answers) }, { onConflict: "user_id,week_start" });
  if (error) throw error;
}

export async function loadFocusSessions(userId: string, dateFrom?: string, dateTo?: string) {
  let query = createClient().from("productivity_focus_sessions").select("*").eq("user_id", userId).order("session_date", { ascending: false }).order("completed_at", { ascending: false });
  if (dateFrom) query = query.gte("session_date", dateFrom);
  if (dateTo) query = query.lte("session_date", dateTo);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row): FocusSession => ({ id: row.id, habitId: row.habit_id, date: row.session_date, minutes: row.duration_minutes, task: row.task_name, completedAt: row.completed_at }));
}

export async function recordFocusSession(userId: string, session: Omit<FocusSession, "id" | "completedAt">) {
  const { data, error } = await createClient().from("productivity_focus_sessions").insert({ user_id: userId, habit_id: session.habitId, session_date: session.date, task_name: session.task.trim(), duration_minutes: session.minutes }).select("id").single();
  if (error) throw error;
  return data.id;
}

function mapReadingProject(row: DatabaseReadingProject): ReadingProject {
  return { id: row.id, title: row.title, author: row.author ?? undefined, totalPages: row.total_pages, currentPage: row.current_page, weeklyTargetPages: row.weekly_target_pages, readingDays: row.reading_days, status: row.status, priority: row.priority, startDate: row.start_date, targetEndDate: row.target_end_date ?? undefined, completedAt: row.completed_at ?? undefined, cycleId: row.cycle_id ?? undefined, linkedGoalId: row.linked_goal_id ?? undefined, color: row.color ?? undefined, category: row.category ?? undefined, notes: row.notes || undefined, createdAt: row.created_at, updatedAt: row.updated_at };
}
type DatabaseReadingProject = Awaited<ReturnType<typeof loadReadingProjectRows>>[number];
async function loadReadingProjectRows(userId: string) { const { data, error } = await createClient().from("reading_projects").select("*").eq("user_id", userId).order("updated_at", { ascending: false }); if (error) throw error; return data ?? []; }

export async function loadReadingData(userId: string) {
  const [projects, cycleResult, sessionResult] = await Promise.all([
    loadReadingProjectRows(userId),
    createClient().from("reading_cycles").select("*").eq("user_id", userId).order("start_date", { ascending: false }),
    createClient().from("reading_sessions").select("*").eq("user_id", userId).order("session_date").order("created_at"),
  ]);
  if (cycleResult.error) throw cycleResult.error; if (sessionResult.error) throw sessionResult.error;
  return {
    projects: projects.map(mapReadingProject),
    cycles: (cycleResult.data ?? []).map((row): ReadingCycle => ({ id: row.id, label: row.label, startDate: row.start_date, endDate: row.end_date, targetBooks: row.target_books, linkedGoalId: row.linked_goal_id ?? undefined })),
    sessions: (sessionResult.data ?? []).map((row): ReadingSession => ({ id: row.id, bookId: row.project_id, date: row.session_date, fromPage: row.from_page, toPage: row.to_page, pagesRead: row.pages_read, note: row.note || undefined, createdAt: row.created_at })),
  };
}

export async function saveReadingProject(userId: string, project: Omit<ReadingProject, "id" | "createdAt" | "updatedAt">, id: string | null) {
  const payload = { user_id: userId, title: project.title.trim(), author: project.author?.trim() || null, total_pages: project.totalPages, current_page: project.currentPage, weekly_target_pages: project.weeklyTargetPages, reading_days: project.readingDays, status: project.status, priority: project.priority, start_date: project.startDate, target_end_date: project.targetEndDate ?? null, completed_at: project.completedAt ?? null, cycle_id: project.cycleId ?? null, linked_goal_id: project.linkedGoalId ?? null, color: project.color ?? null, category: project.category ?? null, notes: project.notes ?? "" };
  if (id) { const { error } = await createClient().from("reading_projects").update(payload).eq("id", id).eq("user_id", userId); if (error) throw error; return id; }
  const { data, error } = await createClient().from("reading_projects").insert(payload).select("id").single(); if (error) throw error; return data.id;
}

export async function archiveReadingProject(userId: string, projectId: string) {
  const { error } = await createClient().from("reading_projects").update({ status: "abandoned" }).eq("id", projectId).eq("user_id", userId); if (error) throw error;
}

export async function saveReadingCycle(userId: string, cycle: Omit<ReadingCycle, "id">) {
  const { data, error } = await createClient().from("reading_cycles").insert({ user_id: userId, label: cycle.label.trim(), start_date: cycle.startDate, end_date: cycle.endDate, target_books: cycle.targetBooks, linked_goal_id: cycle.linkedGoalId ?? null }).select("id").single();
  if (error) throw error; return data.id;
}

export async function recordReadingProgress(projectId: string, date: string, toPage: number, note = "") {
  const { data, error } = await createClient().rpc("record_reading_progress", { p_project_id: projectId, p_session_date: date, p_to_page: toPage, p_note: note });
  if (error) throw error; return data;
}
