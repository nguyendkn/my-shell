import { existsSync } from "node:fs";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import { resolveRuntimeRoot } from "./runtime-paths";
import type {
  RuntimeSettingsLoadParams,
  RuntimeSettingsLoadResult,
  RuntimeSettingsSaveParams,
  RuntimeSettingsSaveResult,
  RuntimeSettingsSource,
  RuntimeSettingsSourceId,
} from "./settings-types";

const SETTINGS_SCHEMA_URL =
  "https://json.schemastore.org/claude-code-settings.json";
const LOCAL_SETTINGS_GITIGNORE_ENTRY = ".claude/settings.local.json";
const EDITABLE_SOURCES = new Set<RuntimeSettingsSourceId>([
  "userSettings",
  "projectSettings",
  "localSettings",
]);

function getWorkspaceRoot() {
  const override = process.env.FPTCLAW_SETTINGS_WORKSPACE_ROOT?.trim();

  if (override) {
    return path.resolve(override);
  }

  return path.resolve(process.cwd(), "../..");
}

function getClaudeConfigHomeDir() {
  return (process.env.CLAUDE_CONFIG_DIR ?? path.join(homedir(), ".claude"))
    .normalize("NFC");
}

function isEnvTruthy(value: string | undefined) {
  return ["1", "true", "yes", "on"].includes(value?.toLowerCase().trim() ?? "");
}

function getUserSettingsFileName() {
  return isEnvTruthy(process.env.CLAUDE_CODE_USE_COWORK_PLUGINS)
    ? "cowork_settings.json"
    : "settings.json";
}

function getManagedSettingsFilePath() {
  if (process.env.USER_TYPE === "ant" && process.env.CLAUDE_CODE_MANAGED_SETTINGS_PATH) {
    return path.join(process.env.CLAUDE_CODE_MANAGED_SETTINGS_PATH, "managed-settings.json");
  }

  if (process.platform === "darwin") {
    return "/Library/Application Support/ClaudeCode/managed-settings.json";
  }

  if (process.platform === "win32") {
    return "C:\\Program Files\\ClaudeCode\\managed-settings.json";
  }

  return "/etc/claude-code/managed-settings.json";
}

async function getRuntimeVersion(runtimeRoot: string) {
  try {
    const packageJsonPath = path.join(runtimeRoot, "package.json");
    const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8")) as {
      version?: unknown;
    };

    return typeof packageJson.version === "string" ? packageJson.version : null;
  } catch {
    return null;
  }
}

async function fileExists(filePath: string) {
  if (!filePath.trim()) {
    return false;
  }

  try {
    const info = await stat(filePath);

    return info.isFile();
  } catch {
    return false;
  }
}

async function getUpdatedAt(filePath: string) {
  if (!filePath.trim()) {
    return null;
  }

  try {
    const info = await stat(filePath);

    return info.mtime.toISOString();
  } catch {
    return null;
  }
}

function createDefaultSettingsContent() {
  return `${JSON.stringify({ $schema: SETTINGS_SCHEMA_URL }, null, 2)}\n`;
}

function createSources(): RuntimeSettingsSource[] {
  const workspaceRoot = getWorkspaceRoot();
  const sourcePaths: Record<RuntimeSettingsSourceId, string> = {
    userSettings: path.join(getClaudeConfigHomeDir(), getUserSettingsFileName()),
    projectSettings: path.join(workspaceRoot, ".claude", "settings.json"),
    localSettings: path.join(workspaceRoot, ".claude", "settings.local.json"),
    policySettings: getManagedSettingsFilePath(),
  };

  return [
    {
      id: "userSettings",
      label: "User override",
      scope: "Runtime user",
      path: sourcePaths.userSettings,
      editable: true,
      exists: existsSync(sourcePaths.userSettings),
      schemaUrl: SETTINGS_SCHEMA_URL,
    },
    {
      id: "projectSettings",
      label: "Project shared",
      scope: "Workspace",
      path: sourcePaths.projectSettings,
      editable: true,
      exists: existsSync(sourcePaths.projectSettings),
      schemaUrl: SETTINGS_SCHEMA_URL,
    },
    {
      id: "localSettings",
      label: "Project local",
      scope: "Gitignored override",
      path: sourcePaths.localSettings,
      editable: true,
      exists: existsSync(sourcePaths.localSettings),
      schemaUrl: SETTINGS_SCHEMA_URL,
    },
    {
      id: "policySettings",
      label: "Managed policy",
      scope: "Read-only",
      path: sourcePaths.policySettings,
      editable: false,
      exists: existsSync(sourcePaths.policySettings),
      schemaUrl: SETTINGS_SCHEMA_URL,
    },
  ];
}

