import { Link } from "@tanstack/react-router";

function LogoMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect width="32" height="32" rx="7" fill="var(--color-ink)" />
      <rect x="5" y="5" width="9" height="9" rx="1.5" fill="var(--color-paper)" />
      <rect x="18" y="5" width="9" height="9" rx="1.5" fill="var(--color-panel-line)" />
      <rect x="5" y="18" width="9" height="9" rx="1.5" fill="var(--color-panel-line)" />
      <rect x="18" y="18" width="9" height="9" rx="1.5" fill="var(--color-amber)" />
    </svg>
  );
}

// lucide-react dropped brand/logo icons — a hand-drawn mark is the standard workaround.
function GithubMark({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.57.1.78-.25.78-.55 0-.27-.01-1.17-.02-2.12-3.2.7-3.87-1.36-3.87-1.36-.53-1.33-1.29-1.69-1.29-1.69-1.05-.72.08-.7.08-.7 1.17.08 1.78 1.2 1.78 1.2 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 2.9-.39c.98 0 1.97.13 2.9.39 2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.12 3.05.74.8 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.07.78 2.15 0 1.55-.01 2.8-.01 3.18 0 .3.2.66.79.55A10.52 10.52 0 0 0 23.5 12c0-6.35-5.15-11.5-11.5-11.5Z" />
    </svg>
  );
}

export function SiteHeader() {
  return (
    <header className="border-b border-panel-line">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2.5 font-mono text-sm text-paper">
          <LogoMark />
          rtk-query-devtools
        </Link>
        <nav className="flex items-center gap-6 font-mono text-sm text-mist">
          <Link
            to="/examples"
            className="transition-colors hover:text-paper"
            activeProps={{ className: "text-paper" }}
          >
            Examples
          </Link>
          <a
            href="https://github.com/ryck/rtk-query-devtools"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 transition-colors hover:text-paper"
          >
            <GithubMark />
            <span className="hidden sm:inline">GitHub</span>
          </a>
        </nav>
      </div>
    </header>
  );
}
