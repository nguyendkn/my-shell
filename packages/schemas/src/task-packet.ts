import { z } from "zod";

export const TaskScope = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("Workspace") }),
  z.object({ kind: z.literal("Module"), path: z.string() }),
  z.object({ kind: z.literal("SingleFile"), path: z.string() }),
  z.object({ kind: z.literal("Custom"), description: z.string() }),
]);
export type TaskScope = z.infer<typeof TaskScope>;

export const CommitPolicy = z.enum(["atomic", "squash", "per-file", "none"]);
export type CommitPolicy = z.infer<typeof CommitPolicy>;

export const EscalationPolicy = z.object({
  afterAttempts: z.number().int().positive().default(1),
  notifyChannel: z.string().optional(),
  humanReview: z.boolean().default(false),
});
export type EscalationPolicy = z.infer<typeof EscalationPolicy>;

export const TaskPacket = z.object({
  objective: z.string().min(1),
  scope: TaskScope,
  repo: z.string().min(1),
  worktree: z.string().optional(),
  branchPolicy: z.string().default("feature/<task-id>"),
  acceptanceTests: z.array(z.string()).default([]),
  commitPolicy: CommitPolicy.default("atomic"),
  reportingContract: z.string().default("standard"),
  escalationPolicy: EscalationPolicy.default({
    afterAttempts: 1,
    humanReview: false,
  }),
});
export type TaskPacket = z.infer<typeof TaskPacket>;

export const ValidatedPacket = TaskPacket.extend({
  validatedAt: z.string().datetime(),
  validator: z.string(),
  packetId: z.string().uuid(),
});
export type ValidatedPacket = z.infer<typeof ValidatedPacket>;

export function validatePacket(raw: unknown, validator: string): ValidatedPacket {
  const parsed = TaskPacket.parse(raw);
  return ValidatedPacket.parse({
    ...parsed,
    validatedAt: new Date().toISOString(),
    validator,
    packetId: crypto.randomUUID(),
  });
}
