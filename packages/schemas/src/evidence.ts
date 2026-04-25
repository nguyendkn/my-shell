import { z } from "zod";

export const StartupFailureClassification = z.enum([
  "TrustRequired",
  "PromptMisdelivery",
  "PromptAcceptanceTimeout",
  "TransportDead",
  "WorkerCrashed",
  "Unknown",
]);
export type StartupFailureClassification = z.infer<typeof StartupFailureClassification>;

export const EvidenceRecord = z.object({
  kind: z.string(),
  value: z.unknown(),
  capturedAt: z.string().datetime(),
});
export type EvidenceRecord = z.infer<typeof EvidenceRecord>;

export const EvidenceBundle = z.object({
  bundleId: z.string().uuid(),
  sessionId: z.string(),
  classification: StartupFailureClassification,
  evidence: z.array(EvidenceRecord),
  rawLogsRef: z.string().optional(),
  createdAt: z.string().datetime(),
});
export type EvidenceBundle = z.infer<typeof EvidenceBundle>;
