import { expect, test } from "@playwright/test";

test.skip(
  process.env.ENABLE_PAYMENT_TEST_DATA !== "true",
  "Run with ENABLE_PAYMENT_TEST_DATA=true to exercise development fixtures.",
);

test("test catalogue, currency display, quantity presets and quote boundary are visible", async ({
  page,
}) => {
  await page.goto("/shop/");
  for (const name of [
    "Standard Dried Copra · TEST",
    "Premium Dried Copra · TEST",
    "Wholesale Copra · TEST",
    "Bulk Copra Supply · TEST",
  ]) {
    await expect(page.getByRole("heading", { name })).toBeVisible();
  }

  await page.goto("/shop/test-standard-dried-copra/");
  await expect(page.getByText("Development test fixture · TEST ONLY")).toBeVisible();
  await expect(page.getByText(/₹35\.00 per kg/)).toBeVisible();
  await expect(page.getByRole("button", { name: "25 kg" })).toBeVisible();
  await expect(page.getByRole("button", { name: "5,000 kg" })).toBeVisible();

  await page.getByRole("button", { name: "299 kg" }).click();
  await expect(page.getByRole("button", { name: "Test checkout not configured" })).toBeDisabled();
  await page.getByRole("button", { name: "300 kg" }).click();
  await expect(page.getByText(/300 kg or more must use the quotation flow/)).toBeVisible();
  await expect(page.getByRole("button", { name: /Pay securely/ })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Request a quotation" })).toHaveAttribute(
    "href",
    /\/contact\/\?type=bulk&product=test-standard-dried-copra&quantity=300&unit=kg/,
  );

  await page.goto("/contact/");
  await expect(page.getByRole("combobox", { name: "Product" })).toContainText(
    "Standard Dried Copra · TEST · TEST ONLY",
  );
});
