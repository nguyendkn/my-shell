import { Database } from "bun:sqlite";
import path from "node:path";
import { promises as fs } from "node:fs";
import {
  RecoveryAttempt,
  type RecoveryResult,
  type RecoveryScenario,
} from "@repo/schemas/recovery";
import type { StartAttemptInput, CompleteAttemptInput } from "./ledger.js";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS recovery_attempts (
  attemptId TEXT PRIMARY KEY,
  sessionId TEXT NOT NULL,
  scenario TEXT NOT NULL,
  startedAt TEXT NOT NULL,
  completedAt TEXT,
  result TEXT NOT NULL,
  stepsExecuted TEXT NOT NULL,
  escalationReason TEXT
);
CREATE INDEX IF NOT EXISTS idx_session ON recovery_attempts (sessionId);
CREATE INDEX IF NOT EXISTS idx_scenario ON recovery_attempts (scenario);
CREATE INDEX IF NOT EXISTS idx_result ON recovery_attempts (result);
`;

type Row = {
  attemptId: string;
  sessionId: string;
  scenario: string;
  startedAt: string;
  completedAt: string | null;
  result: string;
  stepsExecuted: string;
  escalationReason: string | null;
};

function rowToAttempt(row: Row): RecoveryAttempt {
  return RecoveryAttempt.parse({
    attemptId: row.attemptId,
    sessionId: row.sessionId,
    scenario: row.scenario,
    startedAt: row.startedAt,
    completedAt: row.completedAt ?? undefined,
    result: row.result,
    stepsExecuted: JSON.parse(row.stepsExecuted),
    escalationReason: row.escalationReason ?? undefined,
  });
}

export class SqliteRecoveryLedger {
  private readonly db: Database;

  constructor(dbPath: string) {
    this.db = new Database(dbPath, { create: true });
    this.db.exec("PRAGMA journal_mode = WAL;");
    this.db.exec("PRAGMA synchronous = NORMAL;");
    this.db.exec(SCHEMA);
  }

  static async open(dbPath: string): Promise<SqliteRecoveryLedger> {
    await fs.mkdir(path.dirname(dbPath), { recursive: true });
    return new SqliteRecoveryLedger(dbPath);
  }

  startAttempt(input: StartAttemptInput): RecoveryAttempt {
    const attempt = RecoveryAttempt.parse({
      attemptId: crypto.randomUUID(),
      sessionId: input.sessionId,
      scenario: input.scenario,
      startedAt: new Date().toISOString(),
      result: "in_progress",
      stepsExecuted: [],
    });
    this.db
      .prepare(
        `INSERT INTO recovery_attempts
         (attemptId, sessionId, scenario, startedAt, result, stepsExecuted)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(
        attempt.attemptId,
        attempt.sessionId,
        attempt.scenario,
        attempt.startedAt,
        attempt.result,
        JSON.stringify(attempt.stepsExecuted),
      );
    return attempt;
  }

  completeAttempt(input: CompleteAttemptInput): RecoveryAttempt {
    const completedAt = new Date().toISOString();
    const info = this.db
      .prepare(
        `UPDATE recovery_attempts
         SET completedAt = ?, result = ?, stepsExecuted = ?, escalationReason = ?
         WHERE attemptId = ?`,
      )
      .run(
        completedAt,
        input.result,
        JSON.stringify(input.stepsExecuted),
        input.escalationReason ?? null,
        input.attemptId,
      );
    if (info.changes === 0) {
      throw new Error(`Attempt not found: ${input.attemptId}`);
    }
    const row = this.db
      .prepare("SELECT * FROM recovery_attempts WHERE attemptId = ?")
      .get(input.attemptId) as Row;
    return rowToAttempt(row);
  }

  query(sessionId: string): RecoveryAttempt[] {
    const rows = this.db
      .prepare("SELECT * FROM recovery_attempts WHERE sessionId = ? ORDER BY startedAt ASC")
      .all(sessionId) as Row[];
    return rows.map(rowToAttempt);
  }

  summarize(): {
    total: number;
    byResult: Record<RecoveryResult, number>;
    byScenario: Record<RecoveryScenario, number>;
  } {
    const byResult: Record<RecoveryResult, number> = {
      success: 0,
      failed: 0,
      escalated: 0,
      in_progress: 0,
    };
    const byScenario: Record<RecoveryScenario, number> = {
      TrustPromptUnresolved: 0,
      PromptMisdelivery: 0,
      StaleBranch: 0,
      CompileRed: 0,
      McpHandshakeFailure: 0,
      PartialPluginStartup: 0,
      ProviderFailure: 0,
    };
    const resultRows = this.db
      .prepare("SELECT result, COUNT(*) as count FROM recovery_attempts GROUP BY result")
      .all() as Array<{ result: RecoveryResult; count: number }>;
    for (const r of resultRows) byResult[r.result] = r.count;
    const scenarioRows = this.db
      .prepare("SELECT scenario, COUNT(*) as count FROM recovery_attempts GROUP BY scenario")
      .all() as Array<{ scenario: RecoveryScenario; count: number }>;
    for (const r of scenarioRows) byScenario[r.scenario] = r.count;
    const totalRow = this.db.prepare("SELECT COUNT(*) as count FROM recovery_attempts").get() as {
      count: number;
    };
    return { total: totalRow.count, byResult, byScenario };
  }

  close(): void {
    this.db.close();
  }
}
