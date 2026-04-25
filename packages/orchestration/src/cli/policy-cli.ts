#!/usr/bin/env bun
import { promises as fs } from "node:fs";
import path from "node:path";
import { LaneEvent } from "@repo/schemas/lane-event";
import { PolicyRule } from "@repo/schemas/policy";
import { DEFAULT_RULES, PolicyEngine } from "../policy/index.js";

const DEFAULT_RULES_PATH = path.join(process.env.HOME ?? ".", ".claude", "policy-rules.json");

type RulesFile = { version: 1; rules: PolicyRule[] };

async function loadRules(file: string): Promise<PolicyRule[]> {
  try {
    const raw = await fs.readFile(file, "utf8");
    const parsed = JSON.parse(raw) as RulesFile;
    return parsed.rules.map((r) => PolicyRule.parse(r));
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return DEFAULT_RULES;
    throw err;
  }
}

async function saveRules(file: string, rules: PolicyRule[]): Promise<void> {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify({ version: 1, rules }, null, 2), "utf8");
}

function printUsage(): void {
  console.log(
    `Usage: policy-cli <command> [args]

Commands:
  list                    List all rules
  enable <id>             Enable rule by id
  disable <id>            Disable rule by id
  simulate <event-json>   Dry-run evaluate event
  reset                   Reset to DEFAULT_RULES
`,
  );
}

export async function runPolicyCli(
  argv: readonly string[],
  file: string = process.env.POLICY_RULES_PATH ?? DEFAULT_RULES_PATH,
): Promise<number> {
  const [cmd, ...args] = argv;
  switch (cmd) {
    case "list": {
      const rules = await loadRules(file);
      if (rules.length === 0) {
        console.log("(no rules)");
        return 0;
      }
      for (const r of rules) {
        const status = r.enabled ? "enabled" : "disabled";
        const dry = r.dryRun ? "dry-run" : "EXECUTE";
        console.log(
          `[p=${r.priority.toString().padStart(3)}] ${status.padEnd(8)} ${dry.padEnd(7)} ${r.id} — ${r.name}`,
        );
      }
      return 0;
    }
    case "enable":
    case "disable": {
      if (!args[0]) {
        console.error(`Usage: policy-cli ${cmd} <id>`);
        return 1;
      }
      const rules = await loadRules(file);
      const idx = rules.findIndex((r) => r.id === args[0]);
      if (idx < 0) {
        console.error(`Rule not found: ${args[0]}`);
        return 1;
      }
      rules[idx] = PolicyRule.parse({
        ...rules[idx],
        enabled: cmd === "enable",
      });
      await saveRules(file, rules);
      console.log(`${cmd === "enable" ? "Enabled" : "Disabled"}: ${args[0]}`);
      return 0;
    }
    case "simulate": {
      if (!args[0]) {
        console.error("Usage: policy-cli simulate <event-json>");
        return 1;
      }
      let event: LaneEvent;
      try {
        event = LaneEvent.parse(JSON.parse(args[0]));
      } catch (err) {
        console.error(`Invalid event JSON: ${err instanceof Error ? err.message : String(err)}`);
        return 1;
      }
      const rules = await loadRules(file);
      const result = new PolicyEngine().evaluate(event, rules, {
        mode: "dry-run",
      });
      console.log(`Mode: ${result.mode}`);
      console.log(`Matched ${result.matched.length} rule(s):`);
      for (const m of result.matched) {
        console.log(`  [p=${m.rule.priority}] ${m.rule.id} → ${m.action.kind}`);
      }
      return 0;
    }
    case "reset":
      await saveRules(file, DEFAULT_RULES);
      console.log(`Reset ${DEFAULT_RULES.length} rules to defaults`);
      return 0;
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

if (import.meta.path === Bun.main) {
  runPolicyCli(process.argv.slice(2)).then((code) => process.exit(code));
}
