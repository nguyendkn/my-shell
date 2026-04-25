// Stub: bootstrap macro setup. Provides MACRO global on import.
// MACRO is already declared in src/globals.d.ts; this module just seeds
// safe defaults at runtime so the rest of the codebase can read it.

export function ensureBootstrapMacro(): void {
  const g = globalThis as unknown as { MACRO?: unknown };
  if (g.MACRO) return;
  g.MACRO = {
    VERSION: "0.0.0-restored",
    BUILD_TIME: new Date().toISOString(),
    PACKAGE_URL: "",
    NATIVE_PACKAGE_URL: "",
    VERSION_CHANGELOG: "",
    ISSUES_EXPLAINER: "",
    FEEDBACK_CHANNEL: "",
  };
}
