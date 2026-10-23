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
    /\/contact\/\?type=bulk/,
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
  await expect(page.getByText("+91 8971475042")).toBeVisible();
  await expect(page.getByRole("link", { name: /Enquire now/ }).first()).toHaveAttribute(
    "href",
    /\/contact\/\?type=general/,
  );
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
  await expect(page.getByRole("link", { name: "Discuss a wholesale requirement" })).toHaveAttribute(
    "href",
    /\/contact\/\?type=bulk/,
  );
});

test("gallery shows eight subjects, owner-supplied photos and placeholders responsively", async ({
  page,
}) => {
  await page.goto("/gallery/");

  await expect(page).toHaveTitle("Our Gallery | SRI MAHADEVA & CO");
  await expect(
    page.getByRole("heading", { level: 1, name: "From Coconut Farms to Copra" }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("link", { name: "Gallery" }),
  ).toHaveAttribute("aria-current", "page");
  await expect(page.locator(".gallery-card")).toHaveCount(8);
  await expect(page.locator(".gallery-card img")).toHaveCount(4);
  await expect
    .poll(() =>
      page
        .locator(".gallery-card img")
        .evaluateAll((images) =>
          images.every(
            (image) =>
              (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0,
          ),
        ),
    )
    .toBe(true);
  await expect(page.getByText("Copra drying photo to be added")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Open full-size image: Coconut plantation" }),
  ).toBeVisible();

  const desktopLink = page.getByRole("link", { name: "Open full-size image: Coconut plantation" });
  await desktopLink.hover();
  await expect(desktopLink.locator(".gallery-card__overlay-copy")).toHaveCSS("opacity", "1");
  await desktopLink.focus();
  await expect(desktopLink.locator(".gallery-card__overlay-copy")).toHaveCSS("opacity", "1");
  await expect(
    page
      .getByRole("navigation", { name: "Footer navigation" })
      .getByRole("link", { name: "Gallery" }),
  ).toHaveAttribute("href", "/gallery/");

  for (const width of [390, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(hasHorizontalOverflow, `gallery horizontal overflow at ${width}px`).toBe(false);
    if (width < 1024) {
      await expect(page.locator(".mobile-nav summary")).toBeVisible();
      const closedMobileMenu = page.locator(".mobile-nav:not([open]) summary");
      if (await closedMobileMenu.count()) {
        await closedMobileMenu.click();
      }
      await expect(
        page
          .getByRole("navigation", { name: "Mobile navigation" })
          .getByRole("link", { name: "Gallery" }),
      ).toBeVisible();
      await expect(
        page.locator(".gallery-card").first().locator(".gallery-card__caption"),
      ).toBeVisible();
    } else {
      await expect(
        page
          .getByRole("navigation", { name: "Main navigation" })
          .getByRole("link", { name: "Gallery" }),
      ).toBeVisible();
    }
  }
});

test("Contact and Bulk Orders pages provide validated enquiry workflows", async ({ page }) => {
  await page.addInitScript(() => {
    const testWindow = window as Window & { __capturedWhatsAppUrl?: string };
    window.open = (url) => {
      testWindow.__capturedWhatsAppUrl = String(url);
      return null;
    };
  });
  await page.goto("/contact/");
  await expect(page).toHaveTitle("Contact Us | SRI MAHADEVA & CO");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Let’s discuss your copra requirement.",
  );
  await expect(page.getByRole("link", { name: "Open a WhatsApp enquiry draft" })).toHaveAttribute(
    "href",
    /^https:\/\/wa\.me\/918971475042\?text=/,
  );
  await expect(page.getByText(/Business email is not configured yet/).first()).toBeVisible();
  await page.goto("/contact/?type=product&product=copra&quantity=2.5&unit=quintal&location=Mysuru");
  await expect(page.getByRole("heading", { name: "Your enquiry details" })).toBeVisible();
  await expect(page.getByText("2.5 quintal", { exact: false })).toBeVisible();
  await expect(page.getByLabel("Approximate quantity", { exact: false })).toHaveValue("2.5");
  await page.getByLabel("Name *", { exact: false }).fill("Asha Rao");
  await page.getByLabel("Email", { exact: true }).fill("asha@example.com");
  await page.getByLabel("Approximate quantity", { exact: false }).fill("15000");
  await page.locator('select[name="unit"]').selectOption("kg");
  await page.getByLabel("Delivery location (optional)").fill("Mysuru");
  await page.getByLabel("Message *", { exact: false }).fill("Please share a quotation.");
  await page.getByRole("button", { name: "Enquire Now" }).click();
  const capturedUrl = await page.evaluate(
    () => (window as Window & { __capturedWhatsAppUrl?: string }).__capturedWhatsAppUrl ?? "",
  );
  const whatsappUrl = new URL(capturedUrl);
  expect(whatsappUrl.origin).toBe("https://wa.me");
  expect(whatsappUrl.pathname).toBe("/918971475042");
  const whatsappMessage = whatsappUrl.searchParams.get("text") ?? "";
  expect(whatsappMessage).toContain("Enquiry type: Product enquiry");
  expect(whatsappMessage).toContain("Product: Coconut copra");
  expect(whatsappMessage).toContain("Quantity: 15,000 kg");
  expect(whatsappMessage).not.toContain("15,000 kg equivalent");
  expect(whatsappMessage).toContain("Delivery location: Mysuru");
  expect(whatsappMessage).toContain("Please share a quotation.");
  expect(whatsappMessage).not.toContain("asha@example.com");
  await page.goto("/bulk-orders/");
  await expect(page).toHaveTitle("Bulk Orders | SRI MAHADEVA & CO");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Request a quotation for your requirement.",
  );
  await expect(page.getByRole("link", { name: "Continue to Contact Us" })).toHaveAttribute(
    "href",
    /\/contact\/\?type=bulk/,
  );
  await expect(page.getByText(/does not confirm stock, price, delivery or an order/)).toBeVisible();
});

test("shop and product detail pages clearly identify sample content", async ({ page }) => {
  await page.goto("/shop/");

  await expect(page).toHaveTitle("Shop | Sample Copra Catalogue | SRI MAHADEVA & CO");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Copra for wholesale enquiries");
  await expect(page.getByText("Sample listing")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Enquire about this sample" }).first(),
  ).toHaveAttribute("href", /\/contact\/\?type=product&product=copra/);
  await expect(page.getByRole("link", { name: /View details/ }).first()).toHaveAttribute(
    "href",
    "/shop/copra/",
  );
  await page.goto("/shop/copra/");
  await expect(page).toHaveTitle("Coconut copra | Sample Product Details | SRI MAHADEVA & CO");
  await expect(page.getByText("Sample listing · information only")).toBeVisible();
  await expect(page.getByText("Not provided; confirm directly.")).toBeVisible();
  await expect(
    page.getByText(/does not confirm availability, reserve stock or place an order/),
  ).toBeVisible();
  await expect(page.getByLabel("Quantity")).toBeVisible();
  await expect(page.getByLabel("Unit")).toBeVisible();
  await page.getByLabel("Quantity").fill("0.5");
  await page.getByLabel("Unit").selectOption("metric ton");
  await page.getByLabel("Delivery location (optional)").fill("Mysuru & nearby");
  await expect(page.getByLabel("Quantity")).toHaveValue("0.5");
  await expect(page.getByLabel("Unit")).toHaveValue("metric ton");
  await expect(page.getByText(/Equivalent: 500 kg/)).toBeVisible();
  await expect(page.getByRole("link", { name: /Continue to Contact Us/ })).toHaveAttribute(
    "href",
    /\/contact\/\?type=product&product=copra&quantity=0\.5&unit=metric\+ton&location=Mysuru\+%26\+nearby/,
  );
});

test("shop and product details fit mobile, tablet and desktop widths", async ({ page }) => {
  for (const width of [390, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ["/shop/", "/shop/copra/", "/contact/", "/bulk-orders/"]) {
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

test("all enquiry calls to action route to Contact Us", async ({ page }) => {
  for (const path of ["/", "/about/", "/shop/", "/shop/copra/", "/bulk-orders/"]) {
    await page.goto(path);
    const enquiryLinks = page.locator('a[href^="/contact/"]');
    await expect(enquiryLinks.first(), `${path} should expose an enquiry route`).toBeVisible();
    const hrefs = await enquiryLinks.evaluateAll((links) =>
      links.map((link) => link.getAttribute("href")),
    );
    expect(
      hrefs.every((href) => href?.startsWith("/contact/")),
      path,
    ).toBe(true);
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

test("mobile menu exposes and opens Contact and Bulk Orders routes", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const menuButton = page.locator(".mobile-nav summary");
  await menuButton.focus();
  await page.keyboard.press("Enter");
  const mobileNavigation = page.getByRole("navigation", { name: "Mobile navigation" });
  await mobileNavigation.getByRole("link", { name: "Bulk Orders" }).click();
  await expect(page).toHaveURL(/\/bulk-orders\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  await page.goto("/");
  await menuButton.focus();
  await page.keyboard.press("Enter");
  await page
    .getByRole("navigation", { name: "Mobile navigation" })
    .getByRole("link", { name: "Contact" })
    .click();
  await expect(page).toHaveURL(/\/contact\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("reduced motion leaves content visible and disables nonessential motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator(".home-hero__title")).toHaveCSS("animation-name", "none");
  await expect(page.locator(".home-facts__item").first()).toHaveCSS("opacity", "1");

  await page.goto("/gallery/");
  await expect(page.locator(".gallery-card").first()).toHaveCSS("opacity", "1");
  await expect(page.locator(".gallery-card__caption").first()).toBeVisible();
});
