import { z } from "zod";

export const PolicyCondition = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("GreenAt"),
    level: z.enum(["commit", "pr", "merge"]),
  }),
  z.object({ kind: z.literal("StaleBranch") }),
  z.object({ kind: z.literal("StartupBlocked") }),
  z.object({ kind: z.literal("LaneCompleted") }),
  z.object({ kind: z.literal("ReviewPassed") }),
  z.object({
    kind: z.literal("ScopedDiff"),
    maxFiles: z.number().int().positive().optional(),
  }),
  z.object({
    kind: z.literal("TimedOut"),
    afterMs: z.number().int().positive(),
  }),
]);
export type PolicyCondition = z.infer<typeof PolicyCondition>;

export type PolicyAction =
  | { kind: "MergeToDev" }
  | { kind: "MergeForward"; target: string }
  | { kind: "RecoverOnce" }
  | { kind: "Escalate"; notifyChannel?: string }
  | { kind: "CloseoutLane" }
  | { kind: "Notify"; message: string }
  | { kind: "Block"; reason: string }
  | { kind: "Chain"; actions: PolicyAction[] };

export const PolicyAction: z.ZodType<PolicyAction> = z.lazy(() =>
  z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("MergeToDev") }),
    z.object({ kind: z.literal("MergeForward"), target: z.string() }),
    z.object({ kind: z.literal("RecoverOnce") }),
    z.object({
      kind: z.literal("Escalate"),
      notifyChannel: z.string().optional(),
    }),
    z.object({ kind: z.literal("CloseoutLane") }),
    z.object({ kind: z.literal("Notify"), message: z.string() }),
    z.object({ kind: z.literal("Block"), reason: z.string() }),
    z.object({ kind: z.literal("Chain"), actions: z.array(PolicyAction) }),
  ]),
);

export const PolicyRule = z.object({
  id: z.string(),
  name: z.string(),
  condition: PolicyCondition,
  action: PolicyAction,
  priority: z.number().int().nonnegative().default(0),
  enabled: z.boolean().default(true),
  dryRun: z.boolean().default(true),
});
export type PolicyRule = z.infer<typeof PolicyRule>;
