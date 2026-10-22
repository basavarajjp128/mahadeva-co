import { expect, test } from "@playwright/test";

test("home page presents wholesale product details and clear enquiry actions", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle("Wholesale Coconut Copra | SRI MAHADEVA & CO");
  await expect(
    page.getByRole("heading", { level: 1, name: "Coconut copra for wholesale trade." }),
  ).toBeVisible();
  await expect(
    page.getByRole("img", { name: "Aerial view of a dense coconut palm plantation." }),
  ).toBeVisible();
  await expect(
    page.getByRole("img", { name: /Close-up of light-brown dried coconuts/ }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /Explore Products/ })).toHaveAttribute(
    "href",
    "#product",
  );
  await expect(page.getByRole("link", { name: "Request a Bulk Quote" })).toHaveAttribute(
    "href",
    "#bulk-orders",
  );
  await expect(page.getByRole("heading", { name: "Coconut copra", level: 3 })).toBeVisible();
  await expect(page.locator(".brand-mark__image")).toHaveCount(2);
  await expect(page.locator(".brand-mark__image").first()).toHaveAttribute(
    "src",
    /sri-mahadeva-logo/,
  );
  await expect(
    page.getByRole("heading", { name: "Agree the details before you proceed." }),
  ).toBeVisible();
  await expect(page.getByText("[Add verified WhatsApp number]")).toBeVisible();
});

test("about page has page-specific metadata and an editable story placeholder", async ({
  page,
}) => {
  await page.goto("/about/");

  await expect(page).toHaveTitle("About Us | SRI MAHADEVA & CO");
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "A business focused on coconut copra wholesale trade.",
    }),
  ).toBeVisible();
  await expect(page.getByText("Editable content placeholder")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Sourcing details" })).toBeVisible();
  await expect(page.getByRole("link", { name: /WhatsApp enquiry/ }).first()).toHaveAttribute(
    "href",
    "/#contact-details",
  );
});

test("shop and product detail pages clearly identify sample content", async ({ page }) => {
  await page.goto("/shop/");

  await expect(page).toHaveTitle("Shop | Sample Copra Catalogue | SRI MAHADEVA & CO");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Copra for wholesale enquiries");
  await expect(page.getByText("Sample listing")).toBeVisible();
  await page.getByRole("link", { name: /View details/ }).click();

  await expect(page).toHaveURL(/\/shop\/copra\/$/);
  await expect(page).toHaveTitle("Coconut copra | Sample Product Details | SRI MAHADEVA & CO");
  await expect(page.getByText("Sample listing · information only")).toBeVisible();
  await expect(page.getByText("Not provided; confirm directly.")).toBeVisible();
  await expect(
    page.getByText(/does not confirm availability, reserve stock or place an order/),
  ).toBeVisible();
  await expect(page.getByLabel("Quantity")).toBeVisible();
  await expect(page.getByLabel("Unit")).toBeVisible();
});

test("shop and product details fit mobile, tablet and desktop widths", async ({ page }) => {
  for (const width of [390, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ["/shop/", "/shop/copra/"]) {
      await page.goto(path);
      const hasHorizontalOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth,
      );
      expect(hasHorizontalOverflow, `${path} horizontal overflow at ${width}px`).toBe(false);
    }
  }
});

test("shared navigation, footer links and in-page targets resolve", async ({ page }) => {
  await page.goto("/");

  const links = await page
    .locator("a[href]")
    .evaluateAll((elements) =>
      elements
        .map((element) => element.getAttribute("href"))
        .filter((href): href is string => href !== null),
    );

  for (const href of links) {
    if (href === "/about/") {
      await page.goto(href);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      continue;
    }

    const target = new URL(href, "http://127.0.0.1:3000");
    if (target.origin !== "http://127.0.0.1:3000") {
      continue;
    }

    await page.goto(`${target.pathname}${target.hash}`);
    if (target.hash) {
      await expect(page.locator(target.hash)).toHaveCount(1);
    } else {
      await expect(page.locator("main#main-content")).toBeVisible();
    }
  }
});

test("navigation adapts to mobile, tablet and desktop without horizontal overflow", async ({
  page,
}) => {
  for (const width of [390, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(hasHorizontalOverflow, `horizontal overflow at ${width}px`).toBe(false);

    if (width >= 1024) {
      await expect(page.getByRole("navigation", { name: "Main navigation" })).toBeVisible();
      await expect(page.locator(".mobile-nav")).toBeHidden();
    } else {
      await expect(page.locator(".mobile-nav summary")).toBeVisible();
      await expect(page.getByRole("navigation", { name: "Main navigation" })).toBeHidden();
    }
  }
});

test("mobile menu opens with keyboard and navigates to About Us", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const menuButton = page.locator(".mobile-nav summary");
  await menuButton.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("navigation", { name: "Mobile navigation" })).toBeVisible();
  await page.locator(".mobile-nav__panel").getByRole("link", { name: "About Us" }).click();
  await expect(page).toHaveURL(/\/about\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});
