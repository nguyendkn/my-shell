import type { EvidenceRecord, StartupFailureClassification } from "@repo/schemas/evidence";

export type RawEvidence = {
  trustPromptDetected?: boolean;
  trustPromptPendingMs?: number;
  promptSent?: boolean;
  promptAcceptanceSeen?: boolean;
  paneCommand?: string;
  transportLastResponseMs?: number;
  transportConnected?: boolean;
  mcpHealth?: "healthy" | "degraded" | "dead";
  workerExited?: boolean;
  workerExitCode?: number;
};

const TRANSPORT_DEAD_THRESHOLD_MS = 90_000;

export function classifyStartupFailure(raw: RawEvidence): StartupFailureClassification {
  if (raw.trustPromptDetected === true && raw.trustPromptPendingMs != null) {
    return "TrustRequired";
  }
  if (raw.promptSent === true && raw.paneCommand != null) {
    if (raw.promptAcceptanceSeen === false) {
      return "PromptMisdelivery";
    }
  }
  if (
    raw.promptSent === true &&
    raw.promptAcceptanceSeen !== true &&
    raw.trustPromptDetected !== true
  ) {
    return "PromptAcceptanceTimeout";
  }
  if (
    raw.transportConnected === false ||
    (raw.transportLastResponseMs != null &&
      raw.transportLastResponseMs >= TRANSPORT_DEAD_THRESHOLD_MS) ||
    raw.mcpHealth === "dead"
  ) {
    return "TransportDead";
  }
  if (raw.workerExited === true) {
    return "WorkerCrashed";
  }
  return "Unknown";
}

export function toEvidenceRecords(raw: RawEvidence): EvidenceRecord[] {
  const now = new Date().toISOString();
  const records: EvidenceRecord[] = [];
  const add = (kind: string, value: unknown) => {
    if (value !== undefined) {
      records.push({ kind, value, capturedAt: now });
    }
  };
  add("trust.prompt.detected", raw.trustPromptDetected);
  add("trust.prompt.pending_ms", raw.trustPromptPendingMs);
  add("prompt.sent", raw.promptSent);
  add("prompt.acceptance.seen", raw.promptAcceptanceSeen);
  add("pane.command", raw.paneCommand);
  add("transport.last_response_ms", raw.transportLastResponseMs);
  add("transport.connected", raw.transportConnected);
  add("mcp.health", raw.mcpHealth);
  add("worker.exited", raw.workerExited);
  add("worker.exit_code", raw.workerExitCode);
  return records;
}
