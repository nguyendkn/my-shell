// Stub: coordinator-mode worker agent. Disabled in external builds.
export const WORKER_AGENT = "worker";

import type { AgentDefinition } from "../tools/AgentTool/loadAgentsDir.js";

// Returns the registered coordinator-mode agent definitions. Empty in
// external builds — the COORDINATOR_MODE feature flag is off.
export function getCoordinatorAgents(): AgentDefinition[] {
  return [];
}
