import type { ThemeRegistrationRaw } from "shiki";

/**
 * Shiki ships no theme in the site's colours, and the stock dark ones all pull
 * in hues that appear nowhere else on the page. This is the palette from
 * styles.css expressed as a TextMate theme, so highlighted code sits in the
 * same five colours as everything else.
 *
 * Literals rather than `var(--color-*)`: Shiki writes these into inline
 * `style` attributes, where a custom property that resolves against the
 * document would not help. Keep them in step with `@theme`.
 */
interface Palette {
  text: string;
  muted: string;
  keyword: string;
  string: string;
  literal: string;
}

/** The dark palette, straight from `@theme`. */
const DARK: Palette = {
  text: "#f3efe4",
  muted: "#8a93a6",
  keyword: "#f2a93b",
  string: "#34d399",
  literal: "#fb7166",
};

/**
 * The light twin, matching the `--color-quill` / `--color-bronze` /
 * `--color-*-deep` values in styles.css. The dark palette's accents were
 * chosen to glow on near-black and are far too pale to read on a light page.
 */
const LIGHT: Palette = {
  text: "#0c0f16",
  muted: "#6b7385",
  keyword: "#b8761a",
  string: "#0f766e",
  literal: "#d0483c",
};

function buildTheme(name: string, type: "dark" | "light", p: Palette): ThemeRegistrationRaw {
  return {
    name,
    type,
    // Transparent, so the surrounding element supplies the surface. CodeBlock
    // also strips the inline background, but setting it here means the markup is
    // right even if that transformer is ever dropped.
    colors: { "editor.background": "#00000000", "editor.foreground": p.text },
    settings: [
      { scope: ["comment", "punctuation.definition.comment"], settings: { foreground: p.muted } },
      {
        scope: ["keyword", "storage", "storage.type", "keyword.operator", "entity.name.tag"],
        settings: { foreground: p.keyword },
      },
      {
        scope: ["string", "string.quoted", "punctuation.definition.string"],
        settings: { foreground: p.string },
      },
      {
        scope: ["constant.numeric", "constant.language", "constant.language.boolean"],
        settings: { foreground: p.literal },
      },
      { scope: ["entity.other.attribute-name"], settings: { foreground: p.string } },
      {
        scope: ["punctuation", "meta.brace", "punctuation.separator", "punctuation.terminator"],
        settings: { foreground: p.muted },
      },
      {
        scope: ["variable", "entity.name.function", "support.function", "meta.object-literal.key"],
        settings: { foreground: p.text },
      },
    ],
  };
}

export const brandCodeTheme = buildTheme("rtk-query-devtools", "dark", DARK);
export const brandCodeThemeLight = buildTheme("rtk-query-devtools-light", "light", LIGHT);
