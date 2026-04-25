#!/usr/bin/env bun
/**
 * Generate SDK type aliases from Zod schemas in coreSchemas.ts.
 *
 * Source:  packages/runtime/src/entrypoints/sdk/coreSchemas.ts
 * Output:  packages/runtime/src/entrypoints/sdk/coreTypes.generated.ts
 *
 * Pattern: each `export const XxxSchema = lazySchema(...)` emits
 *          `export type Xxx = z.infer<ReturnType<typeof XxxSchema>>;`
 */

import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const PKG_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = resolve(PKG_DIR, "src/entrypoints/sdk/coreSchemas.ts");
const TARGET = resolve(PKG_DIR, "src/entrypoints/sdk/coreTypes.generated.ts");

const HEADER = `// AUTO-GENERATED — DO NOT EDIT BY HAND
// Run: bun packages/runtime/scripts/generate-sdk-types.ts
//
// Generated from coreSchemas.ts: each XxxSchema becomes
//   export type Xxx = z.infer<ReturnType<typeof XxxSchema>>

import { z } from "zod";
import * as S from "./coreSchemas.js";
`;

const SCHEMA_RE = /^export const ([A-Za-z_][A-Za-z0-9_]*)Schema\s*=/gm;

export type GenerateResult = {
  readonly source: string;
  readonly target: string;
  readonly typeNames: readonly string[];
  readonly content: string;
};

export async function generate(opts?: {
  readonly source?: string;
  readonly target?: string;
  readonly write?: boolean;
}): Promise<GenerateResult> {
  const source = opts?.source ?? SOURCE;
  const target = opts?.target ?? TARGET;
  const write = opts?.write ?? true;

  const text = await Bun.file(source).text();
  const names: string[] = [];
  for (const match of text.matchAll(SCHEMA_RE)) {
    const name = match[1];
    if (name) names.push(name);
  }
  if (names.length === 0) {
    throw new Error(`No schemas found in ${source}`);
  }

  const seen = new Set<string>();
  const lines: string[] = [HEADER];
  for (const name of names) {
    if (seen.has(name)) continue;
    seen.add(name);
    lines.push(`export type ${name} = z.infer<ReturnType<typeof S.${name}Schema>>;`);
  }
  lines.push("");
  const content = lines.join("\n");

  if (write) {
    await Bun.write(target, content);
  }
  return { source, target, typeNames: [...seen], content };
}

if (import.meta.main) {
  const result = await generate();
  console.log(`Generated ${result.typeNames.length} types → ${result.target}`);
}
