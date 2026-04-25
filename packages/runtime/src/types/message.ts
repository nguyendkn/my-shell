// Strongly-typed runtime message tree.
//
// Background
// ----------
// Earlier versions used `[key: string]: unknown` index signatures and
// `content?: unknown` for AssistantMessage.message. That allowed everything
// to compile but pushed the burden of narrowing onto every consumer, which
// in practice meant they accessed `.content[i].type`, `.text`, `.input`,
// `.tool_use_id`, etc. without type guards. The result was hundreds of
// TS2339 errors at the consumer sites, plus a quiet loss of any actual
// type safety on the most important data structure in the codebase.
//
// Approach
// --------
// The runtime mirrors the Anthropic SDK's Beta message shapes (which
// already use proper discriminated unions for content blocks) and adds
// the runtime-only fields we layer on top (uuid/parentUuid, attachments,
// hook attachments, etc.). Where the runtime extends a block (e.g.
// caller fields on tool_use blocks) we widen the SDK type rather than
// re-declaring it.

import type { APIError } from "@anthropic-ai/sdk";
import type {
  BetaContentBlock,
  BetaContextManagementResponse,
  BetaMessage,
  BetaUsage,
} from "@anthropic-ai/sdk/resources/beta/messages/messages.mjs";
import type { ContentBlockParam } from "@anthropic-ai/sdk/resources/messages.mjs";
import type { HookEvent, SDKAssistantMessageError } from "src/entrypoints/agentSdkTypes.js";
import type { Attachment, HookAttachment } from "src/utils/attachments.js";

// Runtime-extended content block. Tool use blocks may carry an optional
// `caller` annotation (used by AgentTool / server-tool plumbing) on top
// of the SDK shape.
export type RuntimeContentBlock = BetaContentBlock & {
  caller?: unknown;
};

export type RuntimeContentBlockParam = ContentBlockParam;

export type MessageOrigin = {
  kind?: string;
  [key: string]: unknown;
};

// Mirrors Node's crypto.randomUUID() return type so functions like
// deriveUUID(parent: UUID) accept message.uuid without a cast.
export type UUID = `${string}-${string}-${string}-${string}-${string}`;

export type MessageBase = {
  uuid?: UUID;
  parentUuid?: UUID;
  timestamp?: string;
  createdAt?: string;
  isMeta?: boolean;
  isVirtual?: boolean;
  isCompactSummary?: boolean;
  isVisibleInTranscriptOnly?: boolean;
  toolUseResult?: unknown;
  origin?: MessageOrigin;
  imagePasteIds?: number[];
  mcpMeta?: Record<string, unknown>;
  // [key: string]: unknown intentionally absent — narrow union members
  // declare their own additive fields instead.
};

// Generic over the attachment payload so isHookAttachmentMessage can
// narrow to AttachmentMessage<HookAttachment>, etc.
export type AttachmentMessage<A extends Attachment = Attachment> = MessageBase & {
  type: "attachment";
  attachment: A;
  path?: string;
};

export type UserMessageContent = string | RuntimeContentBlockParam[];

export type UserMessage = MessageBase & {
  type: "user";
  message: {
    role?: "user";
    content: UserMessageContent;
    [key: string]: unknown;
  };
  parent_tool_use_id?: string;
  isSynthetic?: boolean;
  priority?: "now" | "next" | "later";
  session_id?: string;
  sourceToolUseID?: string;
  sourceToolAssistantUUID?: UUID;
  permissionMode?: string;
  // Snapshot of the active plan file content captured on this user message
  // when ExitPlanMode (or similar) committed the plan. utils/plans reads it
  // back when reconstructing the plan view from a transcript.
  planContent?: string;
  summarizeMetadata?: {
    messagesSummarized: number;
    userContext?: string;
    direction?: PartialCompactDirection;
  };
};

