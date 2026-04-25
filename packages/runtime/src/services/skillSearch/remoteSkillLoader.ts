// Remote skill loader — feature-gated. Stubbed off; the call site in
// SkillTool.executeRemoteSkill won't reach this without
// isSkillSearchEnabled() === true.

export type RemoteSkillLoadResult = {
  cacheHit: boolean;
  latencyMs: number;
  skillPath: string;
  content: string;
  fileCount: number;
  totalBytes: number;
  fetchMethod: string;
};

export async function loadRemoteSkill(_slug: string, _url: string): Promise<RemoteSkillLoadResult> {
  return {
    cacheHit: false,
    latencyMs: 0,
    skillPath: "",
    content: "",
    fileCount: 0,
    totalBytes: 0,
    fetchMethod: "stub",
  };
}
