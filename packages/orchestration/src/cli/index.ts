#!/usr/bin/env bun
import { runPolicyCli } from "./policy-cli.js";
import { runLedgerCli } from "./ledger-cli.js";
import { runPreflightCli } from "./preflight-cli.js";

function printUsage(): void {
  console.log(
    `Usage: orch <command> [args]

Commands:
  policy <sub>        Policy rules: list, enable, disable, simulate, reset
  ledger <sub>        Recovery ledger: summary, query, path
  preflight <args>    Request preflight checker

Run \`orch <command> help\` for details.
`,
  );
}

export async function runOrchCli(argv: readonly string[] = process.argv.slice(2)): Promise<number> {
  const [cmd, ...rest] = argv;
  switch (cmd) {
    case "policy":
      return runPolicyCli(rest);
    case "ledger":
      return runLedgerCli(rest);
    case "preflight":
      return runPreflightCli(rest);
    case undefined:
    case "help":
    case "--help":
    case "-h":
      printUsage();
      return 0;
    default:
      console.error(`Unknown command: ${cmd}`);
      printUsage();
      return 1;
  }
}

export { runPolicyCli, runLedgerCli, runPreflightCli };

if (import.meta.path === Bun.main) {
  runOrchCli().then((code) => process.exit(code));
}
