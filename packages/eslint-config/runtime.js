import globals from "globals";
import { config as reactConfig } from "./react-internal.js";

/**
 * ESLint configuration for the restored Bun/React runtime package.
 *
 * @type {import("eslint").Linter.Config[]}
 */
export const config = [
  ...reactConfig,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        Bun: "readonly",
        MACRO: "readonly",
      },
    },
  },
];
