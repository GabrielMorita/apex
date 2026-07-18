import { createClient } from "@/lib/supabase/client";
import type { ExerciseDraft, ScheduleDraft, ScheduledWorkout, TemplateDraft, TrainingCycle, TrainingExercise, TrainingSession, TrainingSessionSet, TrainingTemplate, TrainingTemplateExercise, CycleDraft } from "@/lib/training/types";
import { templateItemsJson } from "@/lib/training/types";

function normalizeTemplateExercise(item: TrainingTemplateExercise): TrainingTemplateExercise {
  return {
    ...item,
    target_sets: Number(item.target_sets),
    target_reps: Number(item.target_reps),
    target_load_kg: item.target_load_kg === null ? null : Number(item.target_load_kg),
    rest_seconds: Number(item.rest_seconds),
  };
}

function normalizeSessionSet(item: TrainingSessionSet): TrainingSessionSet {
  return {
    ...item,
    exercise_order: Number(item.exercise_order),
    set_order: Number(item.set_order),
    target_reps: Number(item.target_reps),
    target_load_kg: item.target_load_kg === null ? null : Number(item.target_load_kg),
    actual_reps: item.actual_reps === null ? null : Number(item.actual_reps),
    actual_load_kg: item.actual_load_kg === null ? null : Number(item.actual_load_kg),
    rest_seconds: Number(item.rest_seconds),
  };
}

export async function loadTrainingExercises(userId: string, activeOnly = true) {
  let query = createClient()
    .from("training_exercises")
    .select("*")
    .or(`user_id.is.null,user_id.eq.${userId}`)
    .order("name_pt", { ascending: true });
  if (activeOnly) query = query.eq("is_active", true);
  const { data, error } = await query;
  if (error) throw error;
  return data as TrainingExercise[];
}

export async function loadTrainingTemplates(userId: string, includeArchived = false) {
  let templateQuery = createClient().from("training_templates").select("*").eq("user_id", userId).order("updated_at", { ascending: false });
  if (!includeArchived) templateQuery = templateQuery.eq("is_archived", false);
  const { data: templateRows, error: templateError } = await templateQuery;
  if (templateError) throw templateError;
  if (!templateRows?.length) return [] as TrainingTemplate[];

  const templateIds = templateRows.map((template) => template.id);
  const { data: itemRows, error: itemError } = await createClient()
    .from("training_template_exercises")
    .select("*")
    .eq("user_id", userId)
    .in("template_id", templateIds)
    .order("exercise_order", { ascending: true });
  if (itemError) throw itemError;
  const exerciseIds = [...new Set((itemRows ?? []).map((item) => item.exercise_id))];
  const exerciseMap = new Map<string, TrainingExercise>();
  if (exerciseIds.length > 0) {
    const { data: exercises, error: exerciseError } = await createClient().from("training_exercises").select("*").in("id", exerciseIds);
    if (exerciseError) throw exerciseError;
    for (const exercise of exercises ?? []) exerciseMap.set(exercise.id, exercise as TrainingExercise);
  }

  return templateRows.map((template) => ({
    ...template,
    exercises: (itemRows ?? [])
      .filter((item) => item.template_id === template.id)
      .map((item) => normalizeTemplateExercise({ ...item, exercise: exerciseMap.get(item.exercise_id) ?? null } as TrainingTemplateExercise)),
  })) as TrainingTemplate[];
}

export async function saveTrainingTemplate(draft: TemplateDraft) {
  const { data, error } = await createClient().rpc("save_training_template", {
    p_template_id: draft.id,
    p_name: draft.name.trim(),
    p_workout_type: draft.workout_type,
    p_description: draft.description.trim(),
    p_items: templateItemsJson(draft.exercises),
  });
  if (error) throw error;
  return data;
}

export async function duplicateTrainingTemplate(templateId: string) {
  const { data, error } = await createClient().rpc("duplicate_training_template", { p_template_id: templateId });
  if (error) throw error;
  return data;
}

