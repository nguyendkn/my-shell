import type { McpbManifestAny } from "@anthropic-ai/mcpb";
import { errorMessage } from "../errors.js";
import { jsonParse } from "../slowOperations.js";

// Re-export under the legacy name so existing call sites keep compiling
// without churn. The mcpb package renamed McpbManifest -> McpbManifestAny in
// 2.x but the runtime still references the old name in many places.
export type McpbManifest = McpbManifestAny;

/**
 * Parses and validates a DXT manifest from a JSON object.
 *
 * Lazy-imports @anthropic-ai/mcpb: that package uses zod v3 which eagerly
 * creates 24 .bind(this) closures per schema instance (~300 instances between
 * schemas.js and schemas-loose.js). Deferring the import keeps ~700KB of bound
 * closures out of the startup heap for sessions that never touch .dxt/.mcpb.
 */
export async function validateManifest(manifestJson: unknown): Promise<McpbManifestAny> {
  // mcpb 2.x exposes McpbManifestSchema only under the namespaced
  // `vAny` re-export — the loose root re-export was dropped.
  const { vAny } = await import("@anthropic-ai/mcpb");
  const parseResult = vAny.McpbManifestSchema.safeParse(manifestJson);

  if (!parseResult.success) {
    const fieldErrors: Record<string, string[] | undefined> =
      parseResult.error.flatten().fieldErrors;
    const formErrors: string[] = parseResult.error.flatten().formErrors ?? [];
    const errorMessages = [
      ...Object.entries(fieldErrors).map(([field, errs]) => `${field}: ${(errs ?? []).join(", ")}`),
      ...formErrors,
    ]
      .filter(Boolean)
      .join("; ");

    throw new Error(`Invalid manifest: ${errorMessages}`);
  }

  return parseResult.data;
}

/**
 * Parses and validates a DXT manifest from raw text data.
 */
export async function parseAndValidateManifestFromText(
  manifestText: string,
): Promise<McpbManifest> {
  let manifestJson: unknown;

  try {
    manifestJson = jsonParse(manifestText);
  } catch (error) {
    throw new Error(`Invalid JSON in manifest.json: ${errorMessage(error)}`);
  }

  return validateManifest(manifestJson);
}

/**
 * Parses and validates a DXT manifest from raw binary data.
 */
export async function parseAndValidateManifestFromBytes(
  manifestData: Uint8Array,
): Promise<McpbManifest> {
  const manifestText = new TextDecoder().decode(manifestData);
  return parseAndValidateManifestFromText(manifestText);
}

/**
 * Generates an extension ID from author name and extension name.
 * Uses the same algorithm as the directory backend for consistency.
 */
export function generateExtensionId(
  manifest: McpbManifest,
  prefix?: "local.unpacked" | "local.dxt",
): string {
  const sanitize = (str: string) =>
    str
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-_.]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");

  const authorName = manifest.author.name;
  const extensionName = manifest.name;

  const sanitizedAuthor = sanitize(authorName);
  const sanitizedName = sanitize(extensionName);

  return prefix
    ? `${prefix}.${sanitizedAuthor}.${sanitizedName}`
    : `${sanitizedAuthor}.${sanitizedName}`;
}
