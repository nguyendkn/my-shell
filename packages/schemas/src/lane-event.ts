import { z } from "zod";

export const EventProvenance = z.enum(["LiveLane", "Test", "Healthcheck", "Replay", "Transport"]);
export type EventProvenance = z.infer<typeof EventProvenance>;

export const SessionIdentity = z.object({
  sessionId: z.string(),
  laneId: z.string(),
  agentId: z.string().optional(),
  title: z.string().optional(),
  workspace: z.string().optional(),
  purpose: z.string().optional(),
});
export type SessionIdentity = z.infer<typeof SessionIdentity>;

export const WatcherAction = z.enum(["act", "observe", "ignore"]);
export type WatcherAction = z.infer<typeof WatcherAction>;

export const LaneOwnership = z.object({
  owner: z.string(),
  workflowScope: z.string().optional(),
  watcherAction: WatcherAction.default("act"),
});
export type LaneOwnership = z.infer<typeof LaneOwnership>;

const LaneEventBase = z.object({
  sequence: z.number().int().nonnegative(),
  timestamp: z.string().datetime(),
  provenance: EventProvenance,
  session: SessionIdentity,
  ownership: LaneOwnership.optional(),
});

export const LaneEvent = z.discriminatedUnion("type", [
  LaneEventBase.extend({ type: z.literal("lane.started") }),
  LaneEventBase.extend({ type: z.literal("lane.ready") }),
  LaneEventBase.extend({ type: z.literal("lane.blocked"), reason: z.string() }),
  LaneEventBase.extend({ type: z.literal("lane.red"), errors: z.array(z.string()) }),
  LaneEventBase.extend({ type: z.literal("lane.green") }),
  LaneEventBase.extend({
    type: z.literal("lane.commit.created"),
    commitSha: z.string(),
    message: z.string(),
  }),
  LaneEventBase.extend({
    type: z.literal("lane.pr.opened"),
    prNumber: z.number().int().positive(),
    url: z.string().url(),
  }),
  LaneEventBase.extend({
    type: z.literal("lane.finished"),
    outcome: z.enum(["success", "failure", "cancelled"]),
  }),
  LaneEventBase.extend({
    type: z.literal("lane.failed"),
    classification: z.string().optional(),
    error: z.string(),
  }),
  LaneEventBase.extend({
    type: z.literal("branch.stale_against_main"),
    branch: z.string(),
    behindBy: z.number().int().nonnegative(),
  }),
]);
export type LaneEvent = z.infer<typeof LaneEvent>;

export type LaneEventType = LaneEvent["type"];

export function assertNever(x: never): never {
  throw new Error(`Unexpected LaneEvent variant: ${JSON.stringify(x)}`);
}
