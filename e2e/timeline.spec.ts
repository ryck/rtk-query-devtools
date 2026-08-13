import { expect, test } from "@playwright/test";
import { gotoApp, openDevtoolsShell, switchTab } from "./helpers";

test("the Timeline tab records query and mutation lifecycle events", async ({ page }) => {
  await gotoApp(page);
  await openDevtoolsShell(page);
  await switchTab(page, "Timeline");

  // The initial listPosts fetch on load should already be recorded.
  await expect(page.getByText("fulfilled", { exact: true }).first()).toBeVisible();

  const before = await page.locator('div[role="button"]').filter({ hasText: "listPosts" }).count();

  await page.getByPlaceholder("New post title…").fill("Timeline test post");
  await page.getByRole("button", { name: "Add" }).click();
  await expect(page.getByText("Timeline test post", { exact: true })).toBeVisible();

  // Adding a post invalidates Post:LIST, triggering a second listPosts fetch
  // — the timeline should grow, and an addPost mutation should appear too.
  await expect
    .poll(async () => page.locator('div[role="button"]').filter({ hasText: "listPosts" }).count())
    .toBeGreaterThan(before);
  await expect(
    page.locator('div[role="button"]').filter({ hasText: "addPost" }).first(),
  ).toBeVisible();
});

test("Pause stops new entries from being captured", async ({ page }) => {
  await gotoApp(page);
  await openDevtoolsShell(page);
  await switchTab(page, "Timeline");

  await page.getByRole("button", { name: "Pause" }).click();
  await expect(page.getByRole("button", { name: "Resume" })).toBeVisible();

  const countWhilePaused = await page
    .locator('div[role="button"]')
    .filter({ hasText: "addPost" })
    .count();

  await page.getByPlaceholder("New post title…").fill("Should not be captured");
  await page.getByRole("button", { name: "Add" }).click();
  await expect(page.getByText("Should not be captured", { exact: true })).toBeVisible();

  await expect(page.locator('div[role="button"]').filter({ hasText: "addPost" })).toHaveCount(
    countWhilePaused,
  );
});

test("Clear empties the timeline", async ({ page }) => {
  await gotoApp(page);
  await openDevtoolsShell(page);
  await switchTab(page, "Timeline");

  await expect(page.getByText("fulfilled", { exact: true }).first()).toBeVisible();

  await page.getByRole("button", { name: "Clear" }).click();

  await expect(page.getByText("No requests captured yet")).toBeVisible();
});
