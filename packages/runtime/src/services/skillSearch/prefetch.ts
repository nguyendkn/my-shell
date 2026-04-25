// Skill discovery prefetch — feature-gated background lookup that races
// against tool execution. Stubbed off in the restored runtime: the prefetch
// never starts, and collectSkillDiscoveryPrefetch returns an empty list so
// the caller in query.ts iterates zero attachments.

export async function prefetchSkillSearch() {}

// Sentinel handle returned by startSkillDiscoveryPrefetch. Real impl returns
// a Promise of skill matches; the stub returns null which collect... handles.
export type SkillDiscoveryHandle = null;

export function startSkillDiscoveryPrefetch(
  _userInput: string | null,
  _messages: unknown,
  _toolUseContext: unknown,
): SkillDiscoveryHandle {
  return null;
}

// Returns the attachments to inject into the tool result stream after the
// turn's writes complete. Always empty in the restored runtime.
export async function collectSkillDiscoveryPrefetch(
  _handle: SkillDiscoveryHandle,
): Promise<never[]> {
  return [];
}

// Turn-zero (initial user message) skill discovery. Real impl returns
// matching skill attachments to inject before tool execution begins; the
// restored runtime returns an empty array.
export async function getTurnZeroSkillDiscovery(
  _userInput: string,
  _messages?: unknown,
  _toolUseContext?: unknown,
): Promise<never[]> {
  return [];
}
