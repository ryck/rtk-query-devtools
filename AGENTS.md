This project uses Base UI. Its documentation can be found at https://base-ui.com/llms.txt.
Base UI components do not have the same API as Radix UI; this includes props, data attributes, or components.
There is no asChild prop on any component; instead, the render prop is used. Read Base UI's composition guide for details on how to use render: https://base-ui.com/react/handbook/composition.md.
Always consult the Base UI llms.txt doc before building components with Base UI to ensure the correct patterns are being used.

## Style

oxlint and oxfmt at the repo root, one pass over everything. No ESLint, no Prettier, no
`prettier-plugin-tailwindcss` — oxfmt sorts Tailwind classes natively.

Formatting is **no semicolons, double quotes, 2-space indent, 80 columns, ES5 trailing
commas**. Run `pnpm lint:fix` and `pnpm format`.

When a lint rule is switched off, say why in a comment above it.

## Sibling project

`shadcn-familytree` shares this project's palette, fonts, header/footer patterns, lint and
format configs, and Base UI + TanStack Start stack. Changes to shared conventions —
`apps/web/src/styles.css` tokens, `.oxfmtrc.json`, `.oxlintrc.json`, `site-header.tsx` /
`site-footer.tsx` / `lib/link.ts` — should land in both so they keep reading as one family.

Note the palettes are intentionally identical: the brand tokens in `@theme` here and in
`packages/ui/src/styles/globals.css` there are the same values.
