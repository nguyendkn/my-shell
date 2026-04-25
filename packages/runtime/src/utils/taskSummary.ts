// Task summary — feature-gated periodic summarization fired during long
// agent runs so `claude ps` can show what each background session is
// working on. Stubbed off: shouldGenerate returns false so maybeGenerate is
// never called via query.ts, and maybeGenerate itself is a no-op resolver
// for any direct caller.

export function summarizeTask() {
  return "";
}

export function shouldGenerateTaskSummary(): boolean {
  return false;
}

export async function maybeGenerateTaskSummary(_args: {
  systemPrompt: unknown;
  userContext: unknown;
  systemContext: unknown;
  toolUseContext: unknown;
  forkContextMessages: unknown;
}): Promise<void> {
  return;
}
