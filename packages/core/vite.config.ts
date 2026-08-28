import { resolve } from "node:path"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "vite"
import dts from "vite-plugin-dts"

export default defineConfig({
  plugins: [
    tailwindcss(),
    dts({
      include: ["src"],
      // Tests and their scaffolding are not part of the public surface. Without
      // this they ship as stray `.d.ts` files in the published tarball.
      exclude: ["src/**/*.test.*", "src/test-utils/**"],
      // Not `bundleTypes: true`. That path runs API Extractor, which carries
      // its own TypeScript and cannot follow the declarations TS 7 emits —
      // it dies on `Record` with "Unable to follow symbol". Per-file `.d.ts`
      // is what ships instead: more files in the tarball, identical types.
    }),
  ],
  build: {
    lib: {
      entry: resolve(import.meta.dirname, "src/index.ts"),
      formats: ["es"],
      fileName: () => "index.mjs",
      cssFileName: "style",
    },
    outDir: "dist",
    sourcemap: true,
    rollupOptions: {
      external: ["react", "react-dom", "react/jsx-runtime", "@reduxjs/toolkit"],
    },
  },
})
