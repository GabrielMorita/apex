export function friendlyBillingError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  if (message.includes("billing_not_configured") || message.includes("cobrança ainda não está ativada")) return "A cobrança ainda não está ativada. Seu acesso Beta continua completo.";
  if (message.includes("already_subscribed")) return "Sua conta já possui uma assinatura em andamento.";
  if (message.includes("customer_not_found")) return "O portal ficará disponível depois da primeira assinatura.";
  if (message.includes("rate_limited")) return "Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.";
  if (message.includes("unauthorized") || message.includes("auth") || message.includes("session")) return "Sua sessão expirou. Entre novamente para continuar.";
  if (message.includes("failed to fetch") || message.includes("network") || message.includes("connection")) return "Não foi possível conectar ao serviço de cobrança. Tente novamente.";
  if (message.includes("billing_plans") || message.includes("my_billing_access")) return "Execute a migration v0.42.1 de Assinatura no Supabase.";
  return "Não foi possível concluir esta ação de assinatura. Nenhuma cobrança foi iniciada.";
}
