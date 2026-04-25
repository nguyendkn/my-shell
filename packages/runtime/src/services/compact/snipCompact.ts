// Stub return shape for snipCompact. Real impl emits a boundary system
// message and reports how many tokens the snip freed; the restored runtime
// always returns the no-op shape so callers fall through.
//
// `executed` is set when QueryEngine's snipReplay path actually ran the snip
// (vs. returning early because the message wasn't a boundary). The stub
// always reports false.
export type SnipCompactResult<T> = {
  messages: T;
  changed: boolean;
  tokensFreed: number;
  boundaryMessage?: undefined;
  executed: boolean;
};

export function snipCompactIfNeeded<T>(messages: T, _options?: unknown): SnipCompactResult<T> {
  return { messages, changed: false, tokensFreed: 0, executed: false };
}

// Mirrors snipProjection.isSnipBoundaryMessage — both modules expose the
// same predicate, callers reach whichever one is in scope. Stubbed off.
export function isSnipBoundaryMessage(_msg?: unknown): boolean {
  return false;
}

// Per-message snip-marker predicate; stubbed off in the restored runtime.
export function isSnipMarkerMessage(_msg?: unknown): boolean {
  return false;
}

// Feature-gated runtime check. Stubbed off so the HISTORY_SNIP code paths
// (gated by `feature("HISTORY_SNIP")`) treat snip as unavailable in the
// restored runtime. Returns false so callers fall through to the legacy
// (non-snip) behavior.
export function isSnipRuntimeEnabled(): boolean {
  return false;
}

// Nudge text the runtime injects when context_efficiency reminders fire and
// HISTORY_SNIP is enabled. Empty in the restored runtime since
// isSnipRuntimeEnabled() is false and the gate above this never executes.
export const SNIP_NUDGE_TEXT = "";

// Whether to inject the snip nudge given the current message tail. False
// here so the nudge never appears in the restored runtime.
export function shouldNudgeForSnips(_messages: unknown): boolean {
  return false;
}
