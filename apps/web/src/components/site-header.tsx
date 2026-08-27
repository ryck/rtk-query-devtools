import { Link } from "@tanstack/react-router";
import { clsx } from "clsx";
import { ThemeToggle } from "@/components/theme-toggle";
import { textLink, textLinkActive } from "@/lib/link";

function LogoMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      {/* Semantic tokens, not the raw palette, so the mark inverts with the
          page instead of staying a dark tile on a cream header. */}
      <rect width="32" height="32" rx="7" fill="var(--background)" />
      <rect x="5" y="5" width="9" height="9" rx="1.5" fill="var(--foreground)" />
      <rect x="18" y="5" width="9" height="9" rx="1.5" fill="var(--border)" />
      <rect x="5" y="18" width="9" height="9" rx="1.5" fill="var(--border)" />
      <rect x="18" y="18" width="9" height="9" rx="1.5" fill="var(--primary)" />
    </svg>
  );
}

// lucide-react dropped brand/logo icons, so a hand-drawn mark is the standard workaround.
function GithubMark({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.57.1.78-.25.78-.55 0-.27-.01-1.17-.02-2.12-3.2.7-3.87-1.36-3.87-1.36-.53-1.33-1.29-1.69-1.29-1.69-1.05-.72.08-.7.08-.7 1.17.08 1.78 1.2 1.78 1.2 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 2.9-.39c.98 0 1.97.13 2.9.39 2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.12 3.05.74.8 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.07.78 2.15 0 1.55-.01 2.8-.01 3.18 0 .3.2.66.79.55A10.52 10.52 0 0 0 23.5 12c0-6.35-5.15-11.5-11.5-11.5Z" />
    </svg>
  );
}

export function SiteHeader() {
  return (
    // Translucent + blurred rather than opaque, so content scrolling underneath
    // stays legible as motion instead of vanishing at a hard edge. The `/85`
    // fallback applies where `backdrop-filter` is unsupported, where a more
    // transparent bar would leave the nav unreadable.
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/65">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2.5 font-mono text-sm text-foreground">
          <LogoMark />
          {/* Same split as the logo lockup and the og:image. The amber picks
              up the mark's accent tile. */}
          <span>
            rtk-query-<span className="text-primary">devtools</span>
          </span>
        </Link>
        <nav className="flex items-center gap-6 font-mono text-sm text-muted-foreground">
          <Link to="/features" className={textLink} activeProps={{ className: textLinkActive }}>
            Features
          </Link>
          <Link to="/playground" className={textLink} activeProps={{ className: textLinkActive }}>
            Playground
          </Link>
          <a
            href="https://github.com/ryck/rtk-query-devtools"
            target="_blank"
            rel="noreferrer"
            // The icon sits outside the underline, so the decoration tracks the
            // label rather than striking through the mark.
            className="flex items-center gap-1.5 transition-colors hover:text-foreground"
          >
            <GithubMark />
            <span className={clsx(textLink, "hidden sm:inline")}>GitHub</span>
          </a>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
