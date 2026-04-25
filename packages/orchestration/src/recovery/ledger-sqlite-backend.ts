import type { LedgerBackend, LedgerSummary } from "./backend.js";
import type {
  StartAttemptInput,
  CompleteAttemptInput,
} from "./ledger.js";
import { SqliteRecoveryLedger } from "./ledger-sqlite.js";
import type { RecoveryAttempt } from "@repo/schemas/recovery";

export class SqliteLedgerBackend implements LedgerBackend {
  constructor(private readonly inner: SqliteRecoveryLedger) {}

  static async open(dbPath: string): Promise<SqliteLedgerBackend> {
    const inner = await SqliteRecoveryLedger.open(dbPath);
    return new SqliteLedgerBackend(inner);
  }

  async startAttempt(input: StartAttemptInput): Promise<RecoveryAttempt> {
    return this.inner.startAttempt(input);
  }

  async completeAttempt(input: CompleteAttemptInput): Promise<RecoveryAttempt> {
    return this.inner.completeAttempt(input);
  }

  async query(sessionId: string): Promise<RecoveryAttempt[]> {
    return this.inner.query(sessionId);
  }

  async summarize(): Promise<LedgerSummary> {
    return this.inner.summarize();
  }

  close(): void {
    this.inner.close();
  }
}
