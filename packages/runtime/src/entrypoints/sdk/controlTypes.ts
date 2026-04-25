// Strongly-typed SDK control protocol types derived from the Zod schemas
// in controlSchemas.ts. Using z.infer keeps the runtime schema and the
// compile-time type in lock-step (single source of truth).

import type { z } from "zod/v4";
import type * as S from "./controlSchemas.js";

export type SDKControlInitializeRequest = z.infer<
  ReturnType<typeof S.SDKControlInitializeRequestSchema>
>;

export type SDKControlInitializeResponse = z.infer<
  ReturnType<typeof S.SDKControlInitializeResponseSchema>
>;

export type SDKControlInterruptRequest = z.infer<
  ReturnType<typeof S.SDKControlInterruptRequestSchema>
>;

export type SDKControlPermissionRequest = z.infer<
  ReturnType<typeof S.SDKControlPermissionRequestSchema>
>;

export type SDKControlSetPermissionModeRequest = z.infer<
  ReturnType<typeof S.SDKControlSetPermissionModeRequestSchema>
>;

export type SDKControlSetModelRequest = z.infer<
  ReturnType<typeof S.SDKControlSetModelRequestSchema>
>;

export type SDKControlSetMaxThinkingTokensRequest = z.infer<
  ReturnType<typeof S.SDKControlSetMaxThinkingTokensRequestSchema>
>;

export type SDKControlMcpStatusRequest = z.infer<
  ReturnType<typeof S.SDKControlMcpStatusRequestSchema>
>;

export type SDKControlMcpStatusResponse = z.infer<
  ReturnType<typeof S.SDKControlMcpStatusResponseSchema>
>;

export type SDKControlGetContextUsageRequest = z.infer<
  ReturnType<typeof S.SDKControlGetContextUsageRequestSchema>
>;

export type SDKControlGetContextUsageResponse = z.infer<
  ReturnType<typeof S.SDKControlGetContextUsageResponseSchema>
>;

export type SDKControlRewindFilesRequest = z.infer<
  ReturnType<typeof S.SDKControlRewindFilesRequestSchema>
>;

export type SDKControlRewindFilesResponse = z.infer<
  ReturnType<typeof S.SDKControlRewindFilesResponseSchema>
>;

export type SDKControlCancelAsyncMessageRequest = z.infer<
  ReturnType<typeof S.SDKControlCancelAsyncMessageRequestSchema>
>;

export type SDKControlCancelAsyncMessageResponse = z.infer<
  ReturnType<typeof S.SDKControlCancelAsyncMessageResponseSchema>
>;

export type SDKControlSeedReadStateRequest = z.infer<
  ReturnType<typeof S.SDKControlSeedReadStateRequestSchema>
>;

export type SDKHookCallbackRequest = z.infer<ReturnType<typeof S.SDKHookCallbackRequestSchema>>;

export type SDKControlMcpMessageRequest = z.infer<
  ReturnType<typeof S.SDKControlMcpMessageRequestSchema>
>;

export type SDKControlMcpSetServersRequest = z.infer<
  ReturnType<typeof S.SDKControlMcpSetServersRequestSchema>
>;

export type SDKControlMcpSetServersResponse = z.infer<
  ReturnType<typeof S.SDKControlMcpSetServersResponseSchema>
>;

export type SDKControlReloadPluginsRequest = z.infer<
  ReturnType<typeof S.SDKControlReloadPluginsRequestSchema>
>;

export type SDKControlReloadPluginsResponse = z.infer<
  ReturnType<typeof S.SDKControlReloadPluginsResponseSchema>
>;

export type SDKControlMcpReconnectRequest = z.infer<
  ReturnType<typeof S.SDKControlMcpReconnectRequestSchema>
>;

export type SDKControlMcpToggleRequest = z.infer<
  ReturnType<typeof S.SDKControlMcpToggleRequestSchema>
>;

export type SDKControlStopTaskRequest = z.infer<
  ReturnType<typeof S.SDKControlStopTaskRequestSchema>
>;

export type SDKControlApplyFlagSettingsRequest = z.infer<
  ReturnType<typeof S.SDKControlApplyFlagSettingsRequestSchema>
>;

export type SDKControlGetSettingsRequest = z.infer<
  ReturnType<typeof S.SDKControlGetSettingsRequestSchema>
>;

export type SDKControlGetSettingsResponse = z.infer<
  ReturnType<typeof S.SDKControlGetSettingsResponseSchema>
>;

export type SDKControlElicitationRequest = z.infer<
  ReturnType<typeof S.SDKControlElicitationRequestSchema>
>;

export type SDKControlElicitationResponse = z.infer<
  ReturnType<typeof S.SDKControlElicitationResponseSchema>
>;

export type SDKControlRequestInner = z.infer<ReturnType<typeof S.SDKControlRequestInnerSchema>>;

export type SDKControlRequest = z.infer<ReturnType<typeof S.SDKControlRequestSchema>>;

export type ControlSuccessResponse = z.infer<ReturnType<typeof S.ControlResponseSchema>>;
export type ControlErrorResponse = z.infer<ReturnType<typeof S.ControlErrorResponseSchema>>;

export type SDKControlResponse = z.infer<ReturnType<typeof S.SDKControlResponseSchema>>;

export type SDKControlCancelRequest = z.infer<ReturnType<typeof S.SDKControlCancelRequestSchema>>;

export type SDKKeepAliveMessage = z.infer<ReturnType<typeof S.SDKKeepAliveMessageSchema>>;

export type SDKUpdateEnvironmentVariablesMessage = z.infer<
  ReturnType<typeof S.SDKUpdateEnvironmentVariablesMessageSchema>
>;

export type StdoutMessage = z.infer<ReturnType<typeof S.StdoutMessageSchema>>;
export type StdinMessage = z.infer<ReturnType<typeof S.StdinMessageSchema>>;

// SDKPartialAssistantMessage is an internal streaming wrapper used by the
// runtime's structured IO. The wire schema (coreSchemas.ts:
// SDKPartialAssistantMessageSchema) wraps a RawMessageStreamEvent under the
// 'stream_event' discriminator alongside session/uuid bookkeeping. The
// schema declares event with z.unknown() (the SDK type isn't reachable at
// schema-build time), so we expose a typed shim here that matches the
// runtime invariant: event is always a BetaRawMessageStreamEvent at the
// boundaries that hand SDKPartialAssistantMessage to ccrClient. The cross-
// cast happens in writeEvent which receives StdoutMessage (event: unknown)
// and pushes into streamEventBuffer typed as SDKPartialAssistantMessage[].
export type SDKPartialAssistantMessage = {
  type: "stream_event";
  event: import("@anthropic-ai/sdk/resources/beta/messages/messages.mjs").BetaRawMessageStreamEvent;
  parent_tool_use_id: string | null;
  uuid: string;
  session_id: string;
};
