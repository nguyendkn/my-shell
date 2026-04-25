type Stats = {
  collapsedSpans: number;
  // Total messages absorbed across all collapsed spans (sum of per-span sizes).
  collapsedMessages: number;
  stagedSpans: number;
  health: {
    // Total spawn attempts (success + fail). totalErrors / totalErrors ratio
    // gives the failure rate.
    totalSpawns: number;
    totalErrors: number;
    // Last error message recorded by a failed spawn — surfaced in the
    // /context output for debugging.
    lastError?: string;
    totalEmptySpawns: number;
    emptySpawnWarningEmitted: boolean;
  };
};

const stats: Stats = {
  collapsedSpans: 0,
  collapsedMessages: 0,
  stagedSpans: 0,
  health: {
    totalSpawns: 0,
    totalErrors: 0,
    totalEmptySpawns: 0,
    emptySpawnWarningEmitted: false,
  },
};

const listeners = new Set<() => void>();

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getStats(): Stats {
  return stats;
}

export function isContextCollapseEnabled(): boolean {
  return false;
}

export function resetContextCollapse(): void {}

// Initialize the context-collapse subsystem. Stubbed off — the gate is
// always disabled in the restored runtime, so init is a no-op.
export function initContextCollapse(): void {}

export async function applyCollapsesIfNeeded<T>(
  messages: T,
  _toolUseContext?: unknown,
  _querySource?: unknown,
): Promise<{
  messages: T;
  changed: boolean;
}> {
  return { messages, changed: false };
}

export function isWithheldPromptTooLong(
  _msg?: unknown,
  _isPromptTooLongMessage?: unknown,
  _querySource?: unknown,
): boolean {
  return false;
}

// Drain staged context-collapses into the message array. The restored
// runtime never stages anything, so committed is always 0 and messages is
// returned unchanged. Shape matches the real impl so query.ts narrows on
// `drained.committed > 0`.
export function recoverFromOverflow<T>(
  messages: T,
  _querySource?: unknown,
): { messages: T; committed: number } {
  return { messages, committed: 0 };
}
