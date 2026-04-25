// AUTO-GENERATED — DO NOT EDIT BY HAND
// Run: bun packages/runtime/scripts/generate-sdk-types.ts
//
// Generated from coreSchemas.ts: each XxxSchema becomes
//   export type Xxx = z.infer<ReturnType<typeof XxxSchema>>

import { z } from "zod";
import * as S from "./coreSchemas.js";

export type ModelUsage = z.infer<ReturnType<typeof S.ModelUsageSchema>>;
export type OutputFormatType = z.infer<ReturnType<typeof S.OutputFormatTypeSchema>>;
export type BaseOutputFormat = z.infer<ReturnType<typeof S.BaseOutputFormatSchema>>;
export type JsonSchemaOutputFormat = z.infer<ReturnType<typeof S.JsonSchemaOutputFormatSchema>>;
export type OutputFormat = z.infer<ReturnType<typeof S.OutputFormatSchema>>;
export type ApiKeySource = z.infer<ReturnType<typeof S.ApiKeySourceSchema>>;
export type ConfigScope = z.infer<ReturnType<typeof S.ConfigScopeSchema>>;
export type SdkBeta = z.infer<ReturnType<typeof S.SdkBetaSchema>>;
export type ThinkingAdaptive = z.infer<ReturnType<typeof S.ThinkingAdaptiveSchema>>;
export type ThinkingEnabled = z.infer<ReturnType<typeof S.ThinkingEnabledSchema>>;
export type ThinkingDisabled = z.infer<ReturnType<typeof S.ThinkingDisabledSchema>>;
export type ThinkingConfig = z.infer<ReturnType<typeof S.ThinkingConfigSchema>>;
export type McpStdioServerConfig = z.infer<ReturnType<typeof S.McpStdioServerConfigSchema>>;
export type McpSSEServerConfig = z.infer<ReturnType<typeof S.McpSSEServerConfigSchema>>;
export type McpHttpServerConfig = z.infer<ReturnType<typeof S.McpHttpServerConfigSchema>>;
export type McpSdkServerConfig = z.infer<ReturnType<typeof S.McpSdkServerConfigSchema>>;
export type McpServerConfigForProcessTransport = z.infer<
  ReturnType<typeof S.McpServerConfigForProcessTransportSchema>
>;
export type McpClaudeAIProxyServerConfig = z.infer<
  ReturnType<typeof S.McpClaudeAIProxyServerConfigSchema>
>;
export type McpServerStatusConfig = z.infer<ReturnType<typeof S.McpServerStatusConfigSchema>>;
export type McpServerStatus = z.infer<ReturnType<typeof S.McpServerStatusSchema>>;
export type McpSetServersResult = z.infer<ReturnType<typeof S.McpSetServersResultSchema>>;
export type PermissionUpdateDestination = z.infer<
  ReturnType<typeof S.PermissionUpdateDestinationSchema>
>;
export type PermissionBehavior = z.infer<ReturnType<typeof S.PermissionBehaviorSchema>>;
export type PermissionRuleValue = z.infer<ReturnType<typeof S.PermissionRuleValueSchema>>;
export type PermissionUpdate = z.infer<ReturnType<typeof S.PermissionUpdateSchema>>;
export type PermissionDecisionClassification = z.infer<
  ReturnType<typeof S.PermissionDecisionClassificationSchema>
>;
export type PermissionResult = z.infer<ReturnType<typeof S.PermissionResultSchema>>;
export type PermissionMode = z.infer<ReturnType<typeof S.PermissionModeSchema>>;
export type HookEvent = z.infer<ReturnType<typeof S.HookEventSchema>>;
export type BaseHookInput = z.infer<ReturnType<typeof S.BaseHookInputSchema>>;
export type PreToolUseHookInput = z.infer<ReturnType<typeof S.PreToolUseHookInputSchema>>;
export type PermissionRequestHookInput = z.infer<
  ReturnType<typeof S.PermissionRequestHookInputSchema>
>;
export type PostToolUseHookInput = z.infer<ReturnType<typeof S.PostToolUseHookInputSchema>>;
export type PostToolUseFailureHookInput = z.infer<
  ReturnType<typeof S.PostToolUseFailureHookInputSchema>
>;
export type PermissionDeniedHookInput = z.infer<
  ReturnType<typeof S.PermissionDeniedHookInputSchema>
>;
export type NotificationHookInput = z.infer<ReturnType<typeof S.NotificationHookInputSchema>>;
export type UserPromptSubmitHookInput = z.infer<
  ReturnType<typeof S.UserPromptSubmitHookInputSchema>
