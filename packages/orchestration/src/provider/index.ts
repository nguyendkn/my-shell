// Public surface for the provider lane: registry, routing, preflight checks
// and error classification. Re-exports from concrete submodules so the
// orchestration package keeps a single import barrel.

export { PROVIDER_REGISTRY, findProvider } from "./registry.js";
export type { RoutingDecision } from "./routing.js";
export { routeModel } from "./routing.js";
export type { PreflightInput, PreflightResult } from "./preflight.js";
export { preflightRequest, PreflightViolationError, assertPreflightOk } from "./preflight.js";
export type { WrapErrorInput } from "./error-context.js";
export { wrapProviderError, classifyError } from "./error-context.js";
