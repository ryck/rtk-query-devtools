/**
 * Captures the screenshots used on /features, by driving the real demo app.
 *
 *   pnpm --filter demo run dev          # in one terminal
 *   pnpm --filter web run feature-shots # in another
 *
 * Shots come from the actual panel rather than mockups, so they can't drift
 * from what the plugin really renders. Re-run this after any UI change.
 */
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(HERE, "../public/features");
const APP = process.env.DEMO_URL ?? "http://localhost:5173/";
const PANEL = "#plugin-container-rtk-query-devtools";

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1280, height: 1000 },
  colorScheme: "dark",
  deviceScaleFactor: 2,
});

// Seed the shell so the panel opens tall and dark on load. Otherwise every
// shot needs a click and comes out 290px high.
await context.addInitScript(() => {
  localStorage.setItem(
    "tanstack_devtools_state",
    JSON.stringify({
      activeTab: "plugins",
      height: 620,
      layout: { kind: "group", id: "g0", tabs: ["rtk-query-devtools"], active: 0 },
      persistOpen: true,
    }),
  );
  localStorage.setItem(
    "tanstack_devtools_settings",
    JSON.stringify({
      defaultOpen: true,
      hideUntilHover: false,
      position: "bottom-right",
      triggerMode: "fixed",
      panelLocation: "bottom",
      openHotkey: ["Control", "~"],
      inspectHotkey: ["Shift", "Alt", "CtrlOrMeta"],
      requireUrlFlag: false,
      urlFlag: "tanstack-devtools",
      theme: "dark",
      sourceAction: "ide-warp",
      triggerHidden: true,
      plugins: [{ name: "RTK Query", id: "rtk-query-devtools", defaultOpen: true }],
    }),
  );
});

const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));

const panel = () => page.locator(PANEL);
const tab = (name) => page.getByRole("tab", { name: new RegExp(`^${name}`) });
const demoTab = (name) => page.getByRole("tab", { name, exact: true });

/**
 * The panel is taller than most of these views need, so each shot is cropped
 * to roughly its own content height. Otherwise half of every image is empty
 * background.
 */
async function shot(name, height) {
  await page.waitForTimeout(350);
  const box = await panel().boundingBox();
  if (!box) throw new Error(`Panel not found when capturing ${name}`);
  await page.screenshot({
    path: `${OUT}/${name}.png`,
    clip: {
      x: box.x,
      y: box.y,
      width: box.width,
      height: Math.min(height ?? box.height, box.height),
    },
  });
  console.log(`  ✓ ${name}.png`);
}

await page.goto(APP, { waitUntil: "networkidle" });
await page.waitForTimeout(900);

// --- Give the cache something interesting to show -------------------------
console.log("Seeding cache state…");
for (const t of ["Slow", "Flaky", "Polling", "Infinite", "Users", "Posts"]) {
  // Sequential on purpose: each tab must mount and settle before the next, so
  // the resulting cache has a predictable mix of statuses.
  // eslint-disable-next-line no-await-in-loop
  await demoTab(t)
    .click()
    .catch(() => {});
  // eslint-disable-next-line no-await-in-loop
  await page.waitForTimeout(450);
}
// A slow request, so a long duration shows up in the timings table.
await demoTab("Slow")
  .click()
  .catch(() => {});
const slow = page.getByRole("button", { name: /Fetch post/ });
if (await slow.count()) {
  await slow.click();
  await page.waitForTimeout(2900);
}
// A couple of failures, for the error badge and error counts.
await demoTab("Flaky")
  .click()
  .catch(() => {});
for (let i = 0; i < 3; i++) {
  const r = page.getByRole("button", { name: /Refetch/ });
  // Sequential on purpose: each refetch must settle before the next, or the
  // flaky endpoint's failure count isn't reproducible.
  // eslint-disable-next-line no-await-in-loop
  if (await r.count()) await r.click();
  // eslint-disable-next-line no-await-in-loop
  await page.waitForTimeout(700);
}
// A mutation, so the Mutations tab isn't empty.
await demoTab("Posts")
  .click()
  .catch(() => {});
await page.waitForTimeout(400);
const title = page.getByPlaceholder("New post title…");
if (await title.count()) {
  await title.fill("Written from the devtools docs");
  await page.getByRole("button", { name: /Add/ }).first().click();
  await page.waitForTimeout(900);
}

// --- Queries --------------------------------------------------------------
console.log("Capturing…");
await tab("Queries").click();
await page.waitForTimeout(400);
await shot("queries-list", 300);

// Status filter: one pill active, the rest dimmed.
await page.getByRole("button", { name: /^Fresh \d+$/ }).click();
await shot("status-filter", 300);
await page.getByRole("button", { name: /^Fresh \d+$/ }).click();

// Detail pane.
await page
  .getByRole("button", { name: /listPosts\(\)/ })
  .first()
  .click();
await shot("query-detail", 330);

// Request history + data explorer live further down the detail pane.
const detail = page.locator("div.rtkq\\:overflow-y-auto").last();
await detail.evaluate((el) => el.scrollTo(0, 210));
await shot("request-history", 330);
await detail.evaluate((el) => el.scrollTo(0, 470));
// Expand one array item so the shot shows real values and the per-node copy
// buttons, rather than a column of collapsed `{ 3 }` placeholders.
const firstItem = page.getByRole("button", { name: /^0:/ }).first();
if (await firstItem.count()) await firstItem.click();
await page.waitForTimeout(250);
await detail.evaluate((el) => el.scrollTo(0, 470));
await shot("data-explorer", 330);
await detail.evaluate((el) => el.scrollTo(0, 0));

// API config strip.
await page.getByRole("button", { name: /API config/ }).click();
await shot("api-config", 300);
await page.getByRole("button", { name: /API config/ }).click();

// Environment simulation, in the simulated state.
await page.getByRole("button", { name: "Online" }).click();
await page.getByRole("button", { name: "Focused" }).click();
await shot("environment", 190);
await page.getByRole("button", { name: "Offline" }).click();
await page.getByRole("button", { name: "Unfocused" }).click();

// Regex search, showing the invalid-pattern state.
await page.getByRole("button", { name: "Use regular expression search" }).click();
await page.getByPlaceholder("Search endpoint or args…").fill("(unclosed");
await shot("search-regex", 190);
await page.getByPlaceholder("Search endpoint or args…").fill("");
await page.getByRole("button", { name: /regular expression/ }).click();

// --- Mutations ------------------------------------------------------------
await tab("Mutations").click();
await page.waitForTimeout(400);
const mutation = page.getByRole("button", { name: /addPost/ }).first();
if (await mutation.count()) await mutation.click();
await shot("mutations", 300);

// --- Tags -----------------------------------------------------------------
await tab("Tags").click();
await page.waitForTimeout(400);
const group = page.getByRole("button", { name: /^Post/ }).first();
if (await group.count()) await group.click();
await shot("tags", 300);

// --- Timeline -------------------------------------------------------------
await tab("Timeline").click();
await page.waitForTimeout(400);
await shot("timeline", 330);
await page.getByRole("button", { name: /Timings/ }).click();
await shot("timings", 330);

console.log(errors.length ? `\nPAGE ERRORS: ${JSON.stringify(errors)}` : "\nNo page errors.");
await browser.close();
