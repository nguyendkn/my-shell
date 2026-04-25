// Check whether the given message is a snip boundary marker. The restored
// runtime never injects snip boundaries, so this always returns false; the
// _msg parameter exists so the signature matches the call sites in
// QueryEngine and any downstream snip-aware code paths.
export function isSnipBoundaryMessage(_msg?: unknown): boolean {
  return false;
}

export function projectSnippedMessages<T>(messages: T): T {
  return messages;
}

// Project the view of messages after snipping has been applied. The restored
// runtime has snip disabled (see snipCompact.isSnipRuntimeEnabled), so this
// is a no-op pass-through that preserves the input array as-is.
export function projectSnippedView<T>(messages: T): T {
  return messages;
}
