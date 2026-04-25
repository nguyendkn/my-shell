// Stub for missing post-commit attribution module.
// Original ant-only feature; runtime fallback is no-op.

export interface PostCommitAttributionInput {
  readonly cwd: string;
  readonly commitSha?: string;
}

export async function recordCommitAttribution(_input: PostCommitAttributionInput): Promise<void> {
  // no-op
}

export async function maybeRecordCommitAttribution(
  _input: PostCommitAttributionInput,
): Promise<void> {
  // no-op
}

export async function installPrepareCommitMsgHook(
  _worktreePath: string,
  _hooksDir?: string,
): Promise<void> {
  // no-op
}

export default {
  recordCommitAttribution,
  maybeRecordCommitAttribution,
  installPrepareCommitMsgHook,
};
