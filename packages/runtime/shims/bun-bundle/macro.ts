// Build-time macro for bun build --compile.
// This file is executed by Bun's bundler, NOT at runtime.
// process.env here refers to the BUILD environment.

/**
 * Comma-separated list of enabled feature flags at build time.
 * Set via:  BUN_BUILD_FEATURES=BRIDGE_MODE,TEMPLATES bun build ...
 * Defaults: the same set used in ENABLED_FEATURES of index.ts.
 */
const DEFAULT_FEATURES = [
  "AGENT_TRIGGERS",
  "AGENT_TRIGGERS_REMOTE",
  "BRIDGE_MODE",
  "DUMP_SYSTEM_PROMPT",
  "KAIROS_BRIEF",
  "TEMPLATES",
  "TRANSCRIPT_CLASSIFIER",
];

export function feature(flag: string): boolean {
  const raw = process.env.BUN_BUILD_FEATURES;
  const enabled = raw
    ? new Set(
        raw
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      )
    : new Set(DEFAULT_FEATURES);
  return enabled.has(flag);
}
