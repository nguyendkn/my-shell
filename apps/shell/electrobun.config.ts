import type { ElectrobunConfig } from "electrobun";

export default {
  app: {
    name: "MyShell",
    identifier: "dev.myshell.shell",
    version: "0.0.0",
  },
  runtime: {
    exitOnLastWindowClosed: true,
  },
  build: {
    bun: {
      entrypoint: "src/electrobun/main.ts",
    },
    copy: {
      dist: "views/shell",
    },
    watch: ["src", "index.html", "vite.config.ts"],
    watchIgnore: ["dist/**"],
  },
  scripts: {
    preBuild: "./scripts/build-renderer.ts",
  },
} satisfies ElectrobunConfig;
