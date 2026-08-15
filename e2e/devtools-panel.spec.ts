import { expect, test } from "@playwright/test";
import { entryRow, gotoApp, openDevtoolsShell, switchTab, tab } from "./helpers";

test("the devtools shell opens and shows the RTK Query plugin tab", async ({ page }) => {
  await gotoApp(page);
  await openDevtoolsShell(page);

  // The outer shell's own plugin selector is a plain button, not role="tab"
  // Only our own Queries/Mutations/Tags/Timeline sub-tabs use that role.
  await expect(page.getByTestId("plugin-tab-rtk-query-devtools")).toBeVisible();
  await expect(tab(page, "Queries")).toBeVisible();
});

test("queries appear in the Queries tab and update as the app is used", async ({ page }) => {
  await gotoApp(page);
  await openDevtoolsShell(page);

  await expect(entryRow(page, "listPosts")).toBeVisible();
  await expect(entryRow(page, "listPosts")).toContainText("fresh");

  // Delete a post from the app UI. The list refetches, the entry stays fresh.
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

  // "Fresh 1" chip: toggle it on, only fresh entries remain, listPosts stays visible.
  await page.getByRole("button", { name: /^Fresh \d+$/ }).click();
  await expect(entryRow(page, "listPosts")).toBeVisible();

  // "Error 0" chip: toggling it on with zero matches hides everything.
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

  await expect(tab(page, "Timeline")).toHaveAttribute("aria-selected", "true");

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

test("the API config strip summarises the api and expands on demand", async ({ page }) => {
  await gotoApp(page);
  await openDevtoolsShell(page);
  await switchTab(page, "Queries");

  const toggle = page.getByRole("button", { name: /API config/ });
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  // The summary is visible without expanding.
  await expect(toggle).toContainText("subs");

  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");

  // Config RTK populates but never surfaces.
  await expect(page.getByText("keepUnusedDataFor", { exact: true })).toBeVisible();
  await expect(page.getByText("invalidationBehavior", { exact: true })).toBeVisible();

  // A correctly-configured app must not show the conflict warning.
  await expect(page.getByRole("alert")).toHaveCount(0);
});

test("tab labels carry live counts and are wired to the panel for a11y", async ({ page }) => {
  await gotoApp(page);
  await openDevtoolsShell(page);

  const queries = tab(page, "Queries");
  await expect(queries).toContainText("Queries");
  await expect.poll(async () => (await queries.textContent())?.trim()).toMatch(/Queries\s*\d+/);

  // The active tab labels the panel, and the tab points back at it.
  const panelId = await queries.getAttribute("aria-controls");
  expect(panelId).toBeTruthy();
  await expect(page.locator(`#${panelId}`)).toHaveAttribute(
    "aria-labelledby",
    (await queries.getAttribute("id")) ?? "",
  );
});

test("the regex toggle filters by pattern and flags an invalid one", async ({ page }) => {
  await gotoApp(page);
  await openDevtoolsShell(page);
  await switchTab(page, "Queries");
  await expect(entryRow(page, "listPosts")).toBeVisible();

  const toggle = page.getByRole("button", { name: "Use regular expression search" });
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");

  await page.getByPlaceholder("Search endpoint or args…").fill("^listPosts\\(");
  await expect(entryRow(page, "listPosts")).toBeVisible();

  // Valid pattern that simply matches nothing, distinct from the invalid
  // case below, which deliberately does *not* filter.
  await page.getByPlaceholder("Search endpoint or args…").fill("^zzzNoSuchEndpoint");
  await expect(entryRow(page, "listPosts")).toBeHidden();

  // An uncompilable pattern shows everything rather than blanking the list
  // mid-keystroke, and marks the toggle instead.
  await page.getByPlaceholder("Search endpoint or args…").fill("(unclosed");
  await expect(
    page.getByRole("button", { name: "Invalid regular expression provided" }),
  ).toBeVisible();
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
