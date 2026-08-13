# Contributing

## Setup

```bash
pnpm install
```

## Development

```bash
pnpm dev          # watch-build packages/core
pnpm dev:demo     # run the demo app (in another terminal)
```

## Testing

```bash
pnpm test         # unit tests (watch)
pnpm test:ci      # unit tests (CI mode)
pnpm test:e2e     # Playwright e2e against the built demo
```

## Before opening a PR

```bash
pnpm lint
pnpm typecheck
pnpm test:ci
pnpm changeset    # describe your change for the changelog
```

## Releasing

Releases are automated via [Changesets](https://github.com/changesets/changesets).
Merging the "Version Packages" PR that the release workflow opens publishes to npm.
