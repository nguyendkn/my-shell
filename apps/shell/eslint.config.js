import { config } from "@repo/eslint-config/react-internal";

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...config,
  {
    ignores: ["build/**"],
  },
  {
    files: ["electrobun.config.ts", "scripts/**/*.ts", "src/electrobun/**/*.ts"],
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
  {
    rules: {
      "react/prop-types": "off",
    },
  },
];
