import {
  EvidenceBundle,
  type EvidenceRecord,
  type StartupFailureClassification,
} from "@repo/schemas/evidence";
import { classifyStartupFailure, toEvidenceRecords, type RawEvidence } from "./classifier.js";

export type BuildBundleInput = {
  sessionId: string;
  raw: RawEvidence;
  rawLogsRef?: string;
  classifierOverride?: StartupFailureClassification;
};

export function buildEvidenceBundle(input: BuildBundleInput): EvidenceBundle {
  const classification = input.classifierOverride ?? classifyStartupFailure(input.raw);
  const evidence: EvidenceRecord[] = toEvidenceRecords(input.raw);
  return EvidenceBundle.parse({
    bundleId: crypto.randomUUID(),
    sessionId: input.sessionId,
    classification,
    evidence,
    rawLogsRef: input.rawLogsRef,
    createdAt: new Date().toISOString(),
  });
}
