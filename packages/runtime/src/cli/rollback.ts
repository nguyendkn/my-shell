// Stub: cli rollback. Disabled in external builds.
export interface RollbackOptions {
  list?: boolean;
  dryRun?: boolean;
  safe?: boolean;
}

export async function rollback(_target?: string, _options?: RollbackOptions): Promise<void> {
  throw new Error("cli rollback is not available in this build");
}
