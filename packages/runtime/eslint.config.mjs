import { config } from "@repo/eslint-config/runtime";

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...config,
  {
    ignores: ["dist/**", "node_modules/**", "vendor/**", "shims/**"],
  },
];
