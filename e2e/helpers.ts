import { type Page, expect } from "@playwright/test";

export async function gotoApp(page: Page) {
  await page.goto("/");
  await page.getByText("rtk-query-devtools demo").waitFor();
}

/** Opens the TanStack DevTools shell if it isn't already expanded. */
export async function openDevtoolsShell(page: Page) {
  // The "Open TanStack Devtools" trigger and the opened-panel wordmark both
  // live in the DOM while the shell is closed (it toggles visibility, not
  // mount), which is what made an early `isVisible()` check race the shell's
  // mount. But the shell also persists its own open state, so after a reload
  // it can come back already open with the trigger absent entirely — hence
  // racing the two rather than waiting on the trigger alone.
  const trigger = page.getByRole("button", { name: "Open TanStack Devtools" });
  const wordmark = page.getByTestId("workbench-wordmark");
  await Promise.race([
    trigger.waitFor({ state: "attached" }).catch(() => {}),
    wordmark.waitFor({ state: "visible" }).catch(() => {}),
  ]);
  if (await trigger.isVisible().catch(() => false)) {
    await trigger.click();
  }
  await expect(wordmark).toBeVisible();
}

export async function switchTab(page: Page, tab: "Queries" | "Mutations" | "Tags" | "Timeline") {
  await page.getByRole("tab", { name: tab }).click();
}

/** The row for a given endpoint name in the Queries/Mutations/Timeline list. */
export function entryRow(page: Page, endpointName: string) {
  return page.locator('div[role="button"]').filter({ hasText: endpointName });
}
