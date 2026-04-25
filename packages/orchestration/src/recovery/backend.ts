import type { RecoveryAttempt, RecoveryResult, RecoveryScenario } from "@repo/schemas/recovery";
import type { StartAttemptInput, CompleteAttemptInput } from "./ledger.js";

export type LedgerSummary = {
  total: number;
  byResult: Record<RecoveryResult, number>;
  byScenario: Record<RecoveryScenario, number>;
};

export interface LedgerBackend {
  startAttempt(input: StartAttemptInput): Promise<RecoveryAttempt>;
  completeAttempt(input: CompleteAttemptInput): Promise<RecoveryAttempt>;
  query(sessionId: string): Promise<RecoveryAttempt[]>;
  summarize(): Promise<LedgerSummary>;
}

export type LedgerBackendKind = "json" | "sqlite";
