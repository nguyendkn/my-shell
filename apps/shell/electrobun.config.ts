import type { ElectrobunConfig } from "electrobun";

export default {
  app: {
    name: "FPTClaw",
    identifier: "dev.fptclaw.agent",
    version: "0.0.0",
  },
  runtime: {
    exitOnLastWindowClosed: true,
  },
  build: {
    bun: {
      entrypoint: "src/electrobun/index.ts",
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
