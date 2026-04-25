export async function localSkillSearch() {
  return [];
}

// Drop any cached skill index so the next search rebuilds. Stubbed off —
// the local search returns [] regardless of cache state.
export function clearSkillIndexCache(): void {}
