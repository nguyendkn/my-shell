import { type LaneEvent, TerminalEventDedup, assertNever, isTerminalEvent } from "@repo/schemas";

export type LaneSummary = {
  totalEvents: number;
  terminalEvents: number;
  duplicatesSuppressed: number;
  byType: Partial<Record<LaneEvent["type"], number>>;
  lastOutcome: "success" | "failure" | "cancelled" | null;
  failures: Array<{ laneId: string; error: string; classification?: string }>;
};

export class LaneEventConsumer {
  private readonly dedup = new TerminalEventDedup();
  private totalEvents = 0;
  private terminalEvents = 0;
  private duplicatesSuppressed = 0;
  private byType: Partial<Record<LaneEvent["type"], number>> = {};
  private lastOutcome: "success" | "failure" | "cancelled" | null = null;
  private failures: Array<{
    laneId: string;
    error: string;
    classification?: string;
  }> = [];

  accept(event: LaneEvent): { accepted: boolean; reason: string } {
    this.totalEvents += 1;
    this.byType[event.type] = (this.byType[event.type] ?? 0) + 1;
    if (isTerminalEvent(event)) {
      const result = this.dedup.observe(event);
      if (result.duplicate) {
        this.duplicatesSuppressed += 1;
        return { accepted: false, reason: "duplicate_terminal" };
      }
      this.terminalEvents += 1;
    }
    switch (event.type) {
      case "lane.started":
      case "lane.ready":
      case "lane.blocked":
      case "lane.red":
      case "lane.green":
      case "lane.commit.created":
      case "lane.pr.opened":
      case "branch.stale_against_main":
        return { accepted: true, reason: "lifecycle" };
      case "lane.finished":
        this.lastOutcome = event.outcome;
        return { accepted: true, reason: "terminal_finished" };
      case "lane.failed":
        this.lastOutcome = "failure";
        this.failures.push({
          laneId: event.session.laneId,
          error: event.error,
          classification: event.classification,
        });
        return { accepted: true, reason: "terminal_failed" };
      default:
        return assertNever(event);
    }
  }

  summary(): LaneSummary {
    return {
      totalEvents: this.totalEvents,
      terminalEvents: this.terminalEvents,
      duplicatesSuppressed: this.duplicatesSuppressed,
      byType: { ...this.byType },
      lastOutcome: this.lastOutcome,
      failures: [...this.failures],
    };
  }
}
