import type { BrowserHarnessMode } from "./types.js";

const TITLE_MAX_LENGTH = 120;

function compactTitlePart(value: string, fallback: string) {
  const normalized = value
    .replace(/\s+/g, " ")
    .replace(/[^\w .:@|()[\]-]+/g, "")
    .trim();

  return normalized || fallback;
}

export function createBrowserHarnessTaskId(prefix = "browser-task") {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().split("-").at(0)
      : Math.random().toString(36).slice(2, 10);

  return `${prefix}-${Date.now().toString(36)}-${random}`;
}

export function normalizeBrowserHarnessMode(
  value?: string | null,
): BrowserHarnessMode {
  if (value?.toLowerCase() === "headless") {
    return "headless";
  }

  return "headed";
}

export function buildBrowserProcessTitle({
  taskId,
  agentId,
  profileName,
  mode,
}: {
  taskId: string;
  agentId: string;
  profileName: string;
  mode: BrowserHarnessMode;
}) {
  const title = [
    "FPTClaw Browser Harness",
    compactTitlePart(profileName, "profile"),
    mode,
    taskId.slice(-8),
    agentId,
  ].join(" | ");

  return title.slice(0, TITLE_MAX_LENGTH);
}
