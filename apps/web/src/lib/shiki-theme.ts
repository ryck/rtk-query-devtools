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
const PAPER = "#f3efe4";
const MIST = "#8a93a6";
const AMBER = "#f2a93b";
const TEAL = "#34d399";
const CORAL = "#fb7166";

export const brandCodeTheme: ThemeRegistrationRaw = {
  name: "rtk-query-devtools",
  type: "dark",
  // Transparent, so the surrounding element supplies the surface. CodeBlock
  // also strips the inline background, but setting it here means the markup is
  // right even if that transformer is ever dropped.
  colors: { "editor.background": "#00000000", "editor.foreground": PAPER },
  settings: [
    { scope: ["comment", "punctuation.definition.comment"], settings: { foreground: MIST } },
    {
      scope: ["keyword", "storage", "storage.type", "keyword.operator", "entity.name.tag"],
      settings: { foreground: AMBER },
    },
    {
      scope: ["string", "string.quoted", "punctuation.definition.string"],
      settings: { foreground: TEAL },
    },
    {
      scope: ["constant.numeric", "constant.language", "constant.language.boolean"],
      settings: { foreground: CORAL },
    },
    { scope: ["entity.other.attribute-name"], settings: { foreground: TEAL } },
    {
      scope: ["punctuation", "meta.brace", "punctuation.separator", "punctuation.terminator"],
      settings: { foreground: MIST },
    },
    {
      scope: ["variable", "entity.name.function", "support.function", "meta.object-literal.key"],
      settings: { foreground: PAPER },
    },
  ],
};
