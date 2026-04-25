// Stub: workflow command factory. No commands surface in external builds.
export function createWorkflowCommand(): null {
  return null;
}

export async function getWorkflowCommands(_cwd?: string): Promise<readonly { name?: string }[]> {
  return [];
}
