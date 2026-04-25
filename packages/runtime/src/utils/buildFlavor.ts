// The runtime is built in two flavors: "external" (the public release) and
// "ant" (Anthropic-internal dogfooding builds). The bundler inlines a
// literal string for BUILD_FLAVOR per build; in source we use this typed
// constant rather than a bare literal so the strict TS comparison check
// (TS2367 — types have no overlap) doesn't fire on every dead-code branch.
//
// At build time the value is one of "external" | "ant"; the type is
// widened to BuildFlavor so `BUILD_FLAVOR === "ant"` is a valid check
// even when the inlined value is "external".

export type BuildFlavor = "external" | "ant";

/**
 * Build flavor of the current runtime bundle. Always "external" in source;
 * the bundler may rewrite this to "ant" for internal dogfooding builds.
 * Use isAnt() / isExternal() rather than reading this directly to avoid
 * leaking the constant through type narrowing.
 */
export const BUILD_FLAVOR: BuildFlavor = "external";

export function isAnt(): boolean {
  return BUILD_FLAVOR === "ant";
}

export function isExternal(): boolean {
  return BUILD_FLAVOR === "external";
}
