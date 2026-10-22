import { expect, test } from "@playwright/test";

test("homepage placeholder renders", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "SRI MAHADEVA & CO" })).toBeVisible();
});
