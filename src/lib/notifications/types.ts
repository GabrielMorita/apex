export type NotificationKind = "habit" | "task" | "training" | "diet" | "weekly_review" | "daily_summary" | "system";

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  actionDestination: string | null;
  sourceType: "habit" | "task" | "training_schedule" | "diet_meal" | "weekly_review" | "daily_summary" | "system" | null;
  sourceId: string | null;
  scheduledFor: string;
  expiresAt: string | null;
  readAt: string | null;
  payload: Record<string, unknown>;
}

export interface NotificationPreferences {
  inAppEnabled: boolean;
  emailEnabled: boolean;
  pushEnabled: boolean;
  habitReminders: boolean;
  taskReminders: boolean;
  trainingReminders: boolean;
  dietReminders: boolean;
  weeklyReviewReminders: boolean;
  dailySummaryEnabled: boolean;
  reminderLeadMinutes: number;
  dailySummaryTime: string;
  weeklyReviewTime: string;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  timezone: string;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  inAppEnabled: true,
  emailEnabled: false,
  pushEnabled: false,
  habitReminders: true,
  taskReminders: true,
  trainingReminders: true,
  dietReminders: true,
  weeklyReviewReminders: true,
  dailySummaryEnabled: true,
  reminderLeadMinutes: 15,
  dailySummaryTime: "07:00",
  weeklyReviewTime: "18:00",
  quietHoursEnabled: true,
  quietHoursStart: "22:00",
  quietHoursEnd: "07:00",
  timezone: "America/Sao_Paulo",
};
