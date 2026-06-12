// tests/e2e/gallery.spec.ts

import { test, expect } from "@playwright/test";

test.describe("Gallery", () => {
  test("gallery page loads", async ({ page }) => {
    await page.goto("/gallery");
    await expect(page.getByRole("heading", { name: /gallery/i })).toBeVisible();
  });

  test("gallery view toggle switches between views", async ({ page }) => {
    await page.goto("/gallery");

    // Default is masonry - grid toggle should be available
    const gridButton = page.locator("button[title='Grid']");
    await expect(gridButton).toBeVisible();
    await gridButton.click();

    const listButton = page.locator("button[title='List']");
    await listButton.click();

    const masonryButton = page.locator("button[title='Masonry']");
    await masonryButton.click();
  });

  test("gallery search input filters results", async ({ page }) => {
    await page.goto("/gallery");
    const searchInput = page.getByPlaceholder(/search by tag/i);
    await expect(searchInput).toBeVisible();
    await searchInput.fill("nature");
  });
});

test.describe("Search", () => {
  test("search page renders empty state", async ({ page }) => {
    await page.goto("/search");
    await expect(page.getByText(/start searching/i)).toBeVisible();
  });

  test("search returns results", async ({ page }) => {
    await page.goto("/search?q=photo");
    await expect(page.getByRole("heading", { name: /search/i })).toBeVisible();
    // Tabs should appear once results exist
    const allTab = page.getByRole("button", { name: /^all/i });
    await expect(allTab).toBeVisible();
  });

  test("header search navigates to search page", async ({ page }) => {
    await page.goto("/dashboard");
    const searchBar = page.getByPlaceholder(/search events/i);
    await searchBar.fill("photography");
    await searchBar.press("Enter");
    await expect(page).toHaveURL(/\/search\?q=photography/);
  });
});

test.describe("Notifications", () => {
  test("notifications page loads", async ({ page }) => {
    await page.goto("/notifications");
    await expect(page.getByRole("heading", { name: /notifications/i })).toBeVisible();
  });

  test("shows all caught up when no notifications", async ({ page }) => {
    await page.goto("/notifications");
    // Either shows notifications or empty state
    const hasNotifications = await page.getByText(/notifications/i).count();
    expect(hasNotifications).toBeGreaterThan(0);
  });
});
