import { Heart } from "lucide-react"
import { textLink } from "@/lib/link"

const LINKS = [
  { href: "https://www.npmjs.com/package/rtk-query-devtools", label: "npm" },
  { href: "https://tanstack.com/devtools", label: "DevTools" },
  {
    href: "https://redux-toolkit.js.org/rtk-query/overview",
    label: "RTK Query",
  },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-6 py-8 font-mono text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span>
          {/*
            The phrase is the hover target, not the heart: at 12px the icon
            alone is a fiddly thing to land on.
          */}
          <span className="group">
            Made with{" "}
            {/*
              A lucide icon rather than an emoji, so the heart takes the brand
              amber instead of the font's own colour. `fill-primary` wins over
              lucide's `fill="none"` attribute because CSS beats presentation
              attributes. `inline-block` because transforms do not apply to
              inline boxes, so the beat would otherwise do nothing. Labelled,
              so this reads "Made with love by ryck.dev" rather than skipping
              the word entirely.
            */}
            <Heart
              size={12}
              role="img"
              aria-label="love"
              className="inline-block fill-primary align-[-0.1em] text-primary group-hover:animate-heartbeat"
            />{" "}
            by{" "}
            <a
              href="https://ryck.dev"
              target="_blank"
              rel="noreferrer"
              className={textLink}
            >
              ryck.dev
            </a>
          </span>
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
  )
}
