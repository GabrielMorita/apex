import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

export type AccountExport = {
  schema_version: "3.0";
  exported_at: string;
  account: {
    id: string;
    email: string | null;
    created_at: string;
    last_sign_in_at: string | null;
    metadata: Record<string, unknown>;
  };
  profile: unknown;
  weight_history: unknown[];
  module_state: unknown[];
  diet: {
    preferences: unknown;
    targets: unknown;
    plans: unknown[];
    days: unknown[];
    meals: unknown[];
    items: unknown[];
    consumption: unknown[];
    custom_foods: unknown[];
    food_favorites: unknown[];
    shopping_checks: unknown[];
    recipes: unknown[];
    recipe_items: unknown[];
    meal_templates: unknown[];
    meal_template_items: unknown[];
  };
  training: {
    custom_exercises: unknown[];
    templates: unknown[];
    template_exercises: unknown[];
    cycles: unknown[];
    schedule: unknown[];
    sessions: unknown[];
    session_sets: unknown[];
  };
  productivity: {
    habits: unknown[];
    habit_entries: unknown[];
    habit_day_plans: unknown[];
    tasks: unknown[];
    task_entries: unknown[];
    goals: unknown[];
    goal_habits: unknown[];
    goal_training_templates: unknown[];
    daily_checkins: unknown[];
    day_moods: unknown[];
    inbox_items: unknown[];
    weekly_reviews: unknown[];
    focus_sessions: unknown[];
    reading_cycles: unknown[];
    reading_projects: unknown[];
    reading_sessions: unknown[];
  };
  notifications: {
    preferences: unknown;
    inbox: unknown[];
    push_subscriptions: unknown[];
  };
  billing: {
    plans: unknown[];
    customers: unknown[];
    subscriptions: unknown[];
    invoices: unknown[];
    checkout_attempts: unknown[];
  };
  privacy: {
    documents: unknown[];
    consent_events: unknown[];
    preferences: unknown;
    requests: unknown[];
    request_events: unknown[];
    retention_rules: unknown[];
  };
  storage: { avatars: string[] };
};

