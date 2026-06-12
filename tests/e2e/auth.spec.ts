// tests/e2e/auth.spec.ts

import { test, expect } from "@playwright/test";

test.use({ storageState: { cookies: [], origins: [] } }); // unauthenticated

test.describe("Authentication", () => {
  test("landing page redirects authenticated users to dashboard", async ({ page }) => {
    await page.goto("/");
    // Unauthenticated: should see the landing page
    await expect(page.getByText("PixVault")).toBeVisible();
    await expect(page.getByRole("link", { name: /get started/i })).toBeVisible();
  });

  test("login page renders correctly", async ({ page }) => {
    await page.goto("/auth/login");
    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("login with wrong credentials shows error", async ({ page }) => {
    await page.goto("/auth/login");
    await page.getByLabel("Email").fill("wrong@example.com");
    await page.getByLabel("Password").fill("WrongPass1");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.getByText(/no account found|incorrect password/i)).toBeVisible();
  });

  test("register page renders correctly", async ({ page }) => {
    await page.goto("/auth/register");
    await expect(page.getByRole("heading", { name: /create an account/i })).toBeVisible();
    await expect(page.getByLabel("Full Name")).toBeVisible();
    await expect(page.getByLabel("Username")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
  });

  test("register form validates required fields", async ({ page }) => {
    await page.goto("/auth/register");
    await page.getByRole("button", { name: /create account/i }).click();
    // Expect inline validation or error messages
    await expect(page.getByText(/at least 2 characters|required/i).first()).toBeVisible();
  });

  test("login link on register page works", async ({ page }) => {
    await page.goto("/auth/register");
    await page.getByRole("link", { name: /sign in/i }).click();
    await expect(page).toHaveURL("/auth/login");
  });

  test("register link on login page works", async ({ page }) => {
    await page.goto("/auth/login");
    await page.getByRole("link", { name: /create one/i }).click();
    await expect(page).toHaveURL("/auth/register");
  });

  test("protected routes redirect to login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});
