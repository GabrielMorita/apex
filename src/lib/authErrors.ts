export function translateAuthError(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
  if (normalized.includes("email not confirmed")) return "Confirme seu e-mail antes de entrar.";
  if (normalized.includes("user already registered")) return "Já existe uma conta com esse e-mail.";
  if (normalized.includes("password should be")) return "A senha não atende aos requisitos mínimos.";
  if (normalized.includes("rate limit")) return "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
  if (normalized.includes("unable to validate email")) return "Digite um endereço de e-mail válido.";

  return "Não foi possível concluir a ação. Tente novamente.";
}
