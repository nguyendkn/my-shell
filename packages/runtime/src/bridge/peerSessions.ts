// Stub: peer-session bridge. Returns inert defaults in external builds.

export function listPeerSessions(): readonly { id?: string }[] {
  return [];
}

export interface PostInterClaudeResult {
  readonly ok: boolean;
  readonly error?: string;
}

export async function postInterClaudeMessage(
  _target: string,
  _message: string,
): Promise<PostInterClaudeResult> {
  return { ok: false, error: "peer sessions are not available in this build" };
}
