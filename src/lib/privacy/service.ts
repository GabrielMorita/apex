import { createClient } from "@/lib/supabase/client";
import type { PrivacyCenterState, PrivacyChoiceEvent, PrivacyDocumentType, PrivacyPreferences, PrivacyRequestType } from "@/lib/privacy/types";

const defaultPreferences: PrivacyPreferences = {
  productUpdatesEnabled: false,
  anonymousUsageAnalyticsEnabled: false,
  researchParticipationEnabled: false,
};

export async function loadPrivacyCenter(userId: string): Promise<PrivacyCenterState> {
  const supabase = createClient();
  const [documentsResult, eventsResult, preferencesResult, requestsResult, retentionResult] = await Promise.all([
    supabase.from("privacy_documents").select("*").eq("is_current", true).order("document_type"),
    supabase.from("privacy_consent_events").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("privacy_preferences").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("privacy_requests").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(20),
    supabase.from("privacy_retention_rules").select("*").eq("is_active", true).order("sort_order"),
  ]);
  const error = documentsResult.error ?? eventsResult.error ?? preferencesResult.error ?? requestsResult.error ?? retentionResult.error;
  if (error) throw error;
  const preferenceRow = preferencesResult.data;
  return {
    documents: (documentsResult.data ?? []).map((row) => ({ id: row.id, documentType: row.document_type, version: row.version, title: row.title, publicPath: row.public_path, publishedAt: row.published_at, effectiveAt: row.effective_at })),
    consentEvents: (eventsResult.data ?? []).map((row) => ({ id: row.id, documentId: row.document_id, documentType: row.document_type, documentVersion: row.document_version, eventType: row.event_type, source: row.source, createdAt: row.created_at })),
    preferences: preferenceRow ? { productUpdatesEnabled: preferenceRow.product_updates_enabled, anonymousUsageAnalyticsEnabled: preferenceRow.anonymous_usage_analytics_enabled, researchParticipationEnabled: preferenceRow.research_participation_enabled } : defaultPreferences,
    requests: (requestsResult.data ?? []).map((row) => ({ id: row.id, requestType: row.request_type, status: row.status, details: row.details, responseSummary: row.response_summary, createdAt: row.created_at, completedAt: row.completed_at })),
    retentionRules: (retentionResult.data ?? []).map((row) => ({ code: row.code, dataCategory: row.data_category, activeAccountPeriod: row.active_account_period, afterAccountDeletion: row.after_account_deletion, rationale: row.rationale, sortOrder: row.sort_order })),
  };
}

export async function recordPrivacyChoice(documentType: PrivacyDocumentType, eventType: PrivacyChoiceEvent) {
  const { error } = await createClient().rpc("record_my_privacy_choice", { p_document_type: documentType, p_event_type: eventType });
  if (error) throw error;
}

export async function savePrivacyPreferences(userId: string, preferences: PrivacyPreferences) {
  const { error } = await createClient().from("privacy_preferences").upsert({
    user_id: userId,
    product_updates_enabled: preferences.productUpdatesEnabled,
    anonymous_usage_analytics_enabled: preferences.anonymousUsageAnalyticsEnabled,
    research_participation_enabled: preferences.researchParticipationEnabled,
  }, { onConflict: "user_id" });
  if (error) throw error;
}

export async function submitPrivacyRequest(requestType: PrivacyRequestType, details: string) {
  const { error } = await createClient().rpc("submit_my_privacy_request", { p_request_type: requestType, p_details: details });
  if (error) throw error;
}

export function friendlyPrivacyError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  if (message.includes("privacy_documents") || message.includes("privacy_preferences") || message.includes("record_my_privacy_choice")) return "Execute a migration v0.48.0 de Privacidade e LGPD no Supabase.";
  if (message.includes("failed to fetch") || message.includes("network") || message.includes("connection")) return "Não foi possível conectar ao Supabase. Verifique sua conexão e tente novamente.";
  return "Não foi possível concluir a operação de privacidade. Tente novamente.";
}
