export type AssistantSession = {
  readonly id: string;
  readonly title?: string;
  readonly cwd?: string;
  readonly createdAt?: number;
  readonly updatedAt?: number;
};

export async function discoverAssistantSessions(): Promise<readonly AssistantSession[]> {
  return [];
}
