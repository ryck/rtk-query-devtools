export function SiteFooter() {
  return (
    <footer className="border-t border-panel-line">
      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-6 py-8 font-mono text-xs text-mist sm:flex-row sm:items-center sm:justify-between">
        <span>MIT Licensed · built on TanStack DevTools</span>
        <div className="flex gap-4">
          <a
            href="https://github.com/ryck/rtk-query-devtools"
            target="_blank"
            rel="noreferrer"
            className="hover:text-paper"
          >
            GitHub
          </a>
          <a
            href="https://www.npmjs.com/package/rtk-query-devtools"
            target="_blank"
            rel="noreferrer"
            className="hover:text-paper"
          >
            npm
          </a>
          <a
            href="https://redux-toolkit.js.org/rtk-query/overview"
            target="_blank"
            rel="noreferrer"
            className="hover:text-paper"
          >
            RTK Query docs
          </a>
        </div>
      </div>
    </footer>
  );
}