// Mirrors @anthropic-ai/sdk BetaMessage but allows the runtime's looser
// invariants during construction (some synthetic flows omit id/usage
// before they're filled in elsewhere). All required fields stay required;
// optional fields stay optional.
export type AssistantMessageInner = {
  id: string;
  container?: BetaMessage["container"];
  content: RuntimeContentBlock[];
  context_management?: BetaContextManagementResponse | null;
  model: string;
  role: "assistant";
  stop_reason: BetaMessage["stop_reason"];
  stop_sequence?: BetaMessage["stop_sequence"];
  type: "message";
  usage: BetaUsage;
};

export type AssistantMessage = MessageBase & {
  type: "assistant";
  message: AssistantMessageInner;
  requestId?: string;
  // The structured APIError from the SDK, OR a synthetic error code string
  // (e.g. "max_output_tokens") emitted by claude.ts when the upstream API
  // didn't surface a proper error object but a recovery flow needs to fire.
  // Consumers typically check for known string codes via === comparisons or
  // narrow with `instanceof APIError` for the structured shape.
  apiError?: APIError | string;
  error?: SDKAssistantMessageError;
  errorDetails?: string;
  isApiErrorMessage?: boolean;
  advisorModel?: string;
  costUSD?: number;
  durationMs?: number;
  // Internal-only research metadata captured from content_block_delta when
  // process.env.USER_TYPE === 'ant'. Opaque payload — not on the wire for
  // external builds, so kept loosely typed.
  research?: unknown;
};

export type ProgressMessage<T = unknown> = MessageBase & {
  type: "progress";
  progress?: T;
  data?: T;
  toolUseID?: string;
  parentToolUseID?: string;
};

export type SystemMessageLevel = "info" | "warning" | "error" | string;

export type SystemMessage = MessageBase & {
  type: "system";
  subtype?: string;
  level?: SystemMessageLevel;
  message?: string;
  data?: unknown;
  toolUseID?: string;
  content?: string;
  compactMetadata?: CompactMetadata;
  hookLabel?: string;
  hookEvent?: string;
  // Verb the UI uses for the toast text. Currently used by the
  // memory-saved subtype ("Saved" by default; autoDream switches to
  // "Improved").
  verb?: string;
};

export type SystemLocalCommandMessage = SystemMessage & {
  subtype: "local_command";
  content?: string;
  toolUseID?: string;
};

export type SystemBridgeStatusMessage = SystemMessage & {
  url?: string;
  upgradeNudge?: string;
};
export type SystemTurnDurationMessage = SystemMessage & {
  durationMs?: number;
  budgetTokens?: number;
  budgetLimit?: number;
  budgetNudges?: number;
  messageCount?: number;
};
export type SystemThinkingMessage = SystemMessage;
export type SystemMemorySavedMessage = SystemMessage & {
  writtenPaths?: string[];
  // Number of team-shared memories saved in this batch — surfaced by the
  // memory-saved UI when the TEAMMEM feature is on.
  teamCount?: number;
  // Verb the UI uses for the toast ("Saved" by default; autoDream uses
  // "Improved" so the message reads "Improved N memories").
  verb?: string;
};
export type SystemStopHookSummaryMessage = SystemMessage & {
  hookCount?: number;
  hookInfos?: StopHookInfo[];
  hookErrors?: string[];
  preventedContinuation?: boolean;
  stopReason?: string;
  hasOutput?: boolean;
  totalDurationMs?: number;
};
export type SystemInformationalMessage = SystemMessage;
export type SystemCompactBoundaryMessage = SystemMessage;
export type SystemMicrocompactBoundaryMessage = SystemMessage & {
  microcompactMetadata?: CompactMetadata;
};
export type SystemPermissionRetryMessage = SystemMessage & {
  commands?: string[];
  preventContinuation?: boolean;
};
export type SystemScheduledTaskFireMessage = SystemMessage;
export type SystemAwaySummaryMessage = SystemMessage;
export type SystemAgentsKilledMessage = SystemMessage;
export type SystemApiMetricsMessage = SystemMessage & {
  ttftMs?: number;
  otps?: number;
  isP50?: boolean;
  hookDurationMs?: number;
  turnDurationMs?: number;
  toolDurationMs?: number;
  classifierDurationMs?: number;
  toolCount?: number;
  hookCount?: number;
  classifierCount?: number;
  configWriteCount?: number;
};
export type SystemAPIErrorMessage = SystemMessage & {
  error?: APIError | string;
  cause?: Error;
  retryInMs?: number;
  retryAttempt?: number;
  maxRetries?: number;
};
// File snapshot system message — persisted by the remote-session
// flushOnDateChange-equivalent path so plan/todos files survive across
// transcripts. Each entry carries the slot key (plan/todos/etc), source
// path, and the file content at snapshot time.
export type SystemFileSnapshotMessage = SystemMessage & {
  snapshotFiles?: Array<{ key: string; path: string; content: string }>;
};

