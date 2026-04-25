export function summarizeContextCollapseState() {
  return null;
}

export function getContextCollapsePreview() {
  return [];
}

// Project the current context-collapse view over a message array. The
// restored runtime never collapses anything, so this is a pass-through.
export function projectView<T>(messages: T): T {
  return messages;
}
