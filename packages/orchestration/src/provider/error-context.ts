import { ProviderError, type ProviderErrorCode, type ProviderName } from "@repo/schemas/provider";

export type WrapErrorInput = {
  provider: ProviderName;
  modelId: string;
  error: unknown;
  httpStatus?: number;
  requestId?: string;
};

const RETRYABLE_CODES: ReadonlySet<ProviderErrorCode> = new Set([
  "rate_limited",
  "timeout",
  "network",
  "provider_error",
]);

export function classifyError(input: WrapErrorInput): ProviderErrorCode {
  const { error, httpStatus } = input;
  if (httpStatus != null) {
    if (httpStatus === 413) return "request_too_large";
    if (httpStatus === 400) return "invalid_request";
    if (httpStatus === 401 || httpStatus === 403) return "auth_failed";
    if (httpStatus === 429) return "rate_limited";
    if (httpStatus >= 500) return "provider_error";
  }
  const msg = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  if (msg.includes("timeout") || msg.includes("timed out")) return "timeout";
  if (msg.includes("econnreset") || msg.includes("network") || msg.includes("fetch failed")) {
    return "network";
  }
  return "unknown";
}

export function wrapProviderError(input: WrapErrorInput): ProviderError {
  const code = classifyError(input);
  const message = input.error instanceof Error ? input.error.message : String(input.error);
  return ProviderError.parse({
    code,
    provider: input.provider,
    modelId: input.modelId,
    message,
    requestId: input.requestId,
    httpStatus: input.httpStatus,
    retryable: RETRYABLE_CODES.has(code),
    raw: input.error instanceof Error ? { name: input.error.name } : input.error,
    timestamp: new Date().toISOString(),
  });
}
