import { defineConfig } from "cypress";

type CreateCypressConfigOptions = Parameters<typeof defineConfig>[0];

export function createCypressConfig(options: CreateCypressConfigOptions = {}) {
  const { e2e, ...rootOptions } = options;
  const specPattern =
    process.env.CYPRESS_SPEC_PATTERN ?? "cypress/e2e/**/*.cy.{js,jsx,ts,tsx}";

  return defineConfig({
    allowCypressEnv: false,
    video: false,
    screenshotOnRunFailure: true,
    ...rootOptions,
    e2e: {
      baseUrl: process.env.CYPRESS_BASE_URL ?? "http://127.0.0.1:5173",
      specPattern,
      supportFile: false,
      ...e2e,
    },
  });
}
