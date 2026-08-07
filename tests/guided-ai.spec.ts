import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

const coreRoutes = [
  "/",
  "/ask-cellpinda/",
  "/product-overview/",
  "/manufacturing-quality/",
  "/scientific-evidence/",
  "/global-regulatory-index/",
  "/document-center/",
  "/case-studies/",
];

function collectRuntimeErrors(page: Page) {
  const errors: string[] = [];
  page.on("console", (message: { type(): string; text(): string }) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error: Error) => errors.push(error.message));
  return errors;
}

test("desktop guided flow, free question and persistent context", async ({ page, request }) => {
  const runtimeErrors = collectRuntimeErrors(page);

  const indexResponse = await request.get("/data/search-index.json");
  expect(indexResponse.ok()).toBeTruthy();
  const index = await indexResponse.json();
  expect(index.documents.length).toBeGreaterThan(0);

  await page.goto("/ask-cellpinda/");
  await expect(page.getByRole("heading", { name: "Ask Cellpinda" })).toBeVisible();
  await expect(page.getByText("What would you like to know?").first()).toBeVisible();

  await page.getByRole("button", { name: /I want to check regulation in my country/ }).click();
  await page.getByRole("button", { name: "Canada", exact: true }).click();
  await page.getByRole("button", { name: "Dietary supplement", exact: true }).click();
  await page.getByRole("button", { name: "Claims", exact: true }).click();

  await expect(page.getByText("Answer", { exact: true })).toBeVisible();
  await expect(page.getByText("Not yet reviewed", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("What would you like to explore next?", { exact: true })).toBeVisible();

  await page.getByPlaceholder("Ask your own question").fill("What documents do I need?");
  await page.getByRole("button", { name: "Ask", exact: true }).click();
  await expect(page.getByRole("heading", { name: "What documents do I need?" })).toBeVisible();
  await expect(page.getByLabel("Country")).toHaveValue("Canada");

  await page.getByLabel("Language").selectOption("Korean");
  await expect(page.getByText("다음으로 무엇을 확인하시겠습니까?", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("언어")).toHaveValue("Korean");
  await expect(page.getByLabel("국가")).toHaveValue("Canada");

  const hrefs = await page.locator("a[href]").evaluateAll((anchors) =>
    anchors.map((anchor) => anchor.getAttribute("href")),
  );
  expect(hrefs.filter((href) => href === "#" || href === "")).toEqual([]);
  expect(runtimeErrors).toEqual([]);
});

test("core dashboard routes and internal links resolve", async ({ request }) => {
  for (const route of coreRoutes) {
    const response = await request.get(route);
    expect(response.ok(), `${route} should resolve`).toBeTruthy();
  }
});

test.describe("mobile", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("guided controls remain touchable without horizontal overflow", async ({ page }) => {
    const runtimeErrors = collectRuntimeErrors(page);
    await page.goto("/ask-cellpinda/");

    await expect(page.getByRole("heading", { name: "Ask Cellpinda" })).toBeVisible();
    const firstChoice = page.getByRole("button", { name: /I want to know the product/ });
    const box = await firstChoice.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(48);

    const noHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    );
    expect(noHorizontalOverflow).toBeTruthy();

    await firstChoice.click();
    await expect(page.getByRole("button", { name: "GABA 100% ingredient", exact: true })).toBeVisible();
    await expect(page.getByPlaceholder("Ask your own question")).toBeVisible();
    expect(runtimeErrors).toEqual([]);
  });
});
