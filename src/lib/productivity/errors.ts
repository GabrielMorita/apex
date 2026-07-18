export function friendlyProductivityError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  if (message.includes("relation") || message.includes("schema cache") || message.includes("function")) return "A estrutura de Produtividade ainda não foi instalada no Supabase.";
  if (message.includes("jwt") || message.includes("auth") || message.includes("session")) return "Sua sessão não está disponível. Entre novamente.";
  if (message.includes("fetch") || message.includes("network") || message.includes("connection")) return "Não foi possível conectar ao Supabase. Verifique sua internet.";
  if (message.includes("invalid") || message.includes("check constraint")) return "Revise os dados informados e tente novamente.";
  return "Não foi possível salvar ou carregar estes dados agora.";
}

