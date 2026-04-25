export type DiscoverySignal = {
  readonly kind: string;
  readonly source?: string;
  readonly weight?: number;
  readonly metadata?: Record<string, unknown>;
};

export function createSkillSearchSignal() {
  return null;
}