export async function buildAccountExport(user: User): Promise<AccountExport> {
  const supabase = createClient();
  const [profileResult, weightResult, stateResult, avatarResult, preferencesResult, targetsResult, plansResult, daysResult, mealsResult, itemsResult, consumptionResult, customFoodsResult, favoritesResult, shoppingChecksResult, recipesResult, recipeItemsResult, templatesResult, templateItemsResult, trainingExercisesResult, trainingTemplatesResult, trainingTemplateExercisesResult, trainingCyclesResult, trainingScheduleResult, trainingSessionsResult, trainingSessionSetsResult] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("weight_history").select("*").eq("user_id", user.id).order("recorded_at", { ascending: true }),
    supabase.from("user_module_state").select("storage_key,payload,created_at,updated_at").eq("user_id", user.id).order("storage_key"),
    supabase.storage.from("avatars").list(user.id, { limit: 100, sortBy: { column: "name", order: "asc" } }),
    supabase.from("diet_preferences").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("nutrition_targets").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("diet_plans").select("*").eq("user_id", user.id).order("week_start"),
    supabase.from("diet_plan_days").select("*").eq("user_id", user.id).order("plan_date"),
    supabase.from("diet_meals").select("*").eq("user_id", user.id).order("created_at"),
    supabase.from("diet_meal_items").select("*").eq("user_id", user.id).order("created_at"),
    supabase.from("diet_consumption_entries").select("*").eq("user_id", user.id).order("consumed_at"),
    supabase.from("food_catalog").select("*").eq("user_id", user.id).eq("source_type", "custom").order("created_at"),
    supabase.from("diet_food_favorites").select("*").eq("user_id", user.id).order("created_at"),
    supabase.from("diet_shopping_checks").select("*").eq("user_id", user.id).order("week_start").order("checked_at"),
    supabase.from("diet_recipes").select("*").eq("user_id", user.id).order("created_at"),
    supabase.from("diet_recipe_items").select("*").eq("user_id", user.id).order("recipe_id").order("item_order"),
    supabase.from("diet_meal_templates").select("*").eq("user_id", user.id).order("created_at"),
    supabase.from("diet_meal_template_items").select("*").eq("user_id", user.id).order("template_id").order("item_order"),
    supabase.from("training_exercises").select("*").eq("user_id", user.id).eq("source_type", "custom").order("created_at"),
    supabase.from("training_templates").select("*").eq("user_id", user.id).order("created_at"),
    supabase.from("training_template_exercises").select("*").eq("user_id", user.id).order("template_id").order("exercise_order"),
    supabase.from("training_cycles").select("*").eq("user_id", user.id).order("start_date"),
    supabase.from("training_schedule").select("*").eq("user_id", user.id).order("scheduled_date"),
    supabase.from("training_sessions").select("*").eq("user_id", user.id).order("started_at"),
    supabase.from("training_session_sets").select("*").eq("user_id", user.id).order("created_at"),
  ]);

  const firstError = profileResult.error ?? weightResult.error ?? stateResult.error ?? avatarResult.error ?? preferencesResult.error ?? targetsResult.error ?? plansResult.error ?? daysResult.error ?? mealsResult.error ?? itemsResult.error ?? consumptionResult.error ?? customFoodsResult.error ?? favoritesResult.error ?? shoppingChecksResult.error ?? recipesResult.error ?? recipeItemsResult.error ?? templatesResult.error ?? templateItemsResult.error ?? trainingExercisesResult.error ?? trainingTemplatesResult.error ?? trainingTemplateExercisesResult.error ?? trainingCyclesResult.error ?? trainingScheduleResult.error ?? trainingSessionsResult.error ?? trainingSessionSetsResult.error;
  if (firstError) throw firstError;

  const [habitsResult, habitEntriesResult, habitPlansResult, tasksResult, taskEntriesResult, goalsResult, goalHabitsResult, goalTrainingResult, checkinsResult, moodsResult, inboxResult, reviewsResult, focusResult, readingCyclesResult, readingProjectsResult, readingSessionsResult, notificationPreferencesResult, notificationsResult, pushSubscriptionsResult, billingPlansResult, billingCustomersResult, billingSubscriptionsResult, billingInvoicesResult, billingCheckoutsResult, privacyDocumentsResult, privacyConsentsResult, privacyPreferencesResult, privacyRequestsResult, privacyRequestEventsResult, privacyRetentionResult] = await Promise.all([
    supabase.from("productivity_habits").select("*").eq("user_id", user.id).order("created_at"),
    supabase.from("productivity_habit_entries").select("*").eq("user_id", user.id).order("entry_date"),
    supabase.from("productivity_habit_day_plans").select("*").eq("user_id", user.id).order("plan_date"),
    supabase.from("productivity_tasks").select("*").eq("user_id", user.id).order("created_at"),
    supabase.from("productivity_task_entries").select("*").eq("user_id", user.id).order("entry_date"),
    supabase.from("productivity_goals").select("*").eq("user_id", user.id).order("target_date"),
    supabase.from("productivity_goal_habits").select("*").eq("user_id", user.id),
    supabase.from("productivity_goal_training_templates").select("*").eq("user_id", user.id),
    supabase.from("productivity_daily_checkins").select("*").eq("user_id", user.id).order("checkin_date"),
    supabase.from("productivity_day_moods").select("*").eq("user_id", user.id).order("mood_date"),
    supabase.from("productivity_inbox_items").select("*").eq("user_id", user.id).order("created_at"),
    supabase.from("productivity_weekly_reviews").select("*").eq("user_id", user.id).order("week_start"),
    supabase.from("productivity_focus_sessions").select("*").eq("user_id", user.id).order("session_date"),
    supabase.from("reading_cycles").select("*").eq("user_id", user.id).order("start_date"),
    supabase.from("reading_projects").select("*").eq("user_id", user.id).order("created_at"),
    supabase.from("reading_sessions").select("*").eq("user_id", user.id).order("session_date"),
    supabase.from("notification_preferences").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("notifications").select("*").eq("user_id", user.id).order("scheduled_for"),
    supabase.from("notification_push_subscriptions").select("*").eq("user_id", user.id).order("created_at"),
    supabase.from("billing_plans").select("*").order("sort_order"),
    supabase.from("billing_customers").select("*").eq("user_id", user.id).order("created_at"),
    supabase.from("billing_subscriptions").select("*").eq("user_id", user.id).order("created_at"),
    supabase.from("billing_invoices").select("*").eq("user_id", user.id).order("created_at"),
    supabase.from("billing_checkout_attempts").select("*").eq("user_id", user.id).order("created_at"),
    supabase.from("privacy_documents").select("*").order("published_at"),
    supabase.from("privacy_consent_events").select("*").eq("user_id", user.id).order("created_at"),
    supabase.from("privacy_preferences").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("privacy_requests").select("*").eq("user_id", user.id).order("created_at"),
    supabase.from("privacy_request_events").select("*").eq("user_id", user.id).order("created_at"),
    supabase.from("privacy_retention_rules").select("*").eq("is_active", true).order("sort_order"),
  ]);
  const productivityError = habitsResult.error ?? habitEntriesResult.error ?? habitPlansResult.error ?? tasksResult.error ?? taskEntriesResult.error ?? goalsResult.error ?? goalHabitsResult.error ?? goalTrainingResult.error ?? checkinsResult.error ?? moodsResult.error ?? inboxResult.error ?? reviewsResult.error ?? focusResult.error ?? readingCyclesResult.error ?? readingProjectsResult.error ?? readingSessionsResult.error ?? notificationPreferencesResult.error ?? notificationsResult.error ?? pushSubscriptionsResult.error ?? billingPlansResult.error ?? billingCustomersResult.error ?? billingSubscriptionsResult.error ?? billingInvoicesResult.error ?? billingCheckoutsResult.error ?? privacyDocumentsResult.error ?? privacyConsentsResult.error ?? privacyPreferencesResult.error ?? privacyRequestsResult.error ?? privacyRequestEventsResult.error ?? privacyRetentionResult.error;
  if (productivityError) throw productivityError;

  return {
    schema_version: "3.0",
    exported_at: new Date().toISOString(),
    account: {
      id: user.id,
      email: user.email ?? null,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at ?? null,
      metadata: user.user_metadata ?? {},
    },
    profile: profileResult.data,
    weight_history: weightResult.data ?? [],
    module_state: stateResult.data ?? [],
    diet: {
      preferences: preferencesResult.data,
      targets: targetsResult.data,
      plans: plansResult.data ?? [],
      days: daysResult.data ?? [],
      meals: mealsResult.data ?? [],
      items: itemsResult.data ?? [],
      consumption: consumptionResult.data ?? [],
      custom_foods: customFoodsResult.data ?? [],
      food_favorites: favoritesResult.data ?? [],
      shopping_checks: shoppingChecksResult.data ?? [],
      recipes: recipesResult.data ?? [],
      recipe_items: recipeItemsResult.data ?? [],
      meal_templates: templatesResult.data ?? [],
      meal_template_items: templateItemsResult.data ?? [],
    },
    training: {
      custom_exercises: trainingExercisesResult.data ?? [],
      templates: trainingTemplatesResult.data ?? [],
      template_exercises: trainingTemplateExercisesResult.data ?? [],
      cycles: trainingCyclesResult.data ?? [],
      schedule: trainingScheduleResult.data ?? [],
      sessions: trainingSessionsResult.data ?? [],
      session_sets: trainingSessionSetsResult.data ?? [],
    },
    productivity: {
      habits: habitsResult.data ?? [],
      habit_entries: habitEntriesResult.data ?? [],
      habit_day_plans: habitPlansResult.data ?? [],
      tasks: tasksResult.data ?? [],
      task_entries: taskEntriesResult.data ?? [],
      goals: goalsResult.data ?? [],
      goal_habits: goalHabitsResult.data ?? [],
      goal_training_templates: goalTrainingResult.data ?? [],
      daily_checkins: checkinsResult.data ?? [],
      day_moods: moodsResult.data ?? [],
      inbox_items: inboxResult.data ?? [],
      weekly_reviews: reviewsResult.data ?? [],
      focus_sessions: focusResult.data ?? [],
      reading_cycles: readingCyclesResult.data ?? [],
      reading_projects: readingProjectsResult.data ?? [],
      reading_sessions: readingSessionsResult.data ?? [],
    },
    notifications: {
      preferences: notificationPreferencesResult.data,
      inbox: notificationsResult.data ?? [],
      push_subscriptions: pushSubscriptionsResult.data ?? [],
    },
    billing: {
      plans: billingPlansResult.data ?? [],
      customers: billingCustomersResult.data ?? [],
      subscriptions: billingSubscriptionsResult.data ?? [],
      invoices: billingInvoicesResult.data ?? [],
      checkout_attempts: billingCheckoutsResult.data ?? [],
    },
    privacy: {
      documents: privacyDocumentsResult.data ?? [],
      consent_events: privacyConsentsResult.data ?? [],
      preferences: privacyPreferencesResult.data,
      requests: privacyRequestsResult.data ?? [],
      request_events: privacyRequestEventsResult.data ?? [],
      retention_rules: privacyRetentionResult.data ?? [],
    },
    storage: { avatars: (avatarResult.data ?? []).map((file) => `${user.id}/${file.name}`) },
  };
}

export function downloadAccountExport(data: AccountExport) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `apex-dados-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function updatePassword(password: string) {
  const { error } = await createClient().auth.updateUser({ password });
  if (error) throw error;
}

export async function signOutOtherSessions() {
  const { error } = await createClient().auth.signOut({ scope: "others" });
  if (error) throw error;
}

export async function deleteAccount() {
  const { data, error } = await createClient().functions.invoke("delete-account", {
    method: "POST",
    body: { confirmation: "EXCLUIR" },
  });
  if (error) {
    const context = (error as { context?: unknown }).context;
    if (context instanceof Response) {
      const payload = await context.clone().json().catch(() => null) as { error?: string } | null;
      if (payload?.error === "ACTIVE_SUBSCRIPTION_MUST_BE_CANCELED") throw new Error("ACTIVE_SUBSCRIPTION_MUST_BE_CANCELED");
    }
    throw error;
  }
  if (!data?.deleted) throw new Error("A exclusão da conta não foi confirmada pelo servidor.");
}
