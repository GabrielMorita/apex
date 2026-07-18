import { expect, test } from "@playwright/test";

test("health check informa versão operacional", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.ok()).toBe(true);
  await expect(response.json()).resolves.toMatchObject({ status: "ok", service: "apex", version: "0.60.0" });
});

for (const document of [
  { path: "/termos", heading: "Termos de Uso do Apex" },
  { path: "/privacidade", heading: "Aviso de Privacidade do Apex" },
  { path: "/dados-saude", heading: "Dados de Saúde e Personalização" },
]) {
  test(`${document.path} permanece público`, async ({ page }) => {
    await page.goto(document.path);
    await expect(page.getByRole("heading", { name: document.heading })).toBeVisible();
  });
}

test("cadastro exige escolhas de idade, termos e dados de saúde", async ({ page }) => {
  await page.goto("/cadastro");
  await expect(page.getByText("Confirmo que tenho 18 anos ou mais.")).toBeVisible();
  await expect(page.getByText("Consentimento destacado:")).toBeVisible();
  await expect(page.getByRole("link", { name: "Termos de Uso" })).toHaveAttribute("href", "/termos");
});

test("canal de suporte está publicado", async ({ page }) => {
  await page.goto("/suporte");
  await expect(page.getByRole("heading", { name: "Suporte" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Enviar e-mail para o suporte" })).toHaveAttribute("href", /mailto:suporte@example\.com/);
});
