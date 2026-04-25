import { appendFileSync, existsSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

export type RuntimeRootResolution = {
  runtimeRoot: string;
  runtimeEntry: string;
  found: boolean;
  source: string;
  candidates: string[];
  workspaceRoot: string | null;
  traceLogPath: string;
  cwd: string;
  moduleDir: string;
};

const RUNTIME_ENTRY_RELATIVE_PATH = path.join("src", "bootstrap-entry.ts");
const RUNTIME_ROOT_RELATIVE_PATH = path.join("packages", "runtime");
const TRACE_LOG_RELATIVE_PATH = path.join(
  "apps",
  "shell",
  "logs",
  "runtime-bridge.log",
);

function normalizePath(value: string) {
  return path.resolve(value.trim()).normalize("NFC");
}

function compactUnique(paths: Array<string | null | undefined>) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of paths) {
    if (!item?.trim()) {
      continue;
    }

    const normalized = normalizePath(item);
    const key = process.platform === "win32" ? normalized.toLowerCase() : normalized;

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(normalized);
  }

  return result;
}

function getStartDirectories() {
  return compactUnique([
    process.env.FPTCLAW_WORKSPACE_ROOT,
    process.env.INIT_CWD,
    process.cwd(),
    import.meta.dir,
  ]);
}

function findWorkspaceRootFrom(startDirectory: string) {
  let current = normalizePath(startDirectory);

  for (;;) {
    const runtimeEntry = path.join(
      current,
      RUNTIME_ROOT_RELATIVE_PATH,
      RUNTIME_ENTRY_RELATIVE_PATH,
    );

    if (existsSync(runtimeEntry)) {
      return current;
    }

    const parent = path.dirname(current);

    if (parent === current) {
      return null;
    }

    current = parent;
  }
}

function findWorkspaceRoot() {
  for (const directory of getStartDirectories()) {
    const root = findWorkspaceRootFrom(directory);

    if (root) {
      return root;
    }
  }

  return null;
}

export function getRuntimeEntry(runtimeRoot: string) {
  return path.join(runtimeRoot, RUNTIME_ENTRY_RELATIVE_PATH);
}

export function getRuntimeTraceLogPath() {
  const override = process.env.FPTCLAW_RUNTIME_TRACE_FILE?.trim();

  if (override) {
    return normalizePath(override);
  }

  const workspaceRoot = findWorkspaceRoot();

  if (workspaceRoot) {
    return path.join(workspaceRoot, TRACE_LOG_RELATIVE_PATH);
  }

  return path.join(tmpdir(), "fptclaw-runtime-bridge.log");
}

export function resolveRuntimeRoot(): RuntimeRootResolution {
  const workspaceRoot = findWorkspaceRoot();
  const starts = getStartDirectories();
  const ancestorCandidates = starts
    .map(findWorkspaceRootFrom)
    .filter((item): item is string => Boolean(item))
    .map((root) => path.join(root, RUNTIME_ROOT_RELATIVE_PATH));
  const candidates = compactUnique([
    process.env.FPTCLAW_RUNTIME_ROOT,
    workspaceRoot ? path.join(workspaceRoot, RUNTIME_ROOT_RELATIVE_PATH) : null,
    ...ancestorCandidates,
    path.resolve(process.cwd(), RUNTIME_ROOT_RELATIVE_PATH),
    path.resolve(process.cwd(), "../../packages/runtime"),
    path.resolve(import.meta.dir, "../../../../packages/runtime"),
    path.resolve(import.meta.dir, "../../packages/runtime"),
  ]);

  for (const candidate of candidates) {
    const runtimeEntry = getRuntimeEntry(candidate);

    if (existsSync(runtimeEntry)) {
      return {
        runtimeRoot: candidate,
        runtimeEntry,
        found: true,
        source:
          process.env.FPTCLAW_RUNTIME_ROOT &&
          normalizePath(process.env.FPTCLAW_RUNTIME_ROOT) === candidate
            ? "FPTCLAW_RUNTIME_ROOT"
            : "ancestor-search",
        candidates,
        workspaceRoot,
        traceLogPath: getRuntimeTraceLogPath(),
        cwd: process.cwd(),
        moduleDir: import.meta.dir,
      };
    }
  }

  const runtimeRoot =
    candidates[0] ??
    path.resolve(process.cwd(), "../../packages/runtime");

  return {
    runtimeRoot,
    runtimeEntry: getRuntimeEntry(runtimeRoot),
    found: false,
    source: "missing",
    candidates,
    workspaceRoot,
    traceLogPath: getRuntimeTraceLogPath(),
    cwd: process.cwd(),
    moduleDir: import.meta.dir,
  };
}

function serializeTraceData(data: unknown) {
  return JSON.stringify(data, (_key, value: unknown) => {
    if (value instanceof Error) {
      return {
        name: value.name,
        message: value.message,
        stack: value.stack,
      };
    }

    return value;
  });
}

export function traceRuntimeBridge(message: string, data?: unknown) {
  const traceLogPath = getRuntimeTraceLogPath();

  try {
    mkdirSync(path.dirname(traceLogPath), { recursive: true });
    appendFileSync(
      traceLogPath,
      `${serializeTraceData({
        timestamp: new Date().toISOString(),
        message,
        data,
      })}\n`,
      "utf8",
    );
  } catch {
    // Trace logging must never break the desktop runtime path.
  }
}
