import { expect, test } from "@playwright/test";
import { entryRow, gotoApp, openDevtoolsShell, switchTab } from "./helpers";

test("the devtools shell opens and shows the RTK Query plugin tab", async ({ page }) => {
  await gotoApp(page);
  await openDevtoolsShell(page);

  // The outer shell's own plugin selector is a plain button, not role="tab"
  // — only our own Queries/Mutations/Tags/Timeline sub-tabs use that role.
  await expect(page.getByTestId("plugin-tab-rtk-query-devtools")).toBeVisible();
  await expect(page.getByRole("tab", { name: "Queries" })).toBeVisible();
});

test("queries appear in the Queries tab and update as the app is used", async ({ page }) => {
  await gotoApp(page);
  await openDevtoolsShell(page);

  await expect(entryRow(page, "listPosts")).toBeVisible();
  await expect(entryRow(page, "listPosts")).toContainText("fresh");

  // Delete a post from the app UI — the list refetches, the entry stays fresh.
  await page.getByRole("button", { name: "Delete Post #1" }).click();
  await expect(page.getByText("Post #1", { exact: true })).toBeHidden();
  await expect(entryRow(page, "listPosts")).toContainText("fresh");
});

test("search filters the query list by endpoint name", async ({ page }) => {
  await gotoApp(page);
  await openDevtoolsShell(page);
  await switchTab(page, "Queries");

  await expect(entryRow(page, "listPosts")).toBeVisible();

  await page.getByPlaceholder("Search endpoint or args…").fill("nonexistent-endpoint-xyz");
  await expect(entryRow(page, "listPosts")).toBeHidden();
  await expect(page.getByText("No queries yet")).toBeVisible();

  await page.getByPlaceholder("Search endpoint or args…").fill("listPosts");
  await expect(entryRow(page, "listPosts")).toBeVisible();
});

test("status filter chips narrow the query list", async ({ page }) => {
  await gotoApp(page);
  await openDevtoolsShell(page);
  await switchTab(page, "Queries");

  await expect(entryRow(page, "listPosts")).toBeVisible();

  // "Fresh 1" chip — toggle it on, only fresh entries remain, listPosts stays visible.
  await page.getByRole("button", { name: /^Fresh \d+$/ }).click();
  await expect(entryRow(page, "listPosts")).toBeVisible();

  // "Error 0" chip — toggling it on with zero matches hides everything.
  await page.getByRole("button", { name: /^Fresh \d+$/ }).click(); // turn fresh back off
  await page.getByRole("button", { name: /^Error \d+$/ }).click();
  await expect(page.getByText("No queries yet")).toBeVisible();
});

test("the active tab, search, and sort order survive a reload", async ({ page }) => {
  await gotoApp(page);
  await openDevtoolsShell(page);
  await switchTab(page, "Queries");

  await page.getByPlaceholder("Search endpoint or args…").fill("listPosts");
  // Default is descending; flip it so we're asserting a non-default value and
  // can't pass by accident.
  await page.getByRole("button", { name: "Sort order descending" }).click();
  await expect(page.getByRole("button", { name: "Sort order ascending" })).toBeVisible();

  await switchTab(page, "Timeline");

  await page.reload();
  await page.getByText("rtk-query-devtools demo").waitFor();
  await openDevtoolsShell(page);

  await expect(page.getByRole("tab", { name: "Timeline" })).toHaveAttribute(
    "aria-selected",
    "true",
  );

  await switchTab(page, "Queries");
  await expect(page.getByPlaceholder("Search endpoint or args…")).toHaveValue("listPosts");
  await expect(page.getByRole("button", { name: "Sort order ascending" })).toBeVisible();
});

test("fuzzy search matches an acronym, which a substring filter would miss", async ({ page }) => {
  await gotoApp(page);
  await openDevtoolsShell(page);
  await switchTab(page, "Queries");
  await expect(entryRow(page, "listPosts")).toBeVisible();

  await page.getByPlaceholder("Search endpoint or args…").fill("lp");

  await expect(entryRow(page, "listPosts")).toBeVisible();
});

test("light and dark themes both render the panel without errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(String(err)));

  await page.emulateMedia({ colorScheme: "dark" });
  await gotoApp(page);
  await openDevtoolsShell(page);
  await expect(entryRow(page, "listPosts")).toBeVisible();

  await page.emulateMedia({ colorScheme: "light" });
  await expect(entryRow(page, "listPosts")).toBeVisible();

  expect(errors).toEqual([]);
});
