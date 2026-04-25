import { buildTool } from "../../Tool.js";

// `as never` on the schema fields below trips the buildTool generic
// constraint check; cast the def to the loose AnyToolDef-shaped surface
// so the inert tool stays exported. Re-typed as `{ name: string }` so
// callers reading `TungstenTool.name` (the tool registry key) keep their
// typed access.
export const TungstenTool = (buildTool as unknown as (def: unknown) => { name: string })({
  name: "tungsten",
  userFacingName() {
    return "Tungsten";
  },
  async description() {
    return (
      "Internal terminal-session bridge used by Anthropic builds. " +
      "This restored workspace keeps the tool registered so configs and " +
      "older transcripts remain readable, but the original backend is absent."
    );
  },
  async prompt() {
    return (
      "Tungsten is not executable in this restored workspace. " +
      "If the user needs terminal automation, use the standard Bash tool " +
      "or another available local tool instead."
    );
  },
  inputSchema: {
    parse(value: unknown) {
      return value;
    },
  } as never,
  outputSchema: {
    parse(value: unknown) {
      return value;
    },
  } as never,
  isEnabled() {
    return false;
  },
  isReadOnly() {
    return true;
  },
  isConcurrencySafe() {
    return true;
  },
  async call() {
    return {
      data: {
        ok: false,
        error:
          "Tungsten is unavailable in this restored workspace; use Bash or another local tool instead.",
      },
    };
  },
});

// Lifecycle hooks called by /clear caches; the restored runtime keeps them
// as inert no-ops so callers don't need feature gates.
export function clearSessionsWithTungstenUsage(): void {}
export function resetInitializationState(): void {}
