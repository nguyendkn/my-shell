// Stub: job classifier. No-op in external builds.
export async function runClassifier(): Promise<null> {
  return null;
}

export async function classifyAndWriteState(
  _jobDir?: string,
  _assistantMessages?: readonly unknown[],
): Promise<void> {}
