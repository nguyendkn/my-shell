import { ProviderMeta } from "@repo/schemas/provider";

export const PROVIDER_REGISTRY: readonly ProviderMeta[] = [
  ProviderMeta.parse({
    provider: "anthropic",
    modelId: "claude-sonnet-4-6",
    family: "claude",
    limits: { contextWindow: 200_000, maxOutputTokens: 8_192 },
  }),
  ProviderMeta.parse({
    provider: "anthropic",
    modelId: "claude-opus-4-7",
    family: "claude",
    limits: { contextWindow: 1_000_000, maxOutputTokens: 8_192 },
  }),
  ProviderMeta.parse({
    provider: "anthropic",
    modelId: "claude-haiku-4-5-20251001",
    family: "claude",
    limits: { contextWindow: 200_000, maxOutputTokens: 8_192 },
  }),
  ProviderMeta.parse({
    provider: "dashscope",
    modelId: "kimi-k2.5",
    family: "kimi",
    limits: {
      contextWindow: 256_000,
      maxOutputTokens: 16_000,
      maxRequestBytes: 6 * 1024 * 1024,
    },
    endpoint: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  }),
  ProviderMeta.parse({
    provider: "dashscope",
    modelId: "qwen-max",
    family: "qwen",
    limits: {
      contextWindow: 128_000,
      maxOutputTokens: 8_192,
      maxRequestBytes: 6 * 1024 * 1024,
    },
    endpoint: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  }),
  ProviderMeta.parse({
    provider: "openai-compat",
    modelId: "gpt-5",
    family: "gpt",
    limits: { contextWindow: 400_000, maxOutputTokens: 16_000 },
  }),
];

export function findProvider(modelId: string): ProviderMeta | null {
  return PROVIDER_REGISTRY.find((p) => p.modelId === modelId) ?? null;
}
