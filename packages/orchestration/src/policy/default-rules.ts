import { PolicyRule } from "@repo/schemas/policy";

export const DEFAULT_RULES: PolicyRule[] = [
  PolicyRule.parse({
    id: "stale-branch-rebase",
    name: "Rebase stale branch before broad tests",
    condition: { kind: "StaleBranch" },
    action: { kind: "RecoverOnce" },
    priority: 90,
  }),
  PolicyRule.parse({
    id: "startup-blocked-recover",
    name: "Auto-recover from startup block, then escalate",
    condition: { kind: "StartupBlocked" },
    action: {
      kind: "Chain",
      actions: [{ kind: "RecoverOnce" }, { kind: "Escalate" }],
    },
    priority: 80,
  }),
  PolicyRule.parse({
    id: "lane-completed-closeout",
    name: "Close out finished lane and clean up session",
    condition: { kind: "LaneCompleted" },
    action: { kind: "CloseoutLane" },
    priority: 50,
  }),
  PolicyRule.parse({
    id: "scoped-green-merge-notify",
    name: "Notify when green + scoped diff (does NOT auto-merge)",
    condition: { kind: "GreenAt", level: "pr" },
    action: {
      kind: "Notify",
      message: "Lane is green with scoped diff — ready for review/merge",
    },
    priority: 30,
  }),
  PolicyRule.parse({
    id: "timeout-escalate",
    name: "Escalate long-running lanes after 30 min",
    condition: { kind: "TimedOut", afterMs: 30 * 60 * 1000 },
    action: { kind: "Escalate", notifyChannel: "oncall" },
    priority: 10,
  }),
];
