import type { PolicyRule } from "@repo/schemas/policy";

export class PolicyConflictError extends Error {
  readonly rules: ReadonlyArray<PolicyRule>;
  readonly priority: number;
  constructor(rules: ReadonlyArray<PolicyRule>, priority: number) {
    const ids = rules.map((r) => r.id).join(", ");
    super(
      `Policy conflict at priority ${priority}: multiple rules match [${ids}]. Priorities must be unique for deterministic resolution.`,
    );
    this.name = "PolicyConflictError";
    this.rules = rules;
    this.priority = priority;
  }
}
