export function transitionQueryState<T>(value: T): T {
  return value;
}

// Terminal/Continue describe the result of one query loop iteration.
// Each return path includes a `reason` plus optional metadata (turnCount,
// error, etc.). The fields are intentionally open via the index signature
// because individual callsites add their own contextual fields.
export type Terminal = {
  readonly kind?: "terminal";
  readonly reason: string;
  readonly turnCount?: number;
  readonly error?: unknown;
  readonly value?: unknown;
  [key: string]: unknown;
};

export type Continue = {
  readonly kind?: "continue";
  readonly reason?: string;
  readonly value?: unknown;
  [key: string]: unknown;
};

export const Terminal = (value: unknown): Terminal => ({
  kind: "terminal",
  reason: "terminal",
  value,
});
export const Continue = (value: unknown): Continue => ({
  kind: "continue",
  value,
});
