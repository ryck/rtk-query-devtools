// `?inline` hands back the compiled stylesheet as a string rather than
// registering it as a CSS asset. That is what lets the panel carry its own
// styles: a library build extracts a normal `import "./styles.css"` into
// `dist/style.css` and drops it from the JS, which is why consumers used to
// have to remember a second import or get an unstyled panel with no error
// explaining why.
import css from "./styles.css?inline";

const STYLE_ELEMENT_ID = "rtk-query-devtools-styles";

/**
 * Injects the panel's stylesheet once per document.
 *
 * Deliberately a side effect of *this module* rather than of the package
 * entry. Everything here is reachable only through the development branch of
 * `createRtkQueryDevtoolsPlugin`, so a production build drops the module and
 * the ~15KB of CSS embedded in it along with the panel itself. A build-level
 * inliner cannot manage that: it emits a top-level IIFE that runs on import
 * whatever `NODE_ENV` says.
 *
 * Idempotent by id, so two panels (or a remount) share one `<style>`.
 */
export function ensurePanelStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(STYLE_ELEMENT_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ELEMENT_ID;
  style.textContent = css;
  document.head.appendChild(style);
}
