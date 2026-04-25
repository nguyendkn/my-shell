import { config } from "@repo/eslint-config/bun";

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...config,
  {
    ignores: ["dist/**", "node_modules/**"],
  },
];
