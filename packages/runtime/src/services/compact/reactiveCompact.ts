import type { CompactionResult } from "./compact.js";

// Reactive compact — feature-gated 413/media-error recovery path. Stubbed off
// in the restored runtime: every gate returns false so query.ts falls through
// to its non-reactive recovery code, and tryReactiveCompact is a no-op that
// resolves to undefined so callers skip the post-compact replay.

export async function runReactiveCompact<T>(messages: T): Promise<T> {
  return messages;
}

// Whether the reactive-compact experiment is on for this session. The
// restored runtime always reports off, so the proactive autocompact path
// stays in control of the token-budget recovery flow.
export function isReactiveCompactEnabled(): boolean {
  return false;
}

// Whether a yielded message should be withheld from the SDK because it's a
// "prompt too long" 413 that reactive compact would handle. False here so
// the message flows through normally.
export function isWithheldPromptTooLong(_msg: unknown): boolean {
  return false;
}

// Whether a yielded message is a media-size 413 that reactive compact would
// otherwise eat. Always false in the restored runtime.
export function isWithheldMediaSizeError(_msg: unknown): boolean {
  return false;
}

// Try the reactive-compact recovery flow. Returns undefined when no compact
// happened (the only outcome in the stub) so query.ts skips the replay
// branch and surfaces the underlying error.
export async function tryReactiveCompact(_args: {
  hasAttempted: boolean;
  querySource: string;
  aborted: boolean;
  messages: unknown;
  cacheSafeParams: unknown;
}): Promise<CompactionResult | undefined> {
  return undefined;
}

// Whether the autocompact gate has been displaced by reactive-only mode.
// The restored runtime always returns false so the standard /compact flow
// drives the recovery instead.
export function isReactiveOnlyMode(): boolean {
  return false;
}

// Reactive entry called from the /compact slash command when the user has
// hit a 413 mid-prompt. The stub returns undefined so the caller falls
// through to the standard compact path.
// Outcome shape returned by reactiveCompactOnPromptTooLong. Flattened
// (vs. discriminated on `ok`) because the runtime tsconfig has strict:false
// — branches don't narrow the optional fields off the unselected variant.
export type ReactiveCompactOutcome = {
  ok: boolean;
  reason?: "too_few_groups" | "aborted" | "exhausted" | "error" | "media_unstrippable";
  result?: CompactionResult;
};

export async function reactiveCompactOnPromptTooLong(
  _messages?: unknown,
  _cacheSafeParams?: unknown,
  _opts?: { customInstructions?: string; trigger?: "manual" | "auto" },
): Promise<ReactiveCompactOutcome> {
  return { ok: false, reason: "error" };
}
