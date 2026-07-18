import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run build && node .next/standalone/server.js",
    url: "http://127.0.0.1:3000/api/health",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      ...process.env,
      HOSTNAME: "127.0.0.1",
      PORT: "3000",
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_test",
      NEXT_PUBLIC_DATA_CONTROLLER_NAME: process.env.NEXT_PUBLIC_DATA_CONTROLLER_NAME || "Apex Testes",
      NEXT_PUBLIC_PRIVACY_CONTACT_EMAIL: process.env.NEXT_PUBLIC_PRIVACY_CONTACT_EMAIL || "privacidade@example.com",
      NEXT_PUBLIC_SUPPORT_EMAIL: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "suporte@example.com",
      APEX_BILLING_ENABLED: "false",
    },
  },
});
