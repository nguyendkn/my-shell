/**
 * Shim for `bun:bundle` internal module.
 *
 * The original Claude Code used `bun:bundle`'s `feature()` function to evaluate
 * build-time feature flags at compile time. This enables dead-code elimination
 * so features behind a flag are completely removed from the output bundle.
 *
 * In this restored dev workspace, we don't have access to `bun:bundle`, so we
 * shim it with a function that always returns `true` (all features enabled).
 * This is safe for development — the code path will still be entered/executed
 * normally. The DCE benefit is lost, but the CLI remains fully functional.
 */

// Known feature flags used in the codebase.
// In a real build environment, these would be set by the build system.
const KNOWN_FEATURES = new Set([
  "ABLATION_BASELINE",
  "BG_SESSIONS",
  "BRIDGE_MODE",
  "BYOC_ENVIRONMENT_RUNNER",
  "CHICAGO_MCP",
  "DAEMON",
  "DUMP_SYSTEM_PROMPT",
  "SELF_HOSTED_RUNNER",
  "TEMPLATES",
  "TRANSCRIPT_CLASSIFIER",
]);

/**
 * Feature flags với implementation tồn tại trong workspace này. Chỉ những flag
 * ở đây mới return `true`. Flag khác → `false` để bypass các `require()`
 * dynamic trỏ tới file đã bị lược bỏ trong restore (vd SleepTool.js,
 * proactive.js, PushNotificationTool.js, ...).
 *
 * Khi bổ sung lại một tool/command trong source tree, thêm flag tương ứng
 * vào đây để kích hoạt code path. Đừng quay về default `true` — sẽ crash
 * bootstrap với "Cannot find module" cho các path missing.
 */
const ENABLED_FEATURES = new Set([
  "AGENT_TRIGGERS",
  "AGENT_TRIGGERS_REMOTE",
  "BRIDGE_MODE",
  "DUMP_SYSTEM_PROMPT",
  "KAIROS_BRIEF",
  "TEMPLATES",
  "TRANSCRIPT_CLASSIFIER",
]);

/** Trả về true chỉ khi flag nằm trong allowlist; các flag khác mặc định false. */
export function feature(flag: string): boolean {
  return ENABLED_FEATURES.has(flag);
}
