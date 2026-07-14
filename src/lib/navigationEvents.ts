export const APEX_NAVIGATE_EVENT = "apex:navigate";

export function navigateTo(page: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<string>(APEX_NAVIGATE_EVENT, { detail: page }));
}
