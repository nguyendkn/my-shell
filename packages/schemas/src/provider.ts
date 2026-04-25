import { z } from "zod";

export const ProviderName = z.enum([
  "anthropic",
  "openai-compat",
  "dashscope",
  "bedrock",
  "gemini",
  "vertex",
  "unknown",
]);
export type ProviderName = z.infer<typeof ProviderName>;

export const ModelFamily = z.enum(["claude", "gpt", "kimi", "qwen", "deepseek", "gemini", "other"]);
export type ModelFamily = z.infer<typeof ModelFamily>;

export const TokenLimits = z.object({
  contextWindow: z.number().int().positive(),
  maxOutputTokens: z.number().int().positive(),
  maxRequestBytes: z.number().int().positive().optional(),
});
export type TokenLimits = z.infer<typeof TokenLimits>;

export const ProviderMeta = z.object({
  provider: ProviderName,
  modelId: z.string().min(1),
  family: ModelFamily,
  limits: TokenLimits,
  endpoint: z.string().url().optional(),
});
export type ProviderMeta = z.infer<typeof ProviderMeta>;

export const ProviderErrorCode = z.enum([
  "request_too_large",
  "invalid_request",
  "rate_limited",
  "auth_failed",
  "provider_error",
  "timeout",
  "network",
  "unknown",
]);
export type ProviderErrorCode = z.infer<typeof ProviderErrorCode>;

export const ProviderError = z.object({
  code: ProviderErrorCode,
  provider: ProviderName,
  modelId: z.string(),
  message: z.string(),
  requestId: z.string().optional(),
  httpStatus: z.number().int().optional(),
  retryable: z.boolean(),
  raw: z.unknown().optional(),
  timestamp: z.string().datetime(),
});
export type ProviderError = z.infer<typeof ProviderError>;
