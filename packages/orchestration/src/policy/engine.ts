import type { LaneEvent } from "@repo/schemas/lane-event";
import type { PolicyAction, PolicyCondition, PolicyRule } from "@repo/schemas/policy";
import { PolicyConflictError } from "./conflict.js";

export type EvaluationContext = {
  now?: Date;
  startedAt?: Date;
  reviewPassed?: boolean;
  scopedDiffFileCount?: number;
};

export type EvaluationMode = "dry-run" | "execute";

export type MatchedRule = { rule: PolicyRule; action: PolicyAction };

export type EvaluationResult = {
  mode: EvaluationMode;
  matched: MatchedRule[];
  selected: MatchedRule | null;
  skippedDueToGuard: PolicyRule[];
};

export type GuardCheck = (rule: PolicyRule) => { ok: boolean; reason?: string };

function matchCondition(
  condition: PolicyCondition,
  event: LaneEvent,
  ctx?: EvaluationContext,
): boolean {
  switch (condition.kind) {
    case "GreenAt":
      return event.type === "lane.green";
    case "StaleBranch":
      return event.type === "branch.stale_against_main";
    case "StartupBlocked":
      return event.type === "lane.blocked";
    case "LaneCompleted":
      return event.type === "lane.finished";
    case "ReviewPassed":
      return event.type === "lane.pr.opened" && ctx?.reviewPassed === true;
    case "ScopedDiff": {
      if (event.type !== "lane.commit.created") return false;
      if (condition.maxFiles == null) return true;
      const count = ctx?.scopedDiffFileCount;
      return typeof count === "number" && count <= condition.maxFiles;
    }
    case "TimedOut": {
      if (!ctx?.startedAt) return false;
      const now = ctx.now ?? new Date();
      return now.getTime() - ctx.startedAt.getTime() >= condition.afterMs;
    }
    default: {
      const _exhaustive: never = condition;
      return _exhaustive;
    }
  }
}

function defaultGuard(): { ok: boolean } {
  return { ok: true };
}

export class PolicyEngine {
  private readonly guard: GuardCheck;

  constructor(options: { guard?: GuardCheck } = {}) {
    this.guard = options.guard ?? defaultGuard;
  }

  evaluate(
    event: LaneEvent,
    rules: readonly PolicyRule[],
    options: { mode?: EvaluationMode; context?: EvaluationContext } = {},
  ): EvaluationResult {
    const mode: EvaluationMode = options.mode ?? "dry-run";
    const matched: MatchedRule[] = [];
    const skippedDueToGuard: PolicyRule[] = [];

    for (const rule of rules) {
      if (!rule.enabled) continue;
      if (!matchCondition(rule.condition, event, options.context)) continue;
      if (mode === "execute") {
        const g = this.guard(rule);
        if (!g.ok) {
          skippedDueToGuard.push(rule);
          continue;
        }
      }
      matched.push({ rule, action: rule.action });
    }

    matched.sort((a, b) => b.rule.priority - a.rule.priority);

    if (matched.length >= 2) {
      const top = matched[0]!.rule.priority;
      const ties = matched.filter((m) => m.rule.priority === top);
      if (ties.length > 1) {
        throw new PolicyConflictError(
          ties.map((t) => t.rule),
          top,
        );
      }
    }

    const selected = mode === "execute" && matched.length > 0 ? matched[0]! : null;

    return { mode, matched, selected, skippedDueToGuard };
  }
}
