import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router";
import { Analytics } from "@vercel/analytics/react";
import type { ReactNode } from "react";
import { NotFound } from "@/components/not-found";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import appCss from "../styles.css?url";

const SITE_URL = "https://rtk-query-devtools.ryck.dev/";
const TITLE = "RTK Query Devtools";
const DESCRIPTION =
  "See what your RTK Query cache is actually doing — live query status, tags, and request timeline, right inside TanStack DevTools.";
const OG_IMAGE_ALT =
  "rtk-query-devtools — a live status board listing cached RTK Query endpoints with fresh and error badges.";

export const Route = createRootRoute({
  notFoundComponent: NotFound,
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      // Shared by both routes; the pages are prerendered, so these are in the
      // static HTML that crawlers and unfurlers actually see.
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: TITLE },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:url", content: SITE_URL },
      // Absolute URL — unfurlers don't resolve relative paths.
      { property: "og:image", content: `${SITE_URL}og-image.png` },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: OG_IMAGE_ALT },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
      { name: "twitter:image", content: `${SITE_URL}og-image.png` },
      { name: "twitter:image:alt", content: OG_IMAGE_ALT },
      // Tints browser chrome on mobile to match the page background.
      { name: "theme-color", content: "#0c0f16" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      // SVG first for browsers that take it; the PNG is the fallback for the
      // ones that don't, and for contexts that only ever fetch a raster icon.
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "icon", href: "/favicon-32.png", type: "image/png", sizes: "32x32" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png", sizes: "180x180" },
      { rel: "manifest", href: "/site.webmanifest" },
      // No canonical here on purpose. Unlike `meta`, `links` are not deduped
      // by the head manager, so a root-level canonical would emit a second,
      // conflicting one on every child route. Each route sets its own.
    ],
  }),
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <div className="flex min-h-screen flex-col">
          <SiteHeader />
          <div className="flex-1">{children}</div>
          <SiteFooter />
        </div>
        {/*
          Injects the analytics script on the client. It no-ops off Vercel, so
          local dev and the prerender pass stay inert — nothing is recorded
          while the pages are being generated at build time.
        */}
        <Analytics />
        <Scripts />
      </body>
    </html>
  );
}
