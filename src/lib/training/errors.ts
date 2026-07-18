export function friendlyTrainingError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  if (message.includes("failed to fetch") || message.includes("network") || message.includes("connection")) return "Não foi possível conectar ao Supabase. Verifique sua internet e tente novamente.";
  if (message.includes("jwt") || message.includes("session") || message.includes("authentication")) return "Sua sessão expirou. Entre novamente para continuar.";
  if (message.includes("training_") || message.includes("scheduled workout") || message.includes("template not found")) return "A estrutura do Treino ainda não está disponível. Execute a migration v0.30.0 no Supabase.";
  if (message.includes("completed exercise")) return "Um exercício com série concluída não pode ser substituído nesta sessão.";
  return "Não foi possível concluir esta ação. Tente novamente em instantes.";
}
