import { config } from "@repo/eslint-config/base";

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...config,
  {
    languageOptions: {
      globals: {
        Bun: "readonly",
        process: "readonly",
      },
    },
    rules: {
      "turbo/no-undeclared-env-vars": "off",
    },
  },
];
