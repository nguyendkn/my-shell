# AGENTS.md

This repository is the OpenCode port of the vibe-cokit Claude Code kit.

- `.opencode/agents/` contains the custom OpenCode subagents.
- `opencode.jsonc` contains the command registry and project OpenCode settings.
- `docs/opencode/` replaces the old `.claude/workflows/` references.

Follow YAGNI, KISS, and DRY. Prefer the `/vk:*` commands for the ported vibe-cokit workflows. Check skills in `.opencode/skills/*/SKILL.md`, then `~/.config/opencode/skills/*/SKILL.md`, then Claude-compatible fallback locations.

For application-facing work, treat UI/UX optimization as a first-class requirement. Always analyze the experience from multiple perspectives: user goals, task flow, information architecture, visual hierarchy, accessibility, responsive behavior, loading/empty/error states, performance, and product context.

## Shell App Testing

`apps/shell` is an Electrobun desktop application. When testing shell app changes, always verify with desktop mode by running `bun run --cwd apps/shell cy:run:desktop`. Treat web-mode Cypress (`cy:run` against Vite) as supplemental only for narrow browser DOM/layout checks or when explicitly requested; it must not replace desktop-mode verification for shell app behavior.

Native and OS-facing flows such as folder selection, filesystem access, clipboard, dialogs, terminal/process behavior, and Electrobun RPC must be tested through the desktop-mode harness because web mode cannot validate the actual desktop runtime.

Before solving repeatable development issues, check `docs/project/lesson-learn.md` for prior successful cases. After resolving a hard-won reusable case, update that file automatically with a compact lesson: signal, cause, fix, verification commands, and the rule future agents should remember.

## Lesson Learn Compaction

When `docs/project/lesson-learn.md` grows beyond roughly 30k context length, compact it before adding more lessons. Measure with `(Get-Content docs/project/lesson-learn.md -Raw).Length` or an equivalent character-count command when the file looks large. Compaction must preserve all verified content: do not delete unique signals, causes, fixes, verification commands, file paths, environment variables, error strings, edge cases, or remember rules.

Prefer lossless restructuring over summarizing away details. Group lessons by date and theme, merge duplicated causes/fixes, move repeated verification commands into shared bullets when they are identical, and tighten prose while keeping every reusable fact. If a lesson has a unique command, path, edge case, or rule, it must remain present after compaction.

Keep lessons optimized for agent retrieval:

- Add or preserve a short keyword line for each grouped lesson when useful, including exact tool names, package names, file paths, env vars, command names, and error fragments agents are likely to `rg`.
- Keep the newest and highest-risk lessons in full detail near the top. Older lessons may be compressed more aggressively, but only by deduplicating repeated prose and commands.
- Prefer stable headings like `YYYY-MM-DD - Theme` so agents can scan chronologically and compare related cases.
- Preserve exact command strings and error text. These are retrieval anchors, not prose decoration.
- Do not compact speculative notes into verified lessons. If a fact was not verified, keep it out or mark it explicitly as unverified.

If the file cannot stay under the threshold without losing detail, split losslessly: move older full-detail lessons into date or month archives under `docs/project/lesson-learn-archive/`, keep a concise index and the most recent/high-value lessons in `lesson-learn.md`, and link every archived group from the main file. The archive must receive the full content before the main file is shortened.

After compacting, run a self-audit before continuing:

- Compare lesson count/headings before and after.
- Search the compacted file and any archive for important commands, env vars, file paths, and error strings from the original.
- Review `git diff` to confirm deleted lines were either merged, moved to archive, or represented by an equivalent retained fact.
- Keep the file easy to scan: date-grouped sections, short lesson titles, concise `Signal / Cause / Fix / Verify / Remember` fields, and no speculative or unverified notes.
