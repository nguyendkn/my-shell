// Stub for ant-only attribution hooks. Runtime fallback is no-op.

export async function clearAttributionCaches(): Promise<void> {
  // no-op
}

export async function clearAllAttributionState(): Promise<void> {
  // no-op
}

// Register the COMMIT_ATTRIBUTION hook handlers with the central hook
// registry. Stubbed off — attribution tracking is ant-only.
export function registerAttributionHooks(_registry?: unknown): void {}

// Periodic GC entry called by post-compact cleanup; the restored runtime
// has no attribution cache to sweep.
export function sweepFileContentCache(): void {}

export default {
  clearAttributionCaches,
  clearAllAttributionState,
  registerAttributionHooks,
  sweepFileContentCache,
};
