// "Non-nullable" view of @anthropic-ai/sdk's BetaUsage. The SDK marks
// fields like cache_creation_input_tokens as `number | null`, but the
// runtime accumulates these as plain numbers (with 0 as the additive
// identity). This shape mirrors BetaUsage exactly except for the null
// removal so values flow back through `as BetaUsage` without per-field
// fallbacks.

import type {
  BetaCacheCreation,
  BetaIterationsUsage,
  BetaServerToolUsage,
  BetaUsage,
} from "@anthropic-ai/sdk/resources/beta/messages/messages.mjs";

export type NonNullableUsage = {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens: number;
  cache_read_input_tokens: number;
  cache_creation: BetaCacheCreation | null;
  inference_geo: string | null;
  iterations: BetaIterationsUsage | null;
  server_tool_use: BetaServerToolUsage | null;
  service_tier: BetaUsage["service_tier"];
  speed: BetaUsage["speed"];
};
