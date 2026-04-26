import { buildBrowserProcessTitle } from "./process-title.js";
import type {
  BrowserHarnessGoal,
  BrowserHarnessTeamPlan,
  BrowserProfileDescriptor,
} from "./types.js";

export function createBrowserHarnessTeamPlan({
  taskId,
  goal,
  profiles,
}: {
  taskId: string;
  goal: BrowserHarnessGoal;
  profiles: BrowserProfileDescriptor[];
}): BrowserHarnessTeamPlan {
  const leadAgentId = `lead-${taskId.slice(-8)}`;
  const workers = profiles.map((profile, index) => {
    const agentId = `browser-${String(index + 1).padStart(2, "0")}`;

    return {
      agentId,
      agentName: `Hermes browser agent ${index + 1}`,
      role: "worker" as const,
      profileId: profile.id,
      profileName: profile.name,
      providerId: profile.providerId,
      profilePath: profile.profilePath,
      mode: goal.mode,
      goal: goal.goal,
      startPoint: goal.startPoint,
      endpoint: goal.endpoint,
      expectedProcessTitle: buildBrowserProcessTitle({
        taskId,
        agentId,
        profileName: profile.name,
        mode: goal.mode,
      }),
    };
  });

  return {
    taskId,
    leadAgentId,
    leadName: "Hermes lead agent",
    mode: goal.mode,
    goal: goal.goal,
    startPoint: goal.startPoint,
    endpoint: goal.endpoint,
    workers,
  };
}
