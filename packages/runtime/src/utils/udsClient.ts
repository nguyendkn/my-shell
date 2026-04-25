// Stub: Unix domain socket client. Disabled in external builds.

export async function createUdsClient(): Promise<null> {
  return null;
}

export async function sendToUdsSocket(_target: string, _message: string): Promise<void> {
  throw new Error("UDS client is not available in this build");
}

// Used by conversationRecovery to enumerate other live REPL processes that
// might own a session. The restored runtime has no UDS bridge; return [].
export interface LiveSessionInfo {
  readonly kind?: string;
  readonly sessionId?: string;
}
export async function listAllLiveSessions(): Promise<readonly LiveSessionInfo[]> {
  return [];
}
