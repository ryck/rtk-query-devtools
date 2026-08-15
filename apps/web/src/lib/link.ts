/**
 * The single treatment for text links: header nav, footer, and inline prose.
 *
 * A hairline underline rather than colour alone, so links are identifiable
 * without relying on a colour difference that's easy to miss against this
 * palette's muted body text. Both the text and the underline brighten on
 * hover, which also covers links that already sit at full contrast.
 *
 * Deliberately *not* applied to the things that only look like links: the
 * brand wordmark, the calls to action carrying `buttonVariants` (the homepage
 * Playground button and both on the 404 page), and the pill-shaped section
 * index on /features. Those are different affordances and underlining them
 * would flatten the distinction.
 */
export const textLink =
  "underline decoration-panel-line underline-offset-2 transition-colors hover:text-paper hover:decoration-mist";

/** Applied alongside `textLink` for the current route in the header nav. */
export const textLinkActive = "text-paper decoration-mist";
