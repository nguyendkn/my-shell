#!/usr/bin/env bun
import path from "node:path";
import os from "node:os";
import { SqliteRecoveryLedger } from "../recovery/ledger-sqlite.js";

const DEFAULT_DB = path.join(process.env.HOME ?? os.homedir(), ".claude", "recovery-ledger.db");

function printUsage(): void {
  console.log(
    `Usage: ledger-cli <command> [args]

Commands:
  summary                 Print aggregate summary
  query <sessionId>       List attempts for a session
  path                    Print ledger database path

Environment:
  LEDGER_DB_PATH          Override database path (default: ~/.claude/recovery-ledger.db)
`,
  );
}

export async function runLedgerCli(
  argv: readonly string[],
  dbPath: string = process.env.LEDGER_DB_PATH ?? DEFAULT_DB,
): Promise<number> {
  const [cmd, ...args] = argv;
  if (!cmd || cmd === "help" || cmd === "--help" || cmd === "-h") {
    printUsage();
    return 0;
  }
  if (cmd === "path") {
    console.log(dbPath);
    return 0;
  }
  const ledger = new SqliteRecoveryLedger(dbPath);
  try {
    switch (cmd) {
      case "summary": {
        const sum = await ledger.summarize();
        console.log(`Total attempts: ${sum.total}`);
        console.log("\nBy result:");
        for (const [k, v] of Object.entries(sum.byResult)) {
          if ((v as number) > 0) console.log(`  ${k.padEnd(14)} ${v}`);
        }
        console.log("\nBy scenario:");
        for (const [k, v] of Object.entries(sum.byScenario)) {
          if ((v as number) > 0) console.log(`  ${k.padEnd(24)} ${v}`);
        }
        return 0;
      }
      case "query": {
        if (!args[0]) {
          console.error("Usage: ledger-cli query <sessionId>");
          return 1;
        }
        const attempts = await ledger.query(args[0]);
        if (attempts.length === 0) {
          console.log(`(no attempts for session ${args[0]})`);
          return 0;
        }
        for (const a of attempts) {
          const age = a.completedAt ?? `in-progress since ${a.startedAt}`;
          console.log(`[${a.scenario.padEnd(22)}] ${a.result.padEnd(12)} ${a.attemptId} · ${age}`);
        }
        return 0;
      }
      default:
        console.error(`Unknown command: ${cmd}`);
        printUsage();
        return 1;
    }
  } finally {
    // no-op cleanup for now
  }
}

if (import.meta.path === Bun.main) {
  const argv = process.argv.slice(2);
  runLedgerCli(argv).then((code) => process.exit(code));
}
