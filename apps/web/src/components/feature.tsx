import { clsx } from "clsx";
import type { ReactNode } from "react";

export function FeatureGroup({
  id,
  eyebrow,
  title,
  lead,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  lead: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-8 border-t border-panel-line pt-12">
      <span className="font-mono text-xs tracking-[0.2em] text-amber uppercase">{eyebrow}</span>
      <h2 className="mt-3 text-2xl font-semibold text-balance text-paper sm:text-3xl">{title}</h2>
      <p className="mt-3 max-w-2xl text-base leading-relaxed text-mist">{lead}</p>
      <div className="mt-8 flex flex-col gap-10">{children}</div>
    </section>
  );
}

export function Feature({
  title,
  children,
  shot,
  alt,
}: {
  title: string;
  children: ReactNode;
  /** Filename in `/features`, without the extension. */
  shot?: string;
  alt?: string;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-paper">{title}</h3>
      <div className="mt-1.5 max-w-2xl text-sm leading-relaxed text-mist">{children}</div>
      {shot && (
        <figure
          className={clsx(
            "mt-4 overflow-hidden rounded-xl border border-panel-line bg-panel",
            // The captures are 1280px wide at 2x; letting them fill the column
            // keeps text in them legible.
            "[&>img]:block [&>img]:w-full",
          )}
        >
          <img src={`/features/${shot}.png`} alt={alt ?? title} loading="lazy" />
        </figure>
      )}
    </div>
  );
}

/** Inline code, matching the density used across the site's prose. */
export function C({ children }: { children: string }) {
  return <code className="font-mono text-[0.92em] text-paper">{children}</code>;
}
