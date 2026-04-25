import type { ProviderMeta } from "@repo/schemas/provider";

export type PreflightInput = {
  provider: ProviderMeta;
  body: string | Uint8Array;
  estimatedInputTokens?: number;
  requestedMaxOutputTokens?: number;
};

export type PreflightResult = {
  ok: boolean;
  bodyBytes: number;
  violations: string[];
};

export function preflightRequest(input: PreflightInput): PreflightResult {
  const bodyBytes =
    typeof input.body === "string"
      ? new TextEncoder().encode(input.body).byteLength
      : input.body.byteLength;
  const violations: string[] = [];
  const { limits } = input.provider;
  if (limits.maxRequestBytes != null && bodyBytes > limits.maxRequestBytes) {
    violations.push(`Body ${bodyBytes} bytes exceeds provider max ${limits.maxRequestBytes}`);
  }
  if (input.estimatedInputTokens != null && input.estimatedInputTokens > limits.contextWindow) {
    violations.push(
      `Estimated input tokens ${input.estimatedInputTokens} exceeds context window ${limits.contextWindow}`,
    );
  }
  if (
    input.requestedMaxOutputTokens != null &&
    input.requestedMaxOutputTokens > limits.maxOutputTokens
  ) {
    violations.push(
      `Requested maxOutputTokens ${input.requestedMaxOutputTokens} exceeds provider max ${limits.maxOutputTokens}`,
    );
  }
  return { ok: violations.length === 0, bodyBytes, violations };
}

export class PreflightViolationError extends Error {
  readonly violations: ReadonlyArray<string>;
  readonly provider: ProviderMeta;
  readonly bodyBytes: number;
  constructor(result: PreflightResult, provider: ProviderMeta) {
    super(`Preflight failed for ${provider.modelId}: ${result.violations.join("; ")}`);
    this.name = "PreflightViolationError";
    this.violations = result.violations;
    this.provider = provider;
    this.bodyBytes = result.bodyBytes;
  }
}

export function assertPreflightOk(result: PreflightResult, provider: ProviderMeta): void {
  if (!result.ok) {
    throw new PreflightViolationError(result, provider);
  }
}
