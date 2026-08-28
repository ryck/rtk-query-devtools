---
"rtk-query-devtools": patch
---

Fix a stale-codec hazard in `usePersistentState`, and ship unbundled type declarations.

`usePersistentState` assigned to a ref during render to keep an inline `codec`
object from retriggering its write effect. Writing a ref mid-render is
observable when React renders without committing — under a concurrent
re-render the persisted value could be serialised with a codec from a render
that was thrown away. The assignment now happens in an effect declared ahead
of the write effect, so the codec is current by the time the write reads it.
No API change, and the read-on-mount / write-on-change behaviour is unchanged.

The package now builds under TypeScript 7. Two consequences for the published
artifact:

- `dist/` carries per-file `.d.ts` instead of a single bundled declaration.
  API Extractor, which `bundleTypes` relies on, cannot follow the declarations
  TS 7 emits (it fails on `Record` with "Unable to follow symbol"), and this
  is not fixed in its current release. `types` still points at
  `dist/index.d.ts` and the exported types are identical — there are simply
  more files in the tarball.
- Building from source now needs `@typescript/typescript6` alongside
  TypeScript 7, because TS 7 no longer ships the JavaScript Compiler API the
  declaration emitter uses. This is a devDependency and does not affect
  consumers.
