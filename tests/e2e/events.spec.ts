// tests/e2e/events.spec.ts

import { test, expect } from "@playwright/test";

// These tests run as authenticated user (from auth.setup.ts)

test.describe("Events", () => {
  test("events page loads with correct layout", async ({ page }) => {
    await page.goto("/events");
    await expect(page.getByRole("heading", { name: /events/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /new event/i })).toBeVisible();
  });

  test("category filters are visible and clickable", async ({ page }) => {
    await page.goto("/events");
    const allFilter = page.getByRole("button", { name: /^all$/i });
    await expect(allFilter).toBeVisible();
    await expect(allFilter).toHaveClass(/bg-primary/);

    const workshopFilter = page.getByRole("button", { name: /workshop/i });
    await workshopFilter.click();
    await expect(page).toHaveURL(/category=WORKSHOP/);
  });

  test("create event page loads", async ({ page }) => {
    await page.goto("/events/create");
    await expect(page.getByRole("heading", { name: /create new event/i })).toBeVisible();
    await expect(page.getByLabel(/event title/i)).toBeVisible();
  });

  test("create event form validates title", async ({ page }) => {
    await page.goto("/events/create");
    // Click submit without filling in title
    await page.getByRole("button", { name: /create event/i }).click();
    await expect(page.getByText(/at least 3 characters/i)).toBeVisible();
  });

  test("can fill create event form", async ({ page }) => {
    await page.goto("/events/create");

    await page.getByLabel(/event title/i).fill("Test Photography Workshop");
    await page.getByRole("button", { name: "Workshop" }).click();
    await page.getByRole("button", { name: /public/i }).click();
    await page.getByPlaceholder(/college auditorium/i).fill("Mumbai");

    // Verify form fields are populated
    await expect(page.getByLabel(/event title/i)).toHaveValue("Test Photography Workshop");
  });

  test("dashboard shows recent events", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByText(/recent events/i)).toBeVisible();
  });

  test("sidebar navigation works", async ({ page }) => {
    await page.goto("/dashboard");

    // Click Events in sidebar
    await page.getByRole("link", { name: /^events$/i }).click();
    await expect(page).toHaveURL("/events");

    // Click Gallery in sidebar
    await page.getByRole("link", { name: /gallery/i }).click();
    await expect(page).toHaveURL("/gallery");

    // Click Dashboard
    await page.getByRole("link", { name: /dashboard/i }).click();
    await expect(page).toHaveURL("/dashboard");
  });
});
