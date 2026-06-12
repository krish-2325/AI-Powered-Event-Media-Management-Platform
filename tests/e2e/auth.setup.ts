// tests/e2e/auth.setup.ts

import { test as setup, expect } from "@playwright/test";
import path from "path";

const authFile = path.join(__dirname, ".auth/user.json");

setup("authenticate as demo user", async ({ page }) => {
  await page.goto("/auth/login");

  await page.getByLabel("Email").fill("photographer@pixvault.app");
  await page.getByLabel("Password").fill("Photo@1234");
  await page.getByRole("button", { name: /sign in/i }).click();

  await page.waitForURL("/dashboard");
  await expect(page).toHaveURL("/dashboard");

  await page.context().storageState({ path: authFile });
});
