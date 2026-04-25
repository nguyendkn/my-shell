import type { ProviderMeta, ProviderName } from "@repo/schemas/provider";
import { findProvider, PROVIDER_REGISTRY } from "./registry.js";

export type RoutingDecision = { provider: ProviderMeta; reason: string };

export function routeModel(
  requestedModelId: string,
  overrides?: { provider?: ProviderName },
): RoutingDecision {
  const rawId = requestedModelId.trim();
  if (overrides?.provider) {
    const match = PROVIDER_REGISTRY.find(
      (p) => p.provider === overrides.provider && p.modelId === rawId,
    );
    if (match) {
      return {
        provider: match,
        reason: `forced-by-override:${overrides.provider}`,
      };
    }
  }
  if (rawId.startsWith("kimi/")) {
    const stripped = rawId.slice("kimi/".length);
    const match = PROVIDER_REGISTRY.find(
      (p) => p.provider === "dashscope" && p.modelId === stripped,
    );
    if (match) {
      return { provider: match, reason: "kimi-prefix-auto-route-to-dashscope" };
    }
  }
  const direct = findProvider(rawId);
  if (direct) return { provider: direct, reason: "direct-match" };
  throw new Error(
    `Unknown model: "${rawId}". Register in PROVIDER_REGISTRY or pass a known modelId.`,
  );
}
