import type { CoordinateMode, CuSubGates } from "@ant/computer-use-mcp/types";

import { getDynamicConfig_CACHED_MAY_BE_STALE } from "../../services/analytics/growthbook.js";
import { getSubscriptionType } from "../auth.js";
import { isEnvTruthy } from "../envUtils.js";

// CuSubGates is Record<string, boolean>; ChicagoConfig adds the
// non-boolean coordinateMode plus the enabled flag. Define as an
// intersection that is _structurally_ compatible with CuSubGates by
// dropping the string-record constraint at the type level (callers that
// take CuSubGates work via the destructured subGates path below, where
// only the boolean keys remain).
type ChicagoConfig = Omit<CuSubGates, "coordinateMode"> & {
  enabled: boolean;
  coordinateMode: CoordinateMode;
};

// CuSubGates is `Record<string, boolean>` upstream; the literal below
// satisfies the keys we use, but the index-signature constraint won't
// accept the non-boolean coordinateMode. Cast through `unknown` so TS
// stops trying to align the structural shapes.
const DEFAULTS = {
  enabled: false,
  pixelValidation: false,
  clipboardPasteMultiline: true,
  mouseAnimation: true,
  hideBeforeAction: true,
  autoTargetDisplay: true,
  clipboardGuard: true,
  coordinateMode: "pixels",
} as unknown as ChicagoConfig;

// Spread over defaults so a partial JSON ({"enabled": true} alone) inherits the
// rest. The generic on getDynamicConfig is a type assertion, not a validator —
// GB returning a partial object would otherwise surface undefined fields.
function readConfig(): ChicagoConfig {
  return {
    ...DEFAULTS,
    ...getDynamicConfig_CACHED_MAY_BE_STALE<Partial<ChicagoConfig>>(
      "tengu_malort_pedway",
      DEFAULTS,
    ),
  };
}

// Max/Pro only for external rollout. Ant bypass so dogfooding continues
// regardless of subscription tier — not all ants are max/pro, and per
// CLAUDE.md:281, USER_TYPE !== 'ant' branches get zero antfooding.
function hasRequiredSubscription(): boolean {
  if (process.env.USER_TYPE === "ant") return true;
  const tier = getSubscriptionType();
  return tier === "max" || tier === "pro";
}

export function getChicagoEnabled(): boolean {
  // Disable for ants whose shell inherited monorepo dev config.
  // MONOREPO_ROOT_DIR is exported by config/local/zsh/zshrc, which
  // laptop-setup.sh wires into ~/.zshrc — its presence is the cheap
  // proxy for "has monorepo access". Override: ALLOW_ANT_COMPUTER_USE_MCP=1.
  if (
    process.env.USER_TYPE === "ant" &&
    process.env.MONOREPO_ROOT_DIR &&
    !isEnvTruthy(process.env.ALLOW_ANT_COMPUTER_USE_MCP)
  ) {
    return false;
  }
  return hasRequiredSubscription() && readConfig().enabled;
}

export function getChicagoSubGates(): CuSubGates {
  const { enabled: _e, coordinateMode: _c, ...subGates } = readConfig();
  return subGates;
}

// Frozen at first read — setup.ts builds tool descriptions and executor.ts
// scales coordinates off the same value. A live read here lets a mid-session
// GB flip tell the model "pixels" while transforming clicks as normalized.
let frozenCoordinateMode: CoordinateMode | undefined;
export function getChicagoCoordinateMode(): CoordinateMode {
  frozenCoordinateMode ??= readConfig().coordinateMode;
  return frozenCoordinateMode;
}
