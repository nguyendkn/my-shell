// Per-tip metadata + relevance check. The runtime filters all known tips
// through isRelevant(context) and a per-id cooldown count before deciding
// which to surface. content receives the same context object so tips can
// reference signal data (file paths, command names, theme, etc.) when rendering.
export type Tip = {
  id: string;
  content: (context?: TipContext) => Promise<string> | string;
  cooldownSessions: number;
  isRelevant: (context?: TipContext) => Promise<boolean> | boolean;
};

import type { FileStateCache } from "../../utils/fileStateCache.js";

// Signal sources passed to tip relevance checks. bashTools is the set of
// command names seen in the session (used to suggest plugins matching CLI
// usage); readFileState is the read-tracking cache used by file-pattern
// signals; theme is forwarded to color() inside content() callbacks so tip
// strings render with the active theme.
import type { ThemeName } from "../../utils/theme.js";

export type TipContext = {
  bashTools?: Set<string>;
  readFileState?: FileStateCache;
  theme?: ThemeName;
};