export async function setTrainingTemplateArchived(userId: string, templateId: string, archived: boolean) {
  const { error } = await createClient().from("training_templates").update({ is_archived: archived }).eq("id", templateId).eq("user_id", userId);
  if (error) throw error;
}

export async function saveCustomTrainingExercise(userId: string, draft: ExerciseDraft) {
  const payload = {
    user_id: userId,
    source_type: "custom" as const,
    name_pt: draft.name_pt.trim(),
    category: draft.category,
    primary_muscle_group: draft.primary_muscle_group.trim(),
    equipment: draft.equipment.trim(),
    instructions: draft.instructions.trim(),
    video_url: draft.video_url.trim() || null,
    is_active: true,
  };
  if (draft.id) {
    const { data, error } = await createClient().from("training_exercises").update(payload).eq("id", draft.id).eq("user_id", userId).select("*").single();
    if (error) throw error;
    return data as TrainingExercise;
  }
  const { data, error } = await createClient().from("training_exercises").insert(payload).select("*").single();
  if (error) throw error;
  return data as TrainingExercise;
}

export async function setCustomExerciseArchived(userId: string, exerciseId: string, archived: boolean) {
  const { error } = await createClient().from("training_exercises").update({ is_active: !archived }).eq("id", exerciseId).eq("user_id", userId);
  if (error) throw error;
}

export async function loadTrainingCycles(userId: string, includeArchived = false) {
  let query = createClient().from("training_cycles").select("*").eq("user_id", userId).order("start_date", { ascending: false });
  if (!includeArchived) query = query.neq("status", "archived");
  const { data, error } = await query;
  if (error) throw error;
  return data as TrainingCycle[];
}

export async function saveTrainingCycle(userId: string, draft: CycleDraft) {
  const payload = { user_id: userId, name: draft.name.trim(), goal: draft.goal.trim(), start_date: draft.start_date, end_date: draft.end_date, status: draft.status, notes: draft.notes.trim() };
  if (draft.id) {
    const { data, error } = await createClient().from("training_cycles").update(payload).eq("id", draft.id).eq("user_id", userId).select("*").single();
    if (error) throw error;
    return data as TrainingCycle;
  }
  const { data, error } = await createClient().from("training_cycles").insert(payload).select("*").single();
  if (error) throw error;
  return data as TrainingCycle;
}

export async function loadTrainingSchedule(userId: string, dateFrom: string, dateTo: string) {
  const [{ data: rows, error }, templates, cycles] = await Promise.all([
    createClient().from("training_schedule").select("*").eq("user_id", userId).gte("scheduled_date", dateFrom).lte("scheduled_date", dateTo).order("scheduled_date").order("scheduled_time"),
    loadTrainingTemplates(userId, true),
    loadTrainingCycles(userId, true),
  ]);
  if (error) throw error;
  const templateMap = new Map(templates.map((template) => [template.id, template]));
  const cycleMap = new Map(cycles.map((cycle) => [cycle.id, cycle]));
  return (rows ?? []).map((row) => ({ ...row, template: templateMap.get(row.template_id) ?? null, cycle: row.cycle_id ? cycleMap.get(row.cycle_id) ?? null : null })) as ScheduledWorkout[];
}

export async function scheduleTrainingWorkout(userId: string, draft: ScheduleDraft) {
  const { data, error } = await createClient().from("training_schedule").insert({ user_id: userId, ...draft }).select("*").single();
  if (error) throw error;
  return data;
}

export async function removeScheduledWorkout(userId: string, scheduleId: string) {
  const { error } = await createClient().from("training_schedule").delete().eq("id", scheduleId).eq("user_id", userId).in("status", ["scheduled", "skipped"]);
  if (error) throw error;
}

