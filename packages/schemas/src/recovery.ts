import { z } from "zod";

export const RecoveryScenario = z.enum([
  "TrustPromptUnresolved",
  "PromptMisdelivery",
  "StaleBranch",
  "CompileRed",
  "McpHandshakeFailure",
  "PartialPluginStartup",
  "ProviderFailure",
]);
export type RecoveryScenario = z.infer<typeof RecoveryScenario>;

export const RecoveryStep = z.object({
  name: z.string(),
  action: z.string(),
  timeoutMs: z.number().int().positive().optional(),
});
export type RecoveryStep = z.infer<typeof RecoveryStep>;

export const RecoveryRecipe = z.object({
  scenario: RecoveryScenario,
  steps: z.array(RecoveryStep),
  autoAttempt: z.boolean().default(true),
  maxAttempts: z.number().int().positive().default(1),
});
export type RecoveryRecipe = z.infer<typeof RecoveryRecipe>;

export const RecoveryResult = z.enum(["success", "failed", "escalated", "in_progress"]);
export type RecoveryResult = z.infer<typeof RecoveryResult>;

export const RecoveryAttempt = z.object({
  attemptId: z.string().uuid(),
  sessionId: z.string(),
  scenario: RecoveryScenario,
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime().optional(),
  result: RecoveryResult,
  stepsExecuted: z.array(z.string()),
  escalationReason: z.string().optional(),
});
export type RecoveryAttempt = z.infer<typeof RecoveryAttempt>;