>;
export type SessionStartHookInput = z.infer<ReturnType<typeof S.SessionStartHookInputSchema>>;
export type SetupHookInput = z.infer<ReturnType<typeof S.SetupHookInputSchema>>;
export type StopHookInput = z.infer<ReturnType<typeof S.StopHookInputSchema>>;
export type StopFailureHookInput = z.infer<ReturnType<typeof S.StopFailureHookInputSchema>>;
export type SubagentStartHookInput = z.infer<ReturnType<typeof S.SubagentStartHookInputSchema>>;
export type SubagentStopHookInput = z.infer<ReturnType<typeof S.SubagentStopHookInputSchema>>;
export type PreCompactHookInput = z.infer<ReturnType<typeof S.PreCompactHookInputSchema>>;
export type PostCompactHookInput = z.infer<ReturnType<typeof S.PostCompactHookInputSchema>>;
export type TeammateIdleHookInput = z.infer<ReturnType<typeof S.TeammateIdleHookInputSchema>>;
export type TaskCreatedHookInput = z.infer<ReturnType<typeof S.TaskCreatedHookInputSchema>>;
export type TaskCompletedHookInput = z.infer<ReturnType<typeof S.TaskCompletedHookInputSchema>>;
export type ElicitationHookInput = z.infer<ReturnType<typeof S.ElicitationHookInputSchema>>;
export type ElicitationResultHookInput = z.infer<
  ReturnType<typeof S.ElicitationResultHookInputSchema>
>;
export type ConfigChangeHookInput = z.infer<ReturnType<typeof S.ConfigChangeHookInputSchema>>;
export type InstructionsLoadedHookInput = z.infer<
  ReturnType<typeof S.InstructionsLoadedHookInputSchema>
>;
export type WorktreeCreateHookInput = z.infer<ReturnType<typeof S.WorktreeCreateHookInputSchema>>;
export type WorktreeRemoveHookInput = z.infer<ReturnType<typeof S.WorktreeRemoveHookInputSchema>>;
export type CwdChangedHookInput = z.infer<ReturnType<typeof S.CwdChangedHookInputSchema>>;
export type FileChangedHookInput = z.infer<ReturnType<typeof S.FileChangedHookInputSchema>>;
export type ExitReason = z.infer<ReturnType<typeof S.ExitReasonSchema>>;
export type SessionEndHookInput = z.infer<ReturnType<typeof S.SessionEndHookInputSchema>>;
export type HookInput = z.infer<ReturnType<typeof S.HookInputSchema>>;
export type AsyncHookJSONOutput = z.infer<ReturnType<typeof S.AsyncHookJSONOutputSchema>>;
export type PreToolUseHookSpecificOutput = z.infer<
  ReturnType<typeof S.PreToolUseHookSpecificOutputSchema>
>;
export type UserPromptSubmitHookSpecificOutput = z.infer<
  ReturnType<typeof S.UserPromptSubmitHookSpecificOutputSchema>
>;
export type SessionStartHookSpecificOutput = z.infer<
  ReturnType<typeof S.SessionStartHookSpecificOutputSchema>
>;
export type SetupHookSpecificOutput = z.infer<ReturnType<typeof S.SetupHookSpecificOutputSchema>>;
export type SubagentStartHookSpecificOutput = z.infer<
  ReturnType<typeof S.SubagentStartHookSpecificOutputSchema>
>;
export type PostToolUseHookSpecificOutput = z.infer<
  ReturnType<typeof S.PostToolUseHookSpecificOutputSchema>
>;
export type PostToolUseFailureHookSpecificOutput = z.infer<
  ReturnType<typeof S.PostToolUseFailureHookSpecificOutputSchema>
>;
export type PermissionDeniedHookSpecificOutput = z.infer<
  ReturnType<typeof S.PermissionDeniedHookSpecificOutputSchema>
>;
export type NotificationHookSpecificOutput = z.infer<
  ReturnType<typeof S.NotificationHookSpecificOutputSchema>
>;
export type PermissionRequestHookSpecificOutput = z.infer<
  ReturnType<typeof S.PermissionRequestHookSpecificOutputSchema>
>;
export type CwdChangedHookSpecificOutput = z.infer<
  ReturnType<typeof S.CwdChangedHookSpecificOutputSchema>
>;
export type FileChangedHookSpecificOutput = z.infer<
  ReturnType<typeof S.FileChangedHookSpecificOutputSchema>
>;
export type SyncHookJSONOutput = z.infer<ReturnType<typeof S.SyncHookJSONOutputSchema>>;
export type ElicitationHookSpecificOutput = z.infer<
  ReturnType<typeof S.ElicitationHookSpecificOutputSchema>
>;
export type ElicitationResultHookSpecificOutput = z.infer<
  ReturnType<typeof S.ElicitationResultHookSpecificOutputSchema>
>;
export type WorktreeCreateHookSpecificOutput = z.infer<
  ReturnType<typeof S.WorktreeCreateHookSpecificOutputSchema>
