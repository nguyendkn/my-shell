// Remote skill state — feature-gated by EXPERIMENTAL_SKILL_SEARCH. Stubbed
// off in the restored runtime so SkillTool's call sites bail before reaching
// the (null) state.

export type DiscoveredRemoteSkill = {
  slug: string;
  url: string;
  description?: string;
};

export function getRemoteSkillState() {
  return null;
}

// Look up a discovered remote skill by slug. The restored runtime never
// discovers any, so this always returns undefined.
export function getDiscoveredRemoteSkill(_slug: string): DiscoveredRemoteSkill | undefined {
  return undefined;
}

// Strip the canonical "remote:" / similar prefix from a command name and
// return the bare slug. The runtime gate above this never fires, so the
// stub returns the input unchanged.
export function stripCanonicalPrefix(commandName: string): string {
  return commandName;
}
