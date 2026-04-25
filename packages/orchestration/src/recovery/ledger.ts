import { promises as fs } from "node:fs";
import path from "node:path";
import lockfile from "proper-lockfile";
import {
  RecoveryAttempt,
  type RecoveryResult,
  type RecoveryScenario,
} from "@repo/schemas/recovery";

export type LedgerPath = string;

export type StartAttemptInput = {
  sessionId: string;
  scenario: RecoveryScenario;
};

export type CompleteAttemptInput = {
  attemptId: string;
  result: Exclude<RecoveryResult, "in_progress">;
  stepsExecuted: string[];
  escalationReason?: string;
};

type LedgerFile = { version: 1; attempts: RecoveryAttempt[] };

const EMPTY: LedgerFile = { version: 1, attempts: [] };

async function ensureFile(p: LedgerPath): Promise<void> {
  await fs.mkdir(path.dirname(p), { recursive: true });
  try {
    await fs.access(p);
  } catch {
    await fs.writeFile(p, JSON.stringify(EMPTY, null, 2), "utf8");
  }
}

async function readFile(p: LedgerPath): Promise<LedgerFile> {
  const raw = await fs.readFile(p, "utf8");
  const parsed = JSON.parse(raw) as LedgerFile;
  parsed.attempts = parsed.attempts.map((a) => RecoveryAttempt.parse(a));
  return parsed;
}

async function writeFile(p: LedgerPath, data: LedgerFile): Promise<void> {
  await fs.writeFile(p, JSON.stringify(data, null, 2), "utf8");
}

async function mutate(p: LedgerPath, fn: (data: LedgerFile) => LedgerFile): Promise<LedgerFile> {
  await ensureFile(p);
  const release = await lockfile.lock(p, {
    retries: { retries: 10, minTimeout: 50, maxTimeout: 500 },
  });
  try {
    const current = await readFile(p);
    const next = fn(current);
    await writeFile(p, next);
    return next;
  } finally {
    await release();
  }
}

export class RecoveryLedger {
  constructor(private readonly path: LedgerPath) {}

  async startAttempt(input: StartAttemptInput): Promise<RecoveryAttempt> {
    const attempt = RecoveryAttempt.parse({
      attemptId: crypto.randomUUID(),
      sessionId: input.sessionId,
      scenario: input.scenario,
      startedAt: new Date().toISOString(),
      result: "in_progress",
      stepsExecuted: [],
    });
    await mutate(this.path, (data) => ({
      ...data,
      attempts: [...data.attempts, attempt],
    }));
    return attempt;
  }

  async completeAttempt(input: CompleteAttemptInput): Promise<RecoveryAttempt> {
    let updated: RecoveryAttempt | null = null;
    await mutate(this.path, (data) => {
      const next = data.attempts.map((a) => {
        if (a.attemptId !== input.attemptId) return a;
        const merged: RecoveryAttempt = RecoveryAttempt.parse({
          ...a,
          completedAt: new Date().toISOString(),
          result: input.result,
          stepsExecuted: input.stepsExecuted,
          escalationReason: input.escalationReason,
        });
        updated = merged;
        return merged;
      });
      return { ...data, attempts: next };
    });
    if (!updated) {
      throw new Error(`Attempt not found: ${input.attemptId}`);
    }
    return updated;
  }

  async query(sessionId: string): Promise<RecoveryAttempt[]> {
    await ensureFile(this.path);
    const data = await readFile(this.path);
    return data.attempts.filter((a) => a.sessionId === sessionId);
  }

  async summarize(): Promise<{
    total: number;
    byResult: Record<RecoveryResult, number>;
    byScenario: Record<RecoveryScenario, number>;
  }> {
    await ensureFile(this.path);
    const data = await readFile(this.path);
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
    for (const a of data.attempts) {
      byResult[a.result] += 1;
      byScenario[a.scenario] += 1;
    }
    return { total: data.attempts.length, byResult, byScenario };
  }
}
