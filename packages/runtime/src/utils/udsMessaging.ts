export async function sendUdsMessage(): Promise<void> {}

// UDS messaging server. Stubbed off — the bootstrap path calls
// startUdsMessaging when remote-control or external orchestration is
// expected; the restored runtime never starts the server.
export async function startUdsMessaging(
  _socketPath: string,
  _opts?: { isExplicit?: boolean },
): Promise<void> {
  return;
}

// Default UDS socket path used when no explicit path is configured.
// Returns empty so callers fall through to "no socket configured" branches.
export function getDefaultUdsSocketPath(): string {
  return "";
}
