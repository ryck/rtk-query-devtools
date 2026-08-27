import { textLink } from "@/lib/link";

const LINKS = [
  { href: "https://github.com/ryck/rtk-query-devtools", label: "GitHub" },
  { href: "https://www.npmjs.com/package/rtk-query-devtools", label: "npm" },
  { href: "https://redux-toolkit.js.org/rtk-query/overview", label: "RTK Query docs" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-panel-line">
      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-6 py-8 font-mono text-xs text-mist sm:flex-row sm:items-center sm:justify-between">
        <span>
          MIT Licensed · built on{" "}
          <a
            href="https://tanstack.com/devtools"
            target="_blank"
            rel="noreferrer"
            className={textLink}
          >
            TanStack DevTools
          </a>{" "}
          · Made with{" "}
          {/*
            Labelled rather than left bare: a screen reader announces the raw
            emoji as "red heart", so this reads "Made with love by ryck.dev".
          */}
          <span role="img" aria-label="love">
            💛
          </span>{" "}
          by{" "}
          <a href="https://ryck.dev" target="_blank" rel="noreferrer" className={textLink}>
            ryck.dev
          </a>
        </span>
        <div className="flex gap-4">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              className={textLink}
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
