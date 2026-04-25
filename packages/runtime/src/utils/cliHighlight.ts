// highlight.js's type defs carry `/// <reference lib="dom" />`. SSETransport,
// mcp/client, ssh, dumpPrompts use DOM types (TextDecodeOptions, RequestInfo)
// that only typecheck because this file's `typeof import('highlight.js')` pulls
// lib.dom in. tsconfig has lib: ["ESNext"] only — fixing the actual DOM-type
// deps is a separate sweep; this ref preserves the status quo.
/// <reference lib="dom" />

import { extname } from "path";

// cli-highlight v3+ doesn't re-export highlight/supportsLanguage from the
// module root; we discover them via the dynamic import below and pass them
// through. Loosely typed because the underlying lib's d.ts changes between
// versions; consumers only need `(text, options) => string` for highlight
// and a `(name) => boolean` for supportsLanguage.
export type CliHighlight = {
  highlight: (text: string, options?: { language?: string }) => string;
  supportsLanguage: (name: string) => boolean;
};

// One promise shared by Fallback.tsx, markdown.ts, events.ts, getLanguageName.
// The highlight.js import piggybacks: cli-highlight has already pulled it into
// the module cache, so the second import() is a cache hit — no extra bytes
// faulted in.
let cliHighlightPromise: Promise<CliHighlight | null> | undefined;

// highlight.js's getLanguage isn't on the default export in v11; the
// dynamic import resolves to a namespace where the symbol may live on
// `default` or top-level depending on the bundler. Cast at the boundary.
let loadedGetLanguage: ((name: string) => { name?: string } | undefined) | undefined;

async function loadCliHighlight(): Promise<CliHighlight | null> {
  try {
    const cliHighlight = (await import("cli-highlight")) as unknown as {
      highlight: CliHighlight["highlight"];
      supportsLanguage: CliHighlight["supportsLanguage"];
      default?: {
        highlight?: CliHighlight["highlight"];
        supportsLanguage?: CliHighlight["supportsLanguage"];
      };
    };
    // cache hit — cli-highlight already loaded highlight.js
    const highlightJs = (await import("highlight.js")) as unknown as {
      getLanguage?: typeof loadedGetLanguage;
      default?: { getLanguage?: typeof loadedGetLanguage };
    };
    loadedGetLanguage = highlightJs.getLanguage ?? highlightJs.default?.getLanguage;
    const highlight = cliHighlight.highlight ?? cliHighlight.default?.highlight;
    const supportsLanguage =
      cliHighlight.supportsLanguage ?? cliHighlight.default?.supportsLanguage;
    if (!highlight || !supportsLanguage) return null;
    return { highlight, supportsLanguage };
  } catch {
    return null;
  }
}

export function getCliHighlightPromise(): Promise<CliHighlight | null> {
  cliHighlightPromise ??= loadCliHighlight();
  return cliHighlightPromise;
}

/**
 * eg. "foo/bar.ts" → "TypeScript". Awaits the shared cli-highlight load,
 * then reads highlight.js's language registry. All callers are telemetry
 * (OTel counter attributes, permission-dialog unary events) — none block
 * on this, they fire-and-forget or the consumer already handles Promise<string>.
 */
export async function getLanguageName(file_path: string): Promise<string> {
  await getCliHighlightPromise();
  const ext = extname(file_path).slice(1);
  if (!ext) return "unknown";
  return loadedGetLanguage?.(ext)?.name ?? "unknown";
}
