import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("home apresenta a proposta e os caminhos principais", async ({ page }) => { await page.goto("/"); await expect(page.getByRole("heading", { name: /Orientação segura/ })).toBeVisible(); await expect(page.getByRole("link", { name: /Consultar convenções/ }).first()).toBeVisible(); });
test("documentos encerrados ficam no histórico", async ({ page }) => { await page.goto("/convencoes"); await expect(page.getByRole("heading", { name: "Acervo histórico" })).toBeVisible(); await expect(page.getByRole("link", { name: /CCT · 2025 Encerrado/ })).toBeVisible(); });
test("página inicial não possui violações críticas de acessibilidade", async ({ page }) => { await page.goto("/"); const results = await new AxeBuilder({ page }).disableRules(["color-contrast"]).analyze(); expect(results.violations.filter((violation) => violation.impact === "critical")).toEqual([]); });