export type HookResultMessage = MessageBase & {
  type: "hook_result";
  hookEvent?: HookEvent;
  toolUseID?: string;
};

export type ToolUseSummaryMessage = MessageBase & {
  type: "tool_use_summary";
  summary?: string;
  precedingToolUseIds?: string[];
};

export type TombstoneMessage = MessageBase & {
  type: "tombstone";
  // The original assistant message that should be removed from the transcript.
  // Used for orphaned-message cleanup after streaming fallback.
  message?: AssistantMessage;
};

// Anthropic's RawMessageStreamEvent shapes (message_start, message_delta,
// content_block_start/delta/stop, etc.) that the runtime forwards through
// the query stream. We import the SDK union directly so consumers narrow
// on .type and get full inference for .message / .delta / .index /
// .content_block per variant.
import type { BetaRawMessageStreamEvent } from "@anthropic-ai/sdk/resources/beta/messages/messages.mjs";

export type StreamEventInner = BetaRawMessageStreamEvent;

export type StreamEvent = MessageBase & {
  type: "stream_event";
  event: StreamEventInner;
  // Time-to-first-token in milliseconds. Set on the message_start event when
  // the runtime captures TTFT from the upstream API stream.
  ttftMs?: number;
};

export type RequestStartEvent = MessageBase & {
  type: "stream_request_start";
  [key: string]: unknown;
};

export type StopHookInfo = {
  // Wall-clock duration of an individual stop-hook invocation (ms).
  durationMs?: number;
  // Optional fields used by various stop-hook flows; kept open for forward
  // compatibility without resorting to `unknown`-by-default semantics.
  hookName?: string;
  command?: string;
  exitCode?: number;
  output?: string;
  error?: string;
  // Stop-hook variants emitted by job classifier hooks carry the prompt
  // text used to invoke the hook (so the post-stop UI can replay it).
  promptText?: string;
};

// Metadata persisted alongside a compact-boundary system message. The
// preservedSegment captures the head/tail/anchor UUIDs of the live segment
// that survives the boundary, used by applyPreservedSegmentRelinks during
// resume to splice messages back into a valid parent chain.
export type CompactPreservedSegment = {
  // First UUID of the preserved segment (newest direction of the walk).
  tailUuid: UUID;
  // Last UUID of the preserved segment (oldest, where the walk terminates).
  headUuid: UUID;
  // The anchor UUID the head should re-parent to after the splice (the
  // synthetic compact summary message that replaces the dropped history).
  anchorUuid: UUID;
};

export type CompactMetadata = {
  preservedSegment?: CompactPreservedSegment;
  // Whether the compact was user-triggered (manual /compact) or fired
  // automatically by the autocompact gate.
  trigger?: "manual" | "auto";
  // Token count of the message tail before the compact ran. Used by
  // analytics + the post-compact UI to estimate savings.
  preTokens?: number;
  // Tool names discovered before the compact ran — carried across the
  // compact boundary so the post-compact discovery counter doesn't reset.
  preCompactDiscoveredTools?: readonly string[];
  // Optional user-supplied free-text context to bias the compact summary.
  userContext?: string;
  // Number of source messages folded into the compact summary.
  messagesSummarized?: number;
  // Microcompact-only: estimated token savings + the tool/attachment IDs
  // whose payloads were cleared. Surfaced in the post-compact UI.
  tokensSaved?: number;
  compactedToolIds?: readonly string[];
  clearedAttachmentUUIDs?: readonly string[];
};

