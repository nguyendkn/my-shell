import type { RecoveryRecipe, RecoveryScenario } from "@repo/schemas/recovery";

export const DEFAULT_RECIPES: Record<RecoveryScenario, RecoveryRecipe> = {
  TrustPromptUnresolved: {
    scenario: "TrustPromptUnresolved",
    steps: [
      { name: "detect", action: "evidence.classify" },
      { name: "accept", action: "trust.prompt.accept", timeoutMs: 10_000 },
    ],
    autoAttempt: true,
    maxAttempts: 1,
  },
  PromptMisdelivery: {
    scenario: "PromptMisdelivery",
    steps: [{ name: "redirect", action: "prompt.redirect", timeoutMs: 5_000 }],
    autoAttempt: true,
    maxAttempts: 1,
  },
  StaleBranch: {
    scenario: "StaleBranch",
    steps: [
      { name: "fetch", action: "git.fetch", timeoutMs: 30_000 },
      { name: "rebase", action: "git.rebase", timeoutMs: 60_000 },
    ],
    autoAttempt: true,
    maxAttempts: 1,
  },
  CompileRed: {
    scenario: "CompileRed",
    steps: [
      { name: "clean", action: "build.clean" },
      { name: "rebuild", action: "build.rebuild", timeoutMs: 180_000 },
    ],
    autoAttempt: true,
    maxAttempts: 1,
  },
  McpHandshakeFailure: {
    scenario: "McpHandshakeFailure",
    steps: [{ name: "reconnect", action: "mcp.handshake.retry", timeoutMs: 5_000 }],
    autoAttempt: true,
    maxAttempts: 1,
  },
  PartialPluginStartup: {
    scenario: "PartialPluginStartup",
    steps: [
      {
        name: "restart",
        action: "plugin.restart.failed_servers",
        timeoutMs: 20_000,
      },
    ],
    autoAttempt: true,
    maxAttempts: 1,
  },
  ProviderFailure: {
    scenario: "ProviderFailure",
    steps: [{ name: "restart-worker", action: "worker.restart", timeoutMs: 30_000 }],
    autoAttempt: true,
    maxAttempts: 1,
  },
};

export function getRecipe(scenario: RecoveryScenario): RecoveryRecipe {
  return DEFAULT_RECIPES[scenario];
}
