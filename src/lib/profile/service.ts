import type { User } from "@supabase/supabase-js";
import type { Json } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/client";
import type { AccountDraft, ApexProfile, GoalDraft, PhysicalDraft, WeightHistoryEntry, WeightSource } from "@/lib/profile/types";
import { normalizeProfile } from "@/lib/profile/types";

const AVATAR_BUCKET = "avatars";

function emptyProfile(user: User): ApexProfile {
  const now = new Date().toISOString();
  return {
    id: user.id,
    full_name: typeof user.user_metadata.full_name === "string" ? user.user_metadata.full_name : null,
    avatar_url: null,
    avatar_path: null,
    date_of_birth: null,
    biological_sex: null,
    height_cm: null,
    weight_kg: null,
    body_fat_percentage: null,
    goal: null,
    target_weight_kg: null,
    activity_level_suggested: null,
    activity_level_selected: null,
    activity_assessment: null,
    training_frequency: null,
    goal_pace: null,
    onboarding_completed: false,
    created_at: now,
    updated_at: now,
  };
}

export async function loadProfile(user: User) {
  const supabase = createClient();
  const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (error) throw error;
  if (data) return normalizeProfile(data as ApexProfile);

  const initial = emptyProfile(user);
  const { data: inserted, error: insertError } = await supabase
    .from("profiles")
    .insert({ id: user.id, full_name: initial.full_name })
    .select("*")
    .single();
  if (insertError) throw insertError;
  return normalizeProfile(inserted as ApexProfile);
}

export async function getAvatarUrl(path: string | null) {
  if (!path) return null;
  const { data, error } = await createClient().storage.from(AVATAR_BUCKET).createSignedUrl(path, 60 * 60);
  if (error) throw error;
  return data.signedUrl;
}

export async function updateAccount(user: User, draft: AccountDraft) {
  const supabase = createClient();
  const fullName = draft.fullName.trim();
  const requestedEmail = draft.requestedEmail.trim().toLowerCase();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .update({ full_name: fullName, date_of_birth: draft.dateOfBirth })
    .eq("id", user.id)
    .select("*")
    .single();
  if (profileError) throw profileError;

  const { error: metadataError } = await supabase.auth.updateUser({ data: { full_name: fullName } });
  if (metadataError) throw metadataError;

  let pendingEmail: string | null = null;
  if (requestedEmail && requestedEmail !== user.email?.toLowerCase()) {
    const { data, error } = await supabase.auth.updateUser({ email: requestedEmail });
    if (error) throw error;
    const updatedUser = data.user as User & { new_email?: string };
    pendingEmail = updatedUser.new_email ?? requestedEmail;
  }

  return { profile: normalizeProfile(profile as ApexProfile), pendingEmail };
}

export async function updatePhysicalData(userId: string, draft: PhysicalDraft) {
  const supabase = createClient();
  const height = Number(draft.heightCm.replace(",", "."));
  const weight = Number(draft.weightKg.replace(",", "."));
  const bodyFat = draft.bodyFatPercentage.trim() ? Number(draft.bodyFatPercentage.replace(",", ".")) : null;
  const operationId = crypto.randomUUID();
  const { error: updateError } = await supabase.rpc("save_physical_data", {
    p_biological_sex: draft.biologicalSex as "male" | "female",
    p_height_cm: height,
    p_weight_kg: weight,
    p_body_fat_percentage: bodyFat,
    p_source: "profile",
    p_recorded_at: new Date().toISOString().slice(0, 10),
    p_operation_id: operationId,
  });
  if (updateError) throw updateError;

  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
  if (error) throw error;
  return normalizeProfile(data as ApexProfile);
}

export async function recordWeight(weightKg: number, source: WeightSource) {
  const operationId = crypto.randomUUID();
  const { error } = await createClient().rpc("record_weight", {
    p_weight_kg: weightKg,
    p_source: source,
    p_recorded_at: new Date().toISOString().slice(0, 10),
    p_operation_id: operationId,
  });
  if (error) throw error;
}

export async function loadWeightHistory(userId: string, dateFrom?: string, dateTo?: string) {
  let query = createClient()
    .from("weight_history")
    .select("*")
    .eq("user_id", userId)
    .order("recorded_at", { ascending: true })
    .order("created_at", { ascending: true });
  if (dateFrom) query = query.gte("recorded_at", dateFrom);
  if (dateTo) query = query.lte("recorded_at", dateTo);
  const { data, error } = await query;
  if (error) throw error;
  return (data as WeightHistoryEntry[]).map((entry) => ({ ...entry, weight_kg: Number(entry.weight_kg) }));
}

export async function updateGoal(userId: string, draft: GoalDraft) {
  const targetWeight = draft.goal === "maintain_weight" || !draft.targetWeightKg.trim() ? null : Number(draft.targetWeightKg.replace(",", "."));
  const trainingFrequency = draft.trainingFrequency.trim() ? Number(draft.trainingFrequency) : null;
  const { data, error } = await createClient()
    .from("profiles")
    .update({
      goal: draft.goal || null,
      target_weight_kg: targetWeight,
      activity_level_suggested: draft.activityLevelSuggested || null,
      activity_level_selected: draft.activityLevelSelected || null,
      activity_assessment: draft.activityAssessment as unknown as Json,
      training_frequency: trainingFrequency,
      goal_pace: draft.goalPace || null,
    })
    .eq("id", userId)
    .select("*")
    .single();
  if (error) throw error;
  return normalizeProfile(data as ApexProfile);
}

export async function uploadAvatar(userId: string, image: Blob, previousPath: string | null) {
  const supabase = createClient();
  const path = `${userId}/avatar.webp`;
  const { error: uploadError } = await supabase.storage.from(AVATAR_BUCKET).upload(path, image, {
    contentType: "image/webp",
    cacheControl: "3600",
    upsert: true,
  });
  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from("profiles")
    .update({ avatar_path: path, avatar_url: null })
    .eq("id", userId)
    .select("*")
    .single();
  if (error) throw error;

  if (previousPath && previousPath !== path) await supabase.storage.from(AVATAR_BUCKET).remove([previousPath]);
  return { profile: normalizeProfile(data as ApexProfile), avatarUrl: await getAvatarUrl(path) };
}

export async function removeAvatar(userId: string, path: string | null) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({ avatar_path: null, avatar_url: null })
    .eq("id", userId)
    .select("*")
    .single();
  if (error) throw error;
  if (path) {
    const { error: removeError } = await supabase.storage.from(AVATAR_BUCKET).remove([path]);
    if (removeError) throw removeError;
  }
  return normalizeProfile(data as ApexProfile);
}