export type PartialCompactDirection = "older" | "newer" | "both" | string;

export type CollapsedReadSearchGroup = {
  type: "collapsed_read_search";
  searchCount: number;
  readCount: number;
  listCount: number;
  replCount?: number;
  memorySearchCount?: number;
  memoryReadCount?: number;
  memoryWriteCount?: number;
  teamMemorySearchCount?: number;
  teamMemoryReadCount?: number;
  teamMemoryWriteCount?: number;
  mcpCallCount?: number;
  mcpServerNames?: string[];
  bashCount?: number;
  gitOpBashCount?: number;
  commits?: unknown[];
  pushes?: unknown[];
  branches?: unknown[];
  readFilePaths?: string[];
  searchArgs?: unknown;
  latestDisplayHint?: unknown;
  // Inputs preserved from the source group: assistant tool_use messages,
  // their tool_result user messages, and any nested grouped_tool_use that
  // was already collapsed on the way in.
  messages?: CollapsibleMessage[];
  // First message of the group used as the display anchor (timestamp/uuid).
  // Almost always an AssistantMessage, but may be a GroupedToolUseMessage
  // when nested groups are absorbed — getDisplayMessageFromCollapsed
  // unwraps to the inner displayMessage in that case.
  displayMessage?: CollapsibleMessage;
  hookCount?: number;
  hookTotalMs?: number;
  hookInfos?: StopHookInfo[];
  prs?: unknown[];
  relevantMemories?: unknown[];
  uuid?: UUID;
  timestamp?: string;
  phase?: string;
  [key: string]: unknown;
};

export type GroupedToolUseMessage = MessageBase & {
  type: "grouped_tool_use";
  group?: CollapsedReadSearchGroup;
  // Always assistant messages (each carrying a single tool_use block).
  // Constructed by applyGrouping in groupToolUses.ts from a homogeneous
  // tool_use group; consumers index into msg.messages[i].message.content[0].
  messages?: AssistantMessage[];
  results?: UserMessage[];
  toolName?: string;
  displayMessage?: AssistantMessage;
  messageId?: string;
};

// The actual message variants that may be collapsed into a
// CollapsedReadSearchGroup. Narrows from RenderableMessage to the three
// shapes that carry tool_use / tool_result content (the inputs to
// collapseReadSearch.ts) so consumers can access .message and .messages
// without re-narrowing on every line.
export type CollapsibleMessage = AssistantMessage | UserMessage | GroupedToolUseMessage;

// Generic over the first content block's type so callers can express
// invariants like NormalizedAssistantMessage<BetaToolUseBlock> after they've
// narrowed (typically via a check on content[0].type === "tool_use"). The
// generic parameter is intentionally informational — there is no compile-time
// validation it matches the runtime content shape; narrowing is the caller's
// responsibility (e.g., via getToolUseInfo).
export type NormalizedAssistantMessage<_Block extends RuntimeContentBlock = RuntimeContentBlock> =
  AssistantMessage;
export type NormalizedUserMessage = UserMessage;
export type NormalizedMessage =
  | NormalizedAssistantMessage
  | NormalizedUserMessage
  | ProgressMessage
  | SystemMessage
  | AttachmentMessage;

// RenderableMessage = anything the transcript may render. Adds the
// CollapsedReadSearchGroup pseudo-message produced by collapseReadSearch.ts
// (it carries a "type": "collapsed_read_search" discriminant but is not part
// of the persisted Message union).
export type RenderableMessage = Message | CollapsedReadSearchGroup;

export type Message =
  | UserMessage
  | AssistantMessage
  | ProgressMessage
  | SystemMessage
  | AttachmentMessage
  | HookResultMessage
  | ToolUseSummaryMessage
  | TombstoneMessage
  | GroupedToolUseMessage;