function getSource(sourceId?: RuntimeSettingsSourceId) {
  const sources = createSources();
  const [firstSource] = sources;

  if (!firstSource) {
    throw new Error("No runtime settings sources are configured.");
  }

  const defaultSource =
    sources.find((item) => item.id === "localSettings") ?? firstSource;
  const source = sources.find((item) => item.id === sourceId) ?? defaultSource;

  return { source, sources };
}

async function ensureLocalSettingsIgnored() {
  const gitignorePath = path.join(getWorkspaceRoot(), ".gitignore");

  try {
    const currentContent = await readFile(gitignorePath, "utf8");
    const hasEntry = currentContent
      .split(/\r?\n/)
      .some((line) => line.trim() === LOCAL_SETTINGS_GITIGNORE_ENTRY);

    if (hasEntry) {
      return;
    }

    const nextContent = `${currentContent.replace(/\s*$/, "\n")}${LOCAL_SETTINGS_GITIGNORE_ENTRY}\n`;

    await writeFile(gitignorePath, nextContent, "utf8");
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error
        ? (error as { code?: unknown }).code
        : undefined;

    if (code !== "ENOENT") {
      return;
    }

    await writeFile(gitignorePath, `${LOCAL_SETTINGS_GITIGNORE_ENTRY}\n`, "utf8");
  }
}

function normalizeJsonContent(content: string) {
  const parsed: unknown = JSON.parse(content);

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Runtime settings JSON must be an object.");
  }

  return `${JSON.stringify(parsed, null, 2)}\n`;
}

export async function loadRuntimeSettings({
  sourceId,
}: RuntimeSettingsLoadParams = {}): Promise<RuntimeSettingsLoadResult> {
  const runtimeRoot = resolveRuntimeRoot().runtimeRoot;
  const runtimeVersion = await getRuntimeVersion(runtimeRoot);
  const { source, sources } = getSource(sourceId);
  const exists = await fileExists(source.path);
  let content = createDefaultSettingsContent();
  let error: string | undefined;

  if (exists) {
    try {
      content = await readFile(source.path, "utf8");
    } catch (readError) {
      error =
        readError instanceof Error
          ? readError.message
          : "Unable to read runtime settings.";
    }
  }

  return {
    runtimeRoot,
    runtimeVersion,
    sourceId: source.id,
    sources: sources.map((item) => ({
      ...item,
      exists: existsSync(item.path),
    })),
    content,
    schemaUrl: source.schemaUrl,
    exists,
    updatedAt: await getUpdatedAt(source.path),
    error,
  };
}

export async function saveRuntimeSettings({
  sourceId,
  content,
}: RuntimeSettingsSaveParams): Promise<RuntimeSettingsSaveResult> {
  const { source } = getSource(sourceId);

  if (!EDITABLE_SOURCES.has(source.id) || !source.editable) {
    return {
      ok: false,
      sourceId: source.id,
      error: "This runtime settings source is read-only.",
    };
  }

  let normalizedContent: string;

  try {
    normalizedContent = normalizeJsonContent(content);
  } catch (parseError) {
    return {
      ok: false,
      sourceId: source.id,
      error:
        parseError instanceof Error
          ? parseError.message
          : "Runtime settings JSON is invalid.",
    };
  }

  try {
    await mkdir(path.dirname(source.path), { recursive: true });
    await writeFile(source.path, normalizedContent, "utf8");

    if (source.id === "localSettings") {
      await ensureLocalSettingsIgnored();
    }

    return {
      ok: true,
      sourceId: source.id,
      content: normalizedContent,
      updatedAt: new Date().toISOString(),
    };
  } catch (writeError) {
    return {
      ok: false,
      sourceId: source.id,
      error:
        writeError instanceof Error
          ? writeError.message
          : "Unable to save runtime settings.",
    };
  }
}
