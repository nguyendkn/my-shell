#!/usr/bin/env bun
import { promises as fs } from "node:fs";
import { findProvider, preflightRequest, routeModel } from "../provider/index.js";

function printUsage(): void {
  console.log(
    `Usage: preflight-cli <model> <body-file-or-stdin> [--tokens=N] [--max-output=N] [--route]

Examples:
  preflight-cli claude-opus-4-7 ./payload.json
  preflight-cli kimi/kimi-k2.5 - < payload.json
  echo '{"x":1}' | preflight-cli kimi-k2.5 -
  preflight-cli kimi/kimi-k2.5 - --route           # show routing decision
`,
  );
}

async function readBody(pathOrDash: string): Promise<string> {
  if (pathOrDash === "-") {
    const chunks: Buffer[] = [];
    for await (const chunk of process.stdin) {
      chunks.push(chunk as Buffer);
    }
    return Buffer.concat(chunks).toString("utf8");
  }
  return fs.readFile(pathOrDash, "utf8");
}

export async function runPreflightCli(
  argv: readonly string[],
  stdin: () => Promise<string> = () => readBody("-"),
): Promise<number> {
  if (argv.length < 2 || argv[0] === "help" || argv[0] === "--help") {
    printUsage();
    return argv.length < 2 ? 1 : 0;
  }
  const [modelArg, bodySource, ...flags] = argv;
  if (!modelArg || !bodySource) {
    printUsage();
    return 1;
  }
  let tokens: number | undefined;
  let maxOutput: number | undefined;
  let showRouting = false;
  for (const f of flags) {
    if (f.startsWith("--tokens=")) tokens = Number(f.slice("--tokens=".length));
    if (f.startsWith("--max-output=")) {
      maxOutput = Number(f.slice("--max-output=".length));
    }
    if (f === "--route") showRouting = true;
  }

  let providerMeta;
  let routing: string | null = null;
  try {
    const decision = routeModel(modelArg);
    providerMeta = decision.provider;
    routing = decision.reason;
  } catch {
    providerMeta = findProvider(modelArg);
    if (!providerMeta) {
      console.error(`Unknown model: ${modelArg}`);
      return 1;
    }
  }

  if (showRouting && routing) {
    console.log(
      `Routing: ${modelArg} → ${providerMeta.provider}/${providerMeta.modelId} (${routing})`,
    );
  }

  const body = bodySource === "-" ? await stdin() : await readBody(bodySource);
  const result = preflightRequest({
    provider: providerMeta,
    body,
    estimatedInputTokens: tokens,
    requestedMaxOutputTokens: maxOutput,
  });

  console.log(`Provider:     ${providerMeta.provider}/${providerMeta.modelId}`);
  console.log(`Body size:    ${result.bodyBytes} bytes`);
  console.log(
    `Context:      ${providerMeta.limits.contextWindow} tokens (max output: ${providerMeta.limits.maxOutputTokens})`,
  );
  if (providerMeta.limits.maxRequestBytes) {
    console.log(`Max body:     ${providerMeta.limits.maxRequestBytes} bytes`);
  }
  if (result.ok) {
    console.log("Status:       OK");
    return 0;
  }
  console.log("Status:       FAIL");
  for (const v of result.violations) {
    console.log(`  - ${v}`);
  }
  return 2;
}

if (import.meta.path === Bun.main) {
  const argv = process.argv.slice(2);
  runPreflightCli(argv).then((code) => process.exit(code));
}
