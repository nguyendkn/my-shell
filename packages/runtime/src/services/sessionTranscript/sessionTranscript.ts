// Stub: session transcript service. No-op in external builds.
export interface SessionTranscriptEntry {
  readonly timestamp: string;
  readonly text: string;
}

export function recordTranscript(_entry: SessionTranscriptEntry): void {}
export function getTranscript(): readonly SessionTranscriptEntry[] {
  return [];
}
export function clearTranscript(): void {}

// KAIROS-gated reduced-transcript writer. The compact/sessionMemoryCompact
// paths fire-and-forget this whenever they trim a segment so an external
// summarizer can ingest the dropped messages. Stubbed out — no segment is
// persisted in the restored runtime.
export async function writeSessionTranscriptSegment(_messages: unknown): Promise<void> {
  return;
}

// Called from utils/attachments when the day changes so the transcript
// writer can roll over to a fresh file. No-op in the restored runtime.
export function flushOnDateChange(_messages?: unknown, _currentDate?: unknown): void {}
