import { buildEvidenceBundle, type RawEvidence } from "@repo/orchestration";
import type { EvidenceBundle } from "@repo/schemas/evidence";
import type { RecoveryScenario } from "@repo/schemas/recovery";
import { getRuntimeOrchestration } from "./runtime-integration.js";

/**
 * Runtime entry point called from the actual hook pipeline when a worker
 * timeout is detected. Wires evidence collection → recovery ledger start.
 *
 * Intended to be imported from runtime's existing hook event handlers
 * (e.g. utils/hooks/hookEvents.ts). Keeping it as a standalone function
 * with explicit dependencies avoids coupling runtime hooks to orchestration
 * initialization order.
 */
export type WorkerTimeoutContext = {
  sessionId: string;
  raw: RawEvidence;
  rawLogsRef?: string;
  scenario: RecoveryScenario;
};

export type WorkerTimeoutOutcome = {
  bundle: EvidenceBundle;
  attemptId: string;
  recipe: string;
};

export async function onRuntimeWorkerTimeout(
  ctx: WorkerTimeoutContext,
): Promise<WorkerTimeoutOutcome> {
  const orch = getRuntimeOrchestration();
  const bundle = buildEvidenceBundle({
    sessionId: ctx.sessionId,
    raw: ctx.raw,
    rawLogsRef: ctx.rawLogsRef,
  });
  const attempt = await orch.ledger.startAttempt({
    sessionId: ctx.sessionId,
    scenario: ctx.scenario,
  });
  return {
    bundle,
    attemptId: attempt.attemptId,
    recipe: ctx.scenario,
  };
}

export async function markRuntimeRecoveryComplete(
  attemptId: string,
  result: "success" | "failed" | "escalated",
  stepsExecuted: string[],
  escalationReason?: string,
): Promise<void> {
  const orch = getRuntimeOrchestration();
  await orch.ledger.completeAttempt({
    attemptId,
    result,
    stepsExecuted,
    escalationReason,
  });
}
