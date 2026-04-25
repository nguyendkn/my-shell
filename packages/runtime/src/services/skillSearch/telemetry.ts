// Skill-search telemetry. Stubbed off — calls are no-ops in the restored runtime.

export function logSkillSearchTelemetry(): void {}

// Loaded-skill telemetry event with optional fields the call site populates
// based on whether the load succeeded (fileCount/totalBytes/fetchMethod) or
// failed (error). All inputs are accepted but discarded by this stub.
export function logRemoteSkillLoaded(_event: {
  slug: string;
  cacheHit: boolean;
  latencyMs: number;
  urlScheme: string;
  fileCount?: number;
  totalBytes?: number;
  fetchMethod?: string;
  error?: string;
}): void {}
