import "server-only";

const PUBLIC_CODES = new Set([
  "BILLING_NOT_CONFIGURED",
  "ALREADY_SUBSCRIBED",
  "CUSTOMER_NOT_FOUND",
  "INVALID_PLAN",
  "UNAUTHORIZED",
  "RATE_LIMITED",
]);

export function publicBillingError(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  return PUBLIC_CODES.has(message) ? message : "BILLING_REQUEST_FAILED";
}
