/**
 * Renders the icon set and README lockup from the same 2x2 mark as
 * `public/favicon.svg`.
 *
 *   pnpm --filter web run logos
 *
 * The lockup needs the site's real mono face, which only exists in the build
 * output — so run `pnpm --filter web run build` first. The script fails loudly
 * rather than silently falling back to a system font.
 */
import { existsSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const HERE = dirname(fileURLToPath(import.meta.url));
const ASSETS = resolve(HERE, "../dist/client/assets");
const PUBLIC = resolve(HERE, "../public");
const TEMPLATE = resolve(HERE, "logos.html");
const RESOLVED = resolve(HERE, "logos.resolved.html");

/** Square PNG renditions of the mark. */
const ICONS = [
  { file: "favicon-32.png", size: 32 },
  { file: "favicon-192.png", size: 192 },
  { file: "favicon-512.png", size: 512 },
  // iOS masks this itself, so it ships full-bleed at the standard size.
  { file: "apple-touch-icon.png", size: 180 },
];

function findFont(prefix) {
  if (!existsSync(ASSETS)) {
    throw new Error(`No build output at ${ASSETS}. Run \`pnpm --filter web run build\` first.`);
  }
  const match = readdirSync(ASSETS).find((f) => f.startsWith(prefix) && f.endsWith(".woff2"));
  if (!match) throw new Error(`Could not find "${prefix}*.woff2" in ${ASSETS}`);
  return `file://${ASSETS}/${match}`;
}

writeFileSync(
  RESOLVED,
  readFileSync(TEMPLATE, "utf8").replace("FONT_MONO", findFont("geist-mono-latin-wght-normal")),
);

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  await page.goto(`file://${RESOLVED}`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);

  const icon = page.locator("#icon");
  for (const { file, size } of ICONS) {
    // Re-render the mark at its true pixel size rather than downscaling one
    // big capture — keeps the small sizes from going mushy. Sequential by
    // necessity: every size resizes the same element before capturing it.
    // eslint-disable-next-line no-await-in-loop
    await icon.evaluate((el, s) => el.style.setProperty("--s", `${s}px`), size);
    // eslint-disable-next-line no-await-in-loop
    await icon.screenshot({ path: `${PUBLIC}/${file}` });
    console.log(`  ✓ ${file} (${size}x${size})`);
  }

  await page.locator("#lockup").screenshot({ path: `${PUBLIC}/logo-lockup.png` });
  console.log("  ✓ logo-lockup.png");
} finally {
  await browser.close();
  unlinkSync(RESOLVED);
}
