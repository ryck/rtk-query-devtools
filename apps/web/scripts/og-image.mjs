/**
 * Renders `public/og-image.png` from `og-image.html`.
 *
 * Run after changing the template or the site's brand:
 *   pnpm --filter web run og-image
 *
 * The template's @font-face rules are rewritten to point at the real woff2
 * files the site ships, so the card uses the actual brand typefaces rather
 * than a system fallback. That means the site must be built first. The
 * script fails loudly if the fonts aren't there, rather than silently
 * rendering in Helvetica.
 */
import {
  existsSync,
  readdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { chromium } from "@playwright/test"

const HERE = dirname(fileURLToPath(import.meta.url))
const ASSETS = resolve(HERE, "../dist/client/assets")
const OUT = resolve(HERE, "../public/og-image.png")
const TEMPLATE = resolve(HERE, "og-image.html")
const RESOLVED = resolve(HERE, "og-image.resolved.html")

function findFont(prefix) {
  if (!existsSync(ASSETS)) {
    throw new Error(
      `No build output at ${ASSETS}. Run \`pnpm --filter web run build\` first.`
    )
  }
  // Filenames carry a content hash, so match on the stable prefix.
  const match = readdirSync(ASSETS).find(
    (f) => f.startsWith(prefix) && f.endsWith(".woff2")
  )
  if (!match)
    throw new Error(
      `Could not find a font matching "${prefix}*.woff2" in ${ASSETS}`
    )
  return `file://${ASSETS}/${match}`
}

const html = readFileSync(TEMPLATE, "utf8")
  .replace("FONT_INTER", findFont("inter-latin-wght-normal"))
  .replace("FONT_MONO", findFont("geist-mono-latin-wght-normal"))
writeFileSync(RESOLVED, html)

const browser = await chromium.launch()
try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    // Rendered at 2x so the card stays crisp where platforms upscale it.
    deviceScaleFactor: 2,
  })
  await page.goto(`file://${RESOLVED}`, { waitUntil: "networkidle" })
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({
    path: OUT,
    clip: { x: 0, y: 0, width: 1200, height: 630 },
  })
  console.log(`Wrote ${OUT}`)
} finally {
  await browser.close()
  unlinkSync(RESOLVED)
}
