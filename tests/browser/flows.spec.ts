import { test, expect } from "@playwright/test";
import { mkdirSync } from "node:fs";
test("desktop and mobile layouts render without overflow or broken local images", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Thoughtful care/ })).toBeVisible();
  await expect(page.locator(".hero-visual img")).toHaveJSProperty("complete", true);
  expect(
    await page.locator(".hero-visual img").evaluate((img: HTMLImageElement) => img.naturalWidth),
  ).toBeGreaterThan(0);
  for (const image of await page.locator("main img:visible").all()) {
    await image.scrollIntoViewIfNeeded();
    await expect(image).toHaveJSProperty("complete", true);
    expect(await image.evaluate((node: HTMLImageElement) => node.naturalWidth)).toBeGreaterThan(0);
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  mkdirSync("artifacts", { recursive: true });
  await page.screenshot({ path: "artifacts/home-desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "artifacts/home-mobile.png", fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.setViewportSize({ width: 320, height: 800 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.getByRole("button", { name: "Open menu" }).click();
  await expect(page.getByRole("navigation", { name: "Mobile navigation" })).toBeVisible();
  await page
    .getByRole("navigation", { name: "Mobile navigation" })
    .getByRole("link", { name: "Find us" })
    .click();
  await expect(page.getByRole("heading", { name: /Right here/ })).toBeVisible();
  expect(errors).toEqual([]);
});
test("patient books; independent owner confirms and reschedules; patient checks and cancels", async ({
  page,
  browser,
}) => {
  const tomorrow = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Karachi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(Date.now() + 86400000));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/booking");
  await page.getByLabel("Your preferred date").fill(tomorrow);
  await page.locator(".slot").first().click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({ path: "artifacts/booking-mobile.png", fullPage: true });
  await page.getByRole("button", { name: "Continue to your details" }).click();
  await page.getByLabel("Full name", { exact: true }).fill("Browser Test Patient");
  await page.getByLabel("Phone number", { exact: true }).fill("03117594193");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Request appointment", exact: true }).click();
  await expect(page.getByRole("heading", { name: "You’re on our list." })).toBeVisible();
  const reference = await page.locator(".reference").innerText();
  const ownerContext = await browser.newContext();
  const owner = await ownerContext.newPage();
  await owner.goto("http://127.0.0.1:5180/owner");
  await owner.getByLabel("Username", { exact: true }).fill("browser-owner");
  await owner.getByLabel("Password", { exact: true }).fill("Browser-test-only-password!");
  await owner.getByRole("button", { name: "Open clinic desk" }).click();
  await expect(owner.getByRole("heading", { name: "Your day, in view." })).toBeVisible();
  await owner.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(owner.locator(".appointment-row .status")).toHaveText("confirmed");
  await owner.getByRole("button", { name: "Reschedule", exact: true }).click();
  await owner.getByLabel("New date", { exact: true }).fill(tomorrow);
  await expect(owner.getByRole("combobox", { name: "Available time", exact: true })).toBeEnabled();
  await expect(
    owner.getByRole("combobox", { name: "Available time", exact: true }).locator("option"),
  ).not.toHaveCount(1);
  await owner
    .getByRole("combobox", { name: "Available time", exact: true })
    .selectOption({ index: 1 });
  await owner.getByRole("button", { name: "Save new time" }).click();
  await expect(owner.getByRole("dialog")).not.toBeVisible();
  await owner.reload();
  await expect(owner.getByRole("heading", { name: "Your day, in view." })).toBeVisible();
  await expect(owner.locator(".appointment-row .status")).toHaveText("confirmed");
  await expect(owner.getByRole("region", { name: "Seven-day schedule" })).toBeVisible();
  const day = owner.getByRole("button", { name: tomorrow + ": 1 appointments", exact: true });
  await day.click();
  await expect(owner.locator('.desk-filters input[type="date"]')).toHaveValue(tomorrow);
  await expect(owner.locator(".appointment-row")).toHaveCount(1);
  await day.click();
  await expect(owner.locator('.desk-filters input[type="date"]')).toHaveValue("");
  await owner.screenshot({ path: "artifacts/owner-desktop.png", fullPage: true });
  await owner.setViewportSize({ width: 390, height: 844 });
  expect(
    await owner.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).toBe(true);
  await owner.screenshot({ path: "artifacts/owner-mobile.png", fullPage: true });
  await page.reload();
  await page.getByLabel("Private booking reference", { exact: true }).fill(reference);
  await page.getByRole("button", { name: "Check appointment", exact: true }).click();
  await expect(page.locator(".managed-result .status")).toHaveText("confirmed");
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Cancel this appointment", exact: true }).click();
  await expect(page.locator(".managed-result .status")).toHaveText("cancelled");
  await owner.getByRole("button", { name: "Refresh clinic desk" }).click();
  await owner.getByRole("combobox", { name: "Status", exact: true }).selectOption("cancelled");
  await expect(owner.locator(".appointment-row .status")).toHaveText("cancelled");
  await ownerContext.close();
});
test("contact enquiry appears in owner inbox and can be marked read", async ({ page }) => {
  await page.goto("/contact");
  await page.getByLabel("Full name", { exact: true }).fill("Enquiry Test");
  await page.getByLabel("Phone number", { exact: true }).fill("03117594193");
  await page
    .getByLabel("Message", { exact: true })
    .fill("Please call me about a first appointment.");
  await page.getByRole("button", { name: "Send your message" }).click();
  await expect(page.getByRole("heading", { name: "Your message is with us." })).toBeVisible();
  await page.goto("/owner");
  await page.getByLabel("Username", { exact: true }).fill("browser-owner");
  await page.getByLabel("Password", { exact: true }).fill("Browser-test-only-password!");
  await page.getByRole("button", { name: "Open clinic desk" }).click();
  await page.getByRole("button", { name: "Messages", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Enquiry Test" })).toBeVisible();
  await page.getByRole("button", { name: "Mark read" }).click();
  await expect(page.getByRole("button", { name: "Mark read" })).not.toBeVisible();
});
