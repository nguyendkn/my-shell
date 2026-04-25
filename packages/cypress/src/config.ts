import { defineConfig } from "cypress";

type CreateCypressConfigOptions = Parameters<typeof defineConfig>[0];

export function createCypressConfig(options: CreateCypressConfigOptions = {}) {
  const { e2e, ...rootOptions } = options;

  return defineConfig({
    allowCypressEnv: false,
    video: false,
    screenshotOnRunFailure: true,
    ...rootOptions,
    e2e: {
      baseUrl: process.env.CYPRESS_BASE_URL ?? "http://127.0.0.1:5173",
      specPattern: "cypress/e2e/**/*.cy.{js,jsx,ts,tsx}",
      supportFile: false,
      ...e2e,
    },
  });
}
