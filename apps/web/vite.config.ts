import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    // Prerendered to static HTML rather than server-rendered. Every piece of
    // live content here is already behind <ClientOnly> (the store is a browser
    // singleton and the "API" is an in-memory fake), so there is nothing for a
    // server to render — this keeps the deploy a pure static upload with no
    // serverless runtime.
    tanstackStart({ prerender: { enabled: true, crawlLinks: true } }),
    viteReact(),
    tailwindcss(),
  ],
});
