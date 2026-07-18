export function friendlyNotificationError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  if (message.includes("notification_preferences") || message.includes("notifications") || message.includes("sync_my_notifications") || message.includes("schema cache")) return "A estrutura de Notificações ainda não foi instalada no Supabase.";
  if (message.includes("jwt") || message.includes("auth") || message.includes("session")) return "Sua sessão não está disponível. Entre novamente.";
  if (message.includes("fetch") || message.includes("network") || message.includes("connection")) return "Não foi possível conectar ao Supabase.";
  return "Não foi possível atualizar as notificações agora.";
}
