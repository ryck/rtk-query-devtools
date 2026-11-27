import type { SVGProps } from "react"

export function LogoMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true" {...props}>
      {/* Same mark as public/logo.svg, on semantic tokens so it follows the
          page's theme rather than the OS one. */}
      <rect
        x="6"
        y="6"
        width="22"
        height="22"
        rx="4"
        fill="var(--foreground)"
      />
      <rect
        x="36"
        y="6"
        width="22"
        height="22"
        rx="4"
        fill="var(--foreground)"
        opacity="0.25"
      />
      <rect
        x="6"
        y="36"
        width="22"
        height="22"
        rx="4"
        fill="var(--foreground)"
        opacity="0.25"
      />
      <rect x="36" y="36" width="22" height="22" rx="4" fill="var(--primary)" />
    </svg>
  )
}
