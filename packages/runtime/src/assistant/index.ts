function readAssistantModeFlag(): boolean {
  return (
    process.env.CLAUDE_CODE_ASSISTANT_MODE === "1" ||
    process.env.CLAUDE_CODE_ASSISTANT_MODE === "true"
  );
}

export function isAssistantMode(): boolean {
  return readAssistantModeFlag();
}

export function isAssistantModeEnabled(): boolean {
  return readAssistantModeFlag();
}

// Stub: in external builds, the assistant team feature is unavailable.
// These exports keep the type system aware of the API surface that the
// internal (KAIROS) build provides; at runtime they are inert no-ops.

let _assistantForced = false;

export function markAssistantForced(): void {
  _assistantForced = true;
}

export function isAssistantForced(): boolean {
  return _assistantForced;
}

// Mirrors the shape of AppState["teamContext"] so the stub can be assigned
// to the same slot in the initial app state without a separate cast.
export interface AssistantTeamContext {
  teamName: string;
  teamFilePath: string;
  leadAgentId: string;
  selfAgentId?: string;
  selfAgentName?: string;
  isLeader?: boolean;
  selfAgentColor?: string;
  teammates: {
    [teammateId: string]: {
      name: string;
      agentType?: string;
      color?: string;
      tmuxSessionName: string;
      tmuxPaneId: string;
      cwd: string;
      worktreePath?: string;
      spawnedAt: number;
    };
  };
}

export async function initializeAssistantTeam(): Promise<AssistantTeamContext> {
  return {
    teamName: "",
    teamFilePath: "",
    leadAgentId: "",
    teammates: {},
  };
}

export function getAssistantSystemPromptAddendum(): string {
  return "";
}

export function getAssistantActivationPath(): string | undefined {
  return undefined;
}