>;
export type HookJSONOutput = z.infer<ReturnType<typeof S.HookJSONOutputSchema>>;
export type PromptRequestOption = z.infer<ReturnType<typeof S.PromptRequestOptionSchema>>;
export type PromptRequest = z.infer<ReturnType<typeof S.PromptRequestSchema>>;
export type PromptResponse = z.infer<ReturnType<typeof S.PromptResponseSchema>>;
export type SlashCommand = z.infer<ReturnType<typeof S.SlashCommandSchema>>;
export type AgentInfo = z.infer<ReturnType<typeof S.AgentInfoSchema>>;
export type ModelInfo = z.infer<ReturnType<typeof S.ModelInfoSchema>>;
export type AccountInfo = z.infer<ReturnType<typeof S.AccountInfoSchema>>;
export type AgentMcpServerSpec = z.infer<ReturnType<typeof S.AgentMcpServerSpecSchema>>;
export type AgentDefinition = z.infer<ReturnType<typeof S.AgentDefinitionSchema>>;
export type SettingSource = z.infer<ReturnType<typeof S.SettingSourceSchema>>;
export type SdkPluginConfig = z.infer<ReturnType<typeof S.SdkPluginConfigSchema>>;
export type RewindFilesResult = z.infer<ReturnType<typeof S.RewindFilesResultSchema>>;
export type SDKAssistantMessageError = z.infer<ReturnType<typeof S.SDKAssistantMessageErrorSchema>>;
export type SDKStatus = z.infer<ReturnType<typeof S.SDKStatusSchema>>;
export type SDKUserMessage = z.infer<ReturnType<typeof S.SDKUserMessageSchema>>;
export type SDKUserMessageReplay = z.infer<ReturnType<typeof S.SDKUserMessageReplaySchema>>;
export type SDKRateLimitInfo = z.infer<ReturnType<typeof S.SDKRateLimitInfoSchema>>;
export type SDKAssistantMessage = z.infer<ReturnType<typeof S.SDKAssistantMessageSchema>>;
export type SDKRateLimitEvent = z.infer<ReturnType<typeof S.SDKRateLimitEventSchema>>;
export type SDKPermissionDenial = z.infer<ReturnType<typeof S.SDKPermissionDenialSchema>>;
export type SDKResultSuccess = z.infer<ReturnType<typeof S.SDKResultSuccessSchema>>;
export type SDKResultError = z.infer<ReturnType<typeof S.SDKResultErrorSchema>>;
export type SDKResultMessage = z.infer<ReturnType<typeof S.SDKResultMessageSchema>>;
export type SDKSystemMessage = z.infer<ReturnType<typeof S.SDKSystemMessageSchema>>;
export type SDKPartialAssistantMessage = z.infer<
  ReturnType<typeof S.SDKPartialAssistantMessageSchema>
>;
export type SDKCompactBoundaryMessage = z.infer<
  ReturnType<typeof S.SDKCompactBoundaryMessageSchema>
>;
export type SDKStatusMessage = z.infer<ReturnType<typeof S.SDKStatusMessageSchema>>;
export type SDKPostTurnSummaryMessage = z.infer<
  ReturnType<typeof S.SDKPostTurnSummaryMessageSchema>
>;
export type SDKAPIRetryMessage = z.infer<ReturnType<typeof S.SDKAPIRetryMessageSchema>>;
export type SDKLocalCommandOutputMessage = z.infer<
  ReturnType<typeof S.SDKLocalCommandOutputMessageSchema>
>;
export type SDKHookStartedMessage = z.infer<ReturnType<typeof S.SDKHookStartedMessageSchema>>;
export type SDKHookProgressMessage = z.infer<ReturnType<typeof S.SDKHookProgressMessageSchema>>;
export type SDKHookResponseMessage = z.infer<ReturnType<typeof S.SDKHookResponseMessageSchema>>;
export type SDKToolProgressMessage = z.infer<ReturnType<typeof S.SDKToolProgressMessageSchema>>;
export type SDKAuthStatusMessage = z.infer<ReturnType<typeof S.SDKAuthStatusMessageSchema>>;
export type SDKFilesPersistedEvent = z.infer<ReturnType<typeof S.SDKFilesPersistedEventSchema>>;
export type SDKTaskNotificationMessage = z.infer<
  ReturnType<typeof S.SDKTaskNotificationMessageSchema>
>;
export type SDKTaskStartedMessage = z.infer<ReturnType<typeof S.SDKTaskStartedMessageSchema>>;
export type SDKSessionStateChangedMessage = z.infer<
  ReturnType<typeof S.SDKSessionStateChangedMessageSchema>
>;
export type SDKTaskProgressMessage = z.infer<ReturnType<typeof S.SDKTaskProgressMessageSchema>>;
export type SDKToolUseSummaryMessage = z.infer<ReturnType<typeof S.SDKToolUseSummaryMessageSchema>>;
export type SDKElicitationCompleteMessage = z.infer<
  ReturnType<typeof S.SDKElicitationCompleteMessageSchema>
>;
export type SDKPromptSuggestionMessage = z.infer<
  ReturnType<typeof S.SDKPromptSuggestionMessageSchema>
>;
export type SDKSessionInfo = z.infer<ReturnType<typeof S.SDKSessionInfoSchema>>;
export type SDKMessage = z.infer<ReturnType<typeof S.SDKMessageSchema>>;
export type FastModeState = z.infer<ReturnType<typeof S.FastModeStateSchema>>;
