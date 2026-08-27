import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Applies the stored preference before first paint.
 *
 * Every page here is prerendered to static HTML, so the markup ships with
 * whatever theme the build produced. Without this running synchronously in
 * `<head>`, a reader who picked dark would get a flash of the light page while
 * React hydrates. Falls back to the OS setting when nothing is stored, so the
 * first visit already matches the reader's system.
 */
export const themeScript = `(function(){try{var t=localStorage.getItem("theme");var d=t?t==="dark":matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("dark",d)}catch(e){}})()`;

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
