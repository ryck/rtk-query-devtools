import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Applies the stored preference before first paint.
 *
 * Every page here is prerendered to static HTML, so the markup ships with
 * whatever theme the build produced. Without this running synchronously in
 * `<head>`, a reader who picked dark would get a flash of the light page while
 * React hydrates.
 *
 * Order of precedence: an explicit choice, then the OS setting, then dark.
 *
 * Both queries are tested rather than just one so that "the OS says light"
 * and "there is nothing to go on" stay distinguishable, with the latter
 * falling to dark, the design this site was built in. In practice that last
 * branch is only reached by browsers too old to support the feature at all:
 * `no-preference` was dropped from the spec, and current browsers report a
 * system with no opinion as `light`.
 */
export const themeScript = `(function(){try{var t=localStorage.getItem("theme");var d;if(t){d=t==="dark"}else if(matchMedia("(prefers-color-scheme: dark)").matches){d=true}else if(matchMedia("(prefers-color-scheme: light)").matches){d=false}else{d=true}document.documentElement.classList.toggle("dark",d)}catch(e){document.documentElement.classList.add("dark")}})()`;

function toggleTheme() {
  const next = !document.documentElement.classList.contains("dark");
  document.documentElement.classList.toggle("dark", next);
  try {
    localStorage.setItem("theme", next ? "dark" : "light");
  } catch {
    // Private browsing can throw on write. The toggle still works for this
    // session, it just will not be remembered.
  }
}

/**
 * Which icon shows is decided by CSS from the `dark` class, not by React
 * state. `themeScript` sets that class before hydration, so reading it into
 * state would mean either a hydration mismatch or a setState in an effect.
 * This way there is no state to get out of sync.
 */
export function ThemeToggle() {
  return (
    <Button variant="ghost" size="icon-sm" onClick={toggleTheme} aria-label="Toggle theme">
      <Moon className="dark:hidden" />
      <Sun className="hidden dark:block" />
    </Button>
  );
}
