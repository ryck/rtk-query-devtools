import { expect, test } from "@playwright/test";
import { entryRow, gotoApp, openDevtoolsShell, switchTab } from "./helpers";

/** Number of timeline rows whose accessible text mentions `endpointName`. */
async function timelineEntryCount(page: import("@playwright/test").Page, endpointName: string) {
  return page.locator('div[role="button"]').filter({ hasText: endpointName }).count();
}

test("Refetch triggers a new request for the selected entry", async ({ page }) => {
  await gotoApp(page);
  await openDevtoolsShell(page);
  await switchTab(page, "Queries");

  await entryRow(page, "listPosts").click();
  await expect(page.getByText("Endpoint", { exact: true })).toBeVisible();

  await switchTab(page, "Timeline");
  const before = await timelineEntryCount(page, "listPosts");
  await switchTab(page, "Queries");
  await entryRow(page, "listPosts").click();

  await page.getByRole("button", { name: "Refetch" }).click();

  await switchTab(page, "Timeline");
  await expect.poll(() => timelineEntryCount(page, "listPosts")).toBeGreaterThan(before);
});

test("Invalidate tags refetches queries subscribed to that tag", async ({ page }) => {
  await gotoApp(page);
  await openDevtoolsShell(page);
  await switchTab(page, "Timeline");
  const before = await timelineEntryCount(page, "listPosts");

  await switchTab(page, "Queries");
  await entryRow(page, "listPosts").click();
  await page.getByRole("button", { name: "Invalidate tags" }).click();

  await switchTab(page, "Timeline");
  await expect.poll(() => timelineEntryCount(page, "listPosts")).toBeGreaterThan(before);
});

test("Remove drops the entry from the Mutations list", async ({ page }) => {
  // A mutation, not a query — removing an actively-subscribed query entry
  // would race with RTK Query immediately refetching it for that subscriber,
  // which makes the assertion flaky. Mutations have no such ambiguity.
  await gotoApp(page);
  await openDevtoolsShell(page);

  await page.getByPlaceholder("New post title…").fill("Removable post");
  await page.getByRole("button", { name: "Add" }).click();
  await expect(page.getByText("Removable post", { exact: true })).toBeVisible();

  await switchTab(page, "Mutations");
  await entryRow(page, "addPost").click();
  await page.getByRole("button", { name: "Remove" }).click();

  await expect(entryRow(page, "addPost")).toBeHidden();
});
