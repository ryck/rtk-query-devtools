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
    // `scroll-mt-24` clears the sticky header: without it an anchored section
    // lands underneath the bar and its eyebrow is hidden.
    <section id={id} className="scroll-mt-24 border-t border-border pt-12">
      <span className="font-mono text-xs tracking-[0.2em] text-primary uppercase">{eyebrow}</span>
      <h2 className="mt-3 text-2xl font-semibold text-balance text-foreground sm:text-3xl">
        {title}
      </h2>
      <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">{lead}</p>
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
  /** Filename in `/features/{dark,light}`, without the extension. */
  shot?: string;
  alt?: string;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <div className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
      {shot && (
        <figure
          className={clsx(
            "mt-4 overflow-hidden rounded-xl border border-border bg-card",
            // The captures are 1280px wide at 2x; letting them fill the column
            // keeps text in them legible.
            //
            // Width only. A `[&>img]:block` here would out-specify the
            // `hidden` on the inactive theme's image ((0,1,1) beats (0,1,0))
            // and render both, so each image sets its own display below.
            "[&>img]:w-full",
          )}
        >
          {/*
            Two <img>s toggled by the theme class rather than a <picture> with
            `media`: `prefers-color-scheme` reports the OS setting, which the
            header toggle can override, so a reader on a light OS who picked
            dark would get the light screenshot on a dark page.

            `loading="lazy"` is what keeps the cost of shipping both sets to
            one: browsers skip lazy images that are `display:none`, so only the
            active theme's file is ever fetched.
          */}
          <img
            src={`/features/light/${shot}.png`}
            alt={alt ?? title}
            loading="lazy"
            className="block dark:hidden"
          />
          <img
            src={`/features/dark/${shot}.png`}
            alt={alt ?? title}
            loading="lazy"
            className="hidden dark:block"
          />
        </figure>
      )}
    </div>
  );
}

/** Inline code, matching the density used across the site's prose. */
export function C({ children }: { children: string }) {
  return <code className="font-mono text-[0.92em] text-foreground">{children}</code>;
}
