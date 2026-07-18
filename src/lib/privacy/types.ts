export type PrivacyDocumentType = "terms_of_use" | "privacy_notice" | "health_data_consent";
export type PrivacyChoiceEvent = "accepted" | "acknowledged" | "withdrawn";
export type PrivacyRequestType = "confirmation" | "access" | "correction" | "anonymization" | "deletion" | "portability" | "sharing_information" | "consent_revocation" | "objection" | "automated_decision_review" | "other";

export type PrivacyDocument = {
  id: string;
  documentType: PrivacyDocumentType;
  version: string;
  title: string;
  publicPath: string;
  publishedAt: string;
  effectiveAt: string;
};

export type PrivacyConsentEvent = {
  id: string;
  documentId: string;
  documentType: PrivacyDocumentType;
  documentVersion: string;
  eventType: PrivacyChoiceEvent;
  source: "signup" | "privacy_center" | "system";
  createdAt: string;
};

export type PrivacyPreferences = {
  productUpdatesEnabled: boolean;
  anonymousUsageAnalyticsEnabled: boolean;
  researchParticipationEnabled: boolean;
};

export type PrivacyRequest = {
  id: string;
  requestType: PrivacyRequestType;
  status: "received" | "in_review" | "waiting_user" | "completed" | "rejected" | "canceled";
  details: string;
  responseSummary: string | null;
  createdAt: string;
  completedAt: string | null;
};

export type PrivacyRetentionRule = {
  code: string;
  dataCategory: string;
  activeAccountPeriod: string;
  afterAccountDeletion: string;
  rationale: string;
  sortOrder: number;
};

export type PrivacyCenterState = {
  documents: PrivacyDocument[];
  consentEvents: PrivacyConsentEvent[];
  preferences: PrivacyPreferences;
  requests: PrivacyRequest[];
  retentionRules: PrivacyRetentionRule[];
};