export async function setScheduledWorkoutStatus(userId: string, scheduleId: string, status: "scheduled" | "skipped") {
  const { error } = await createClient().from("training_schedule").update({ status }).eq("id", scheduleId).eq("user_id", userId).in("status", ["scheduled", "skipped"]);
  if (error) throw error;
}

export async function startTrainingSession(scheduleId: string) {
  const { data, error } = await createClient().rpc("start_training_session", { p_scheduled_workout_id: scheduleId });
  if (error) throw error;
  return data;
}

export async function loadTrainingSession(userId: string, sessionId: string) {
  const [{ data: session, error }, { data: sets, error: setsError }] = await Promise.all([
    createClient().from("training_sessions").select("*").eq("id", sessionId).eq("user_id", userId).single(),
    createClient().from("training_session_sets").select("*").eq("session_id", sessionId).eq("user_id", userId).order("exercise_order").order("set_order"),
  ]);
  if (error) throw error;
  if (setsError) throw setsError;
  return { ...session, total_volume_kg: Number(session.total_volume_kg), sets: (sets ?? []).map((item) => normalizeSessionSet(item as TrainingSessionSet)) } as TrainingSession;
}

export async function loadActiveSessionForSchedule(userId: string, scheduleId: string) {
  const { data, error } = await createClient().from("training_sessions").select("id").eq("user_id", userId).eq("scheduled_workout_id", scheduleId).eq("status", "in_progress").order("started_at", { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  return data?.id ? loadTrainingSession(userId, data.id) : null;
}

export async function loadLatestSessionForSchedule(userId: string, scheduleId: string) {
  const { data, error } = await createClient().from("training_sessions").select("id").eq("user_id", userId).eq("scheduled_workout_id", scheduleId).order("started_at", { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  return data?.id ? loadTrainingSession(userId, data.id) : null;
}

export async function updateTrainingSessionSet(userId: string, setId: string, values: { actual_reps: number | null; actual_load_kg: number | null; is_completed: boolean }) {
  const { data, error } = await createClient().from("training_session_sets").update(values).eq("id", setId).eq("user_id", userId).select("*").single();
  if (error) throw error;
  return normalizeSessionSet(data as TrainingSessionSet);
}

export async function replaceTrainingSessionExercise(sessionId: string, templateExerciseId: string, replacementExerciseId: string) {
  const { error } = await createClient().rpc("replace_training_session_exercise", { p_session_id: sessionId, p_template_exercise_id: templateExerciseId, p_replacement_exercise_id: replacementExerciseId });
  if (error) throw error;
}

export async function finishTrainingSession(sessionId: string, durationMinutes: number | null, notes: string) {
  const { error } = await createClient().rpc("finish_training_session", { p_session_id: sessionId, p_duration_minutes: durationMinutes, p_notes: notes.trim() });
  if (error) throw error;
}

export async function cancelTrainingSession(sessionId: string) {
  const { error } = await createClient().rpc("cancel_training_session", { p_session_id: sessionId });
  if (error) throw error;
}

export async function loadCompletedTrainingSessions(userId: string, dateFrom: string, dateTo: string) {
  const { data: sessions, error } = await createClient().from("training_sessions").select("*").eq("user_id", userId).eq("status", "completed").gte("completed_at", `${dateFrom}T00:00:00`).lte("completed_at", `${dateTo}T23:59:59`).order("completed_at", { ascending: false });
  if (error) throw error;
  if (!sessions?.length) return [] as TrainingSession[];
  const sessionIds = sessions.map((session) => session.id);
  const { data: sets, error: setsError } = await createClient().from("training_session_sets").select("*").eq("user_id", userId).in("session_id", sessionIds).order("exercise_order").order("set_order");
  if (setsError) throw setsError;
  return sessions.map((session) => ({ ...session, total_volume_kg: Number(session.total_volume_kg), sets: (sets ?? []).filter((item) => item.session_id === session.id).map((item) => normalizeSessionSet(item as TrainingSessionSet)) })) as TrainingSession[];
}
