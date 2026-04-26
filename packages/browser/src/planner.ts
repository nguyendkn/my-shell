import type { BrowserHarnessGoal, BrowserHarnessMode } from "./types.js";

const DEFAULT_ENDPOINT =
  "Lead validates every browser process title and worker report.";

const BROWSER_HARNESS_PATTERN =
  /\b(browser\s+profiles?|browser\s+harness|local\s+agi|hermes|agent\s+per\s+browser|headless|headed|chrome-cdp|camoufox)\b/i;

function clampProfileCount(value: number) {
  if (!Number.isFinite(value)) {
    return 1;
  }

  return Math.min(Math.max(Math.round(value), 1), 4);
}

function detectProfileCount(prompt: string) {
  const numeric = prompt.match(
    /(?:open|mở|start|launch|spawn|chạy)?\s*(\d{1,2})\s*(?:browser|profiles?|profile|agents?|lanes?|cửa\s*sổ)/i,
  );

  if (numeric?.[1]) {
    return clampProfileCount(Number(numeric[1]));
  }

  if (/\b(two|couple|pair|hai|nhiều|multiple)\b/i.test(prompt)) {
    return 2;
  }

  return 1;
}

function detectMode(prompt: string): BrowserHarnessMode {
  if (/\bheadless\s*[:=]\s*(false|0|off|no)\b/i.test(prompt)) {
    return "headed";
  }

  if (/\b(headed|headless\s*[:=]\s*(true|1|on|yes))\b/i.test(prompt)) {
    return /\bheaded\b/i.test(prompt) ? "headed" : "headless";
  }

  if (/\b(headless|ẩn|không\s+mở\s+cửa\s*sổ)\b/i.test(prompt)) {
    return "headless";
  }

  return "headed";
}

function detectStartPoint(prompt: string) {
  const url = prompt.match(/https?:\/\/[^\s"'<>]+/i)?.[0];

  if (url) {
    return url.replace(/[),.;]+$/, "");
  }

  const startLabel = prompt.match(
    /(?:start(?:ing)?\s*(?:point|url)?|start\s+at|bắt\s*đầu|điểm\s*đầu)\s*[:=]?\s*([^.\n]+)/i,
  )?.[1];

  return startLabel?.trim() || "about:blank";
}

function detectEndpoint(prompt: string) {
  const endpoint = prompt.match(
    /(?:endpoint|end\s*point|until|validate|kết\s*thúc|điểm\s*cuối|xác\s*thực)\s*[:=]?\s*([^.\n]+)/i,
  )?.[1];

  return endpoint?.trim() || DEFAULT_ENDPOINT;
}

function detectProfileRefs(prompt: string) {
  const refs = new Set<string>();
  const pattern = /(?:profile|browser-profile|lane)[:#]([a-z0-9_-]+)/gi;

  for (const match of prompt.matchAll(pattern)) {
    if (match[1]) {
      refs.add(match[1]);
    }
  }

  return Array.from(refs);
}

function summarizeGoal(prompt: string) {
  const normalized = prompt.replace(/\s+/g, " ").trim();

  if (!normalized) {
    return "Run a browser harness task.";
  }

  return normalized.length > 180
    ? `${normalized.slice(0, 177).trim()}...`
    : normalized;
}

export function isBrowserHarnessPrompt(prompt: string) {
  return BROWSER_HARNESS_PATTERN.test(prompt);
}

export function parseBrowserHarnessPrompt(prompt: string): BrowserHarnessGoal {
  return {
    prompt,
    goal: summarizeGoal(prompt),
    startPoint: detectStartPoint(prompt),
    endpoint: detectEndpoint(prompt),
    mode: detectMode(prompt),
    requestedProfileCount: detectProfileCount(prompt),
    requestedProfileRefs: detectProfileRefs(prompt),
  };
}
