import path from "node:path";
import os from "node:os";
import {
  SqliteLedgerBackend,
  LaneEventConsumer,
  PolicyEngine,
  DEFAULT_RULES,
  type LedgerBackend,
} from "@repo/orchestration";
import type { PolicyRule } from "@repo/schemas/policy";

/**
 * Runtime-side orchestration wiring.
 *
 * Singleton accessors used by runtime hook entry points. Actual hook
 * invocation lives in runtime's existing hook pipeline — this module only
 * provides the primitives.
 *
 * Lives in runtime/src/orchestration/ with its own tsconfig so we can
 * type-check it without pulling in runtime's fork-level TS errors.
 */

const DEFAULT_LEDGER_PATH = path.join(
  process.env.HOME ?? os.homedir(),
  ".claude",
  "recovery-ledger.db",
);

export type RuntimeOrchestration = {
  ledger: LedgerBackend;
  laneConsumer: LaneEventConsumer;
  policyEngine: PolicyEngine;
  rules: PolicyRule[];
  shutdown: () => void | Promise<void>;
};

let instance: RuntimeOrchestration | null = null;

export async function initRuntimeOrchestration(
  options: {
    ledgerPath?: string;
    rules?: PolicyRule[];
  } = {},
): Promise<RuntimeOrchestration> {
  if (instance) {
    return instance;
  }
  const ledgerBackend = await SqliteLedgerBackend.open(options.ledgerPath ?? DEFAULT_LEDGER_PATH);
  const laneConsumer = new LaneEventConsumer();
  const policyEngine = new PolicyEngine();
  instance = {
    ledger: ledgerBackend,
    laneConsumer,
    policyEngine,
    rules: options.rules ?? DEFAULT_RULES,
    shutdown: () => {
      ledgerBackend.close();
      instance = null;
    },
  };
  return instance;
}

export function getRuntimeOrchestration(): RuntimeOrchestration {
  if (!instance) {
    throw new Error("RuntimeOrchestration not initialized. Call initRuntimeOrchestration() first.");
  }
  return instance;
}

export function hasRuntimeOrchestration(): boolean {
  return instance !== null;
}
