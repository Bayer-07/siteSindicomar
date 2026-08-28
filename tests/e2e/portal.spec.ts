import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("home apresenta a proposta e os caminhos principais", async ({ page }) => { await page.goto("/"); await expect(page.getByRole("heading", { name: /presente nas decisões do comércio/i })).toBeVisible(); await expect(page.getByRole("link", { name: /Acessar convenções/ })).toBeVisible(); });
test("documentos encerrados ficam no histórico", async ({ page }) => { await page.goto("/convencoes"); await expect(page.getByRole("heading", { name: "Acervo histórico" })).toBeVisible(); await expect(page.getByRole("link", { name: /CCT · 2025 Encerrado/ }).first()).toBeVisible(); });
test("página inicial não possui violações críticas de acessibilidade", async ({ page }) => { await page.goto("/"); const results = await new AxeBuilder({ page }).disableRules(["color-contrast"]).analyze(); expect(results.violations.filter((violation) => violation.impact === "critical")).toEqual([]); });
test("todas as rotas públicas acessíveis pela home respondem sem erro", async ({ page, request }) => {
  await page.goto("/");
  const hrefs = await page.locator('a[href^="/"]').evaluateAll((links) => [...new Set(links.map((link) => link.getAttribute("href")).filter((href): href is string => Boolean(href && !href.startsWith("/#") && !href.startsWith("/admin"))))]);
  for (const href of hrefs) { const response = await request.get(href); expect(response.status(), href).toBeLessThan(400); }
});
