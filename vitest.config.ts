import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "unit",
          environment: "jsdom",
          include: ["packages/core/src/**/*.test.{ts,tsx}"],
          globals: false,
        },
      },
    ],
  },
})
