import { expect, test } from "@playwright/test";

test("farmer can review a selling enquiry and explicitly open a WhatsApp draft", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await page.locator(".mobile-nav summary").click();
  await page
    .getByRole("navigation", { name: "Mobile navigation" })
    .getByRole("link", { name: "Sell Copra" })
    .click();
  await expect(page).toHaveURL(/\/sell-your-copra\/$/);
  await expect(page).toHaveTitle("Sell Your Copra | SRI MAHADEVA & CO");
  await expect(page.getByRole("heading", { level: 1, name: "Sell Your Copra" })).toBeVisible();
  await expect(
    page.getByRole("img", { name: /Coconut farming photograph supplied/ }),
  ).toBeVisible();

  await page.getByLabel("Farmer’s full name *").fill("Test Farmer");
  await page.getByLabel("Mobile number *").fill("8971475042");
  await page.getByLabel("Available quantity *").fill("2.5");
  await page.getByLabel("Unit *").selectOption("metric tonne");
  await page.getByLabel("Copra grade").selectOption("Standard");
  await page.getByLabel("Village/town and district *").fill("Test village, Test district");
  await page.getByLabel("Additional notes (optional)").fill("Available for discussion");
  await page.getByRole("button", { name: "Review selling enquiry" }).click();

  await expect(page.getByText("2.5 metric tonne · 2,500 kg equivalent")).toBeVisible();
  await expect(page.getByText(/not a confirmed sale or guaranteed price/)).toBeVisible();
  const validationResponse = page.waitForResponse("**/api/supplier-enquiries/validate/");
  await page.getByRole("button", { name: "Continue to WhatsApp" }).click();
  expect((await validationResponse).status()).toBe(200);
  await expect(page.getByText(/has not saved or sent your enquiry/)).toBeVisible();

  const whatsapp = page.getByRole("link", { name: "Request a Call Back" });
  const href = await whatsapp.getAttribute("href");
  expect(href).toMatch(/^https:\/\/wa\.me\/918971475042\?text=/);
  const message = new URL(href as string).searchParams.get("text");
  expect(message).toContain("Farmer: Test Farmer");
  expect(message).toContain("Available quantity: 2.5 metric tonne (2,500 kg equivalent)");
  expect(message).toContain("Village/town and district: Test village, Test district");
  expect(message).toContain("Additional notes: Available for discussion");

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);
});
