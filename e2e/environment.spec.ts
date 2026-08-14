import { expect, test } from "@playwright/test";
import { entryRow, gotoApp, openDevtoolsShell, switchTab } from "./helpers";

test("the offline toggle flips state and refetches on reconnect", async ({ page }) => {
  await gotoApp(page);
  await openDevtoolsShell(page);
  await switchTab(page, "Queries");
  await expect(entryRow(page, "listPosts")).toBeVisible();

  const online = page.getByRole("button", { name: "Online" });
  await expect(online).toHaveAttribute("aria-pressed", "false");

  await online.click();

  const offline = page.getByRole("button", { name: "Offline" });
  await expect(offline).toBeVisible();
  await expect(offline).toHaveAttribute("aria-pressed", "true");

  // Going back online drives a real refetchOnReconnect pass, which the
  // Timeline records — this is what proves the toggle isn't just a flag.
  await switchTab(page, "Timeline");
  const before = await entryRow(page, "listPosts").count();

  await switchTab(page, "Queries");
  await offline.click();
  await expect(page.getByRole("button", { name: "Online" })).toBeVisible();

  await switchTab(page, "Timeline");
  await expect.poll(async () => entryRow(page, "listPosts").count()).toBeGreaterThan(before);
});

test("the focus toggle flips state and refetches on refocus", async ({ page }) => {
  await gotoApp(page);
  await openDevtoolsShell(page);
  await switchTab(page, "Queries");
  await expect(entryRow(page, "listPosts")).toBeVisible();

  const focused = page.getByRole("button", { name: "Focused" });
  await expect(focused).toHaveAttribute("aria-pressed", "false");

  await focused.click();
  const unfocused = page.getByRole("button", { name: "Unfocused" });
  await expect(unfocused).toHaveAttribute("aria-pressed", "true");

  await switchTab(page, "Timeline");
  const before = await entryRow(page, "listPosts").count();

  await switchTab(page, "Queries");
  await unfocused.click();
  await expect(page.getByRole("button", { name: "Focused" })).toBeVisible();

  await switchTab(page, "Timeline");
  await expect.poll(async () => entryRow(page, "listPosts").count()).toBeGreaterThan(before);
});
