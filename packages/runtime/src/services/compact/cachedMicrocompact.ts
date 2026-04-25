// Stub for ant-only CACHED_MICROCOMPACT feature.
// All functions in this module are guarded by feature('CACHED_MICROCOMPACT')
// in microCompact.ts and api/claude.ts, so the runtime path is never hit
// in external builds. Provided as type-only stubs.

type Message = unknown;

// Cache-edits block sent to the API to evict tool results without
// invalidating the cached prefix. Each edit references a prior tool result
// by cache_reference id; the type field is a single-variant tag in the
// restored runtime but stays open for forward compatibility.
export interface CacheEditDelete {
  type: "delete";
  cache_reference: string;
}

export interface CacheEditsBlock {
  type: "cache_edits";
  edits: CacheEditDelete[];
}

export interface PinnedCacheEdits {
  readonly userMessageIndex: number;
  readonly block: CacheEditsBlock;
}

// Configuration shape returned by getCachedMCConfig — held by GrowthBook in
// the real impl. Stub returns zero thresholds so callers' branches don't
// fire, and they bail out on the isCachedMicrocompactEnabled() === false
// check above this anyway.
export interface CachedMCConfig {
  triggerThreshold: number;
  keepRecent: number;
  // Model identifiers gated on for cached microcompact. Logged for
  // observability when the gate decides whether to enable the path.
  supportedModels: readonly string[];
}

export interface CachedMCState {
  pinnedEdits: PinnedCacheEdits[];
  toolsSent: boolean;
  // Tool registration tracking. Real impl maintains insertion order in
  // toolOrder and tracks deletions in deletedRefs/registeredTools so the
  // analytics log accurately reports active vs deleted counts.
  registeredTools: Set<string>;
  toolOrder: string[];
  deletedRefs: Set<string>;
}

export function createCachedMCState(): CachedMCState {
  return {
    pinnedEdits: [],
    toolsSent: false,
    registeredTools: new Set(),
    toolOrder: [],
    deletedRefs: new Set(),
  };
}

export function markToolsSentToAPI(state: CachedMCState): void {
  state.toolsSent = true;
}

export function resetCachedMCState(state: CachedMCState): void {
  state.pinnedEdits = [];
  state.toolsSent = false;
  state.registeredTools.clear();
  state.toolOrder.length = 0;
  state.deletedRefs.clear();
}

// Feature gate. Stubbed off — the call site bails before any of the
// register* helpers below run.
export function isCachedMicrocompactEnabled(): boolean {
  return false;
}

// Whether the model supports the cache-editing API used by cached
// microcompact. False in the restored runtime regardless of model.
export function isModelSupportedForCacheEditing(_model: string): boolean {
  return false;
}

export function getCachedMCConfig(): CachedMCConfig {
  return { triggerThreshold: 0, keepRecent: 0, supportedModels: [] };
}

export function registerToolResult(state: CachedMCState, toolUseId: string): void {
  state.registeredTools.add(toolUseId);
  if (!state.toolOrder.includes(toolUseId)) {
    state.toolOrder.push(toolUseId);
  }
}

export function registerToolMessage(_state: CachedMCState, _groupIds: string[]): void {
  // Real impl groups tool results by user-message boundary so the cache-edit
  // diff respects message ordering. Stub doesn't need to track groups
  // because getToolResultsToDelete returns []; nothing is ever evicted.
}

export function getToolResultsToDelete(_state: CachedMCState): string[] {
  return [];
}

export function createCacheEditsBlock(
  _state: CachedMCState,
  _toolIds: string[],
): CacheEditsBlock | null {
  return null;
}

export async function cachedMicrocompactPath(
  _messages: Message[],
  _querySource: unknown,
): Promise<{ messages: Message[]; pendingEdits: CacheEditsBlock | null }> {
  return { messages: _messages, pendingEdits: null };
}
