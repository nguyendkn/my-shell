import type { LaneEvent } from "./lane-event.js";

const TERMINAL_TYPES: ReadonlySet<LaneEvent["type"]> = new Set(["lane.finished", "lane.failed"]);

export function isTerminalEvent(event: LaneEvent): boolean {
  return TERMINAL_TYPES.has(event.type);
}

export function fingerprintTerminal(event: LaneEvent): string {
  const { sessionId, laneId } = event.session;
  switch (event.type) {
    case "lane.finished":
      return `${sessionId}|${laneId}|finished|${event.outcome}`;
    case "lane.failed":
      return `${sessionId}|${laneId}|failed|${event.classification ?? "unknown"}|${event.error}`;
    default:
      throw new Error(`Cannot fingerprint non-terminal event: ${event.type}`);
  }
}

export class TerminalEventDedup {
  private readonly seen = new Set<string>();

  observe(event: LaneEvent): { duplicate: boolean; fingerprint: string | null } {
    if (!isTerminalEvent(event)) {
      return { duplicate: false, fingerprint: null };
    }
    const fp = fingerprintTerminal(event);
    if (this.seen.has(fp)) {
      return { duplicate: true, fingerprint: fp };
    }
    this.seen.add(fp);
    return { duplicate: false, fingerprint: fp };
  }

  size(): number {
    return this.seen.size;
  }

  clear(): void {
    this.seen.clear();
  }
}
