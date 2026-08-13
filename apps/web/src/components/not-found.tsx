import { Link } from "@tanstack/react-router";

export function NotFound() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col items-start px-6 py-24 sm:py-32">
      <span className="rounded-full bg-coral/15 px-2 py-0.5 font-mono text-[10px] tracking-wide text-coral uppercase">
        Error
      </span>
      <h1 className="mt-4 text-3xl leading-tight font-semibold text-balance text-paper sm:text-4xl">
        This route isn't in the cache.
      </h1>
      <p className="mt-4 max-w-md text-base leading-relaxed text-mist">
        Nothing fulfilled at this path. Head back to the homepage, or see the plugin running on the
        examples page.
      </p>
      <div className="mt-8 flex gap-3">
        <Link
          to="/"
          className="inline-flex items-center justify-center rounded-md bg-amber px-3 py-1.5 font-mono text-xs font-medium text-ink transition-colors hover:bg-amber/85"
        >
          Go home
        </Link>
        <Link
          to="/examples"
          className="inline-flex items-center justify-center rounded-md border border-panel-line px-3 py-1.5 font-mono text-xs font-medium text-paper transition-colors hover:border-mist"
        >
          See examples
        </Link>
      </div>
    </main>
  );
}
