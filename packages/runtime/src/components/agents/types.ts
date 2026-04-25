// Conventional directory layout for agent definitions on disk.
//
// project / user are full path templates retained for backwards compatibility.
// FOLDER_NAME is the per-project root that scoped settings (project, local,
// policy) anchor under; AGENTS_DIR is the leaf inside it that holds the
// agent markdown files. agentFileUtils joins these to build the full path
// per-SettingSource.
export const AGENT_PATHS = {
  project: ".claude/agents",
  user: "~/.claude/agents",
  FOLDER_NAME: ".claude",
  AGENTS_DIR: "agents",
} as const;

export type ModeState = string;
