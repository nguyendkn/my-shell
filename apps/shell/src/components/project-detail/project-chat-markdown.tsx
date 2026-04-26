import * as React from "react";
import { CheckIcon, CopyIcon } from "lucide-react";
import { marked, type Token, type Tokens } from "marked";

import { Button } from "@repo/ui/components/button";
import { cn } from "@repo/ui/lib/utils";

type ProjectChatMarkdownTone = "assistant" | "system" | "user";

type ProjectChatMarkdownProps = {
  children: string;
  streaming?: boolean;
  tone?: ProjectChatMarkdownTone;
};

type InlineToken = {
  depth?: number;
  href?: string;
  items?: unknown[];
  lang?: string;
  ordered?: boolean;
  raw?: string;
  start?: number;
  text?: string;
  title?: string | null;
  tokens?: unknown[];
  type: string;
};

type HighlightResult = {
  html: string;
  language: string;
};

type ChatHighlighter = {
  highlight: (code: string, language?: string) => HighlightResult;
};

const TOKEN_CACHE_MAX = 300;
const tokenCache = new Map<string, Token[]>();
const MD_SYNTAX_RE = /[#*`|[>\-_~]|\n\n|^\d+\. |\n\d+\. /;
const LANGUAGE_LABELS: Record<string, string> = {
  bash: "Bash",
  css: "CSS",
  diff: "Diff",
  html: "HTML",
  javascript: "JavaScript",
  json: "JSON",
  markdown: "Markdown",
  plaintext: "Plain text",
  powershell: "PowerShell",
  python: "Python",
  sql: "SQL",
  typescript: "TypeScript",
  xml: "XML",
  yaml: "YAML",
};

const LANGUAGE_ALIASES: Record<string, string> = {
  cjs: "javascript",
  htm: "xml",
  html: "xml",
  js: "javascript",
  jsx: "javascript",
  md: "markdown",
  mjs: "javascript",
  ps1: "powershell",
  py: "python",
  shell: "bash",
  sh: "bash",
  ts: "typescript",
  tsx: "typescript",
  yml: "yaml",
};

let markedConfigured = false;
let highlighterPromise: Promise<ChatHighlighter | null> | undefined;

function configureMarked() {
  if (markedConfigured) {
    return;
  }

  markedConfigured = true;
  marked.use({
    gfm: true,
    tokenizer: {
      del() {
        return undefined;
      },
    },
  });
}

function hasMarkdownSyntax(content: string) {
  return MD_SYNTAX_RE.test(content.length > 500 ? content.slice(0, 500) : content);
}

function hashContent(content: string) {
  let hash = 5381;

  for (let index = 0; index < content.length; index += 1) {
    hash = (hash * 33) ^ content.charCodeAt(index);
  }

  return `${content.length}:${hash >>> 0}`;
}

function lexMarkdown(content: string) {
  configureMarked();

  if (!hasMarkdownSyntax(content)) {
    return [
      {
        type: "paragraph",
        raw: content,
        text: content,
        tokens: [
          {
            type: "text",
            raw: content,
            text: content,
          },
        ],
      } as Token,
    ];
  }

  const key = hashContent(content);
  const hit = tokenCache.get(key);

  if (hit) {
    tokenCache.delete(key);
    tokenCache.set(key, hit);
    return hit;
  }

  const tokens = marked.lexer(content);

  if (tokenCache.size >= TOKEN_CACHE_MAX) {
    const firstKey = tokenCache.keys().next().value;

    if (firstKey) {
      tokenCache.delete(firstKey);
    }
  }

  tokenCache.set(key, tokens);

  return tokens;
}

function normalizeLanguage(language?: string) {
  const normalized = language?.trim().toLowerCase().replace(/^\./, "");

  if (!normalized) {
    return "plaintext";
  }

  return LANGUAGE_ALIASES[normalized] ?? normalized;
}

function getLanguageLabel(language?: string) {
  const raw = language?.trim().toLowerCase().replace(/^\./, "");

  if (raw && LANGUAGE_LABELS[raw]) {
    return LANGUAGE_LABELS[raw];
  }

  const normalized = normalizeLanguage(language);

  return LANGUAGE_LABELS[normalized] ?? normalized.toUpperCase();
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function loadHighlighter(): Promise<ChatHighlighter | null> {
  try {
    const [
      highlightJs,
      bash,
      css,
      diff,
      javascript,
      json,
      markdown,
      powershell,
      python,
      sql,
      typescript,
      xml,
      yaml,
    ] = await Promise.all([
      import("highlight.js/lib/core"),
      import("highlight.js/lib/languages/bash"),
      import("highlight.js/lib/languages/css"),
      import("highlight.js/lib/languages/diff"),
      import("highlight.js/lib/languages/javascript"),
      import("highlight.js/lib/languages/json"),
      import("highlight.js/lib/languages/markdown"),
      import("highlight.js/lib/languages/powershell"),
      import("highlight.js/lib/languages/python"),
      import("highlight.js/lib/languages/sql"),
      import("highlight.js/lib/languages/typescript"),
      import("highlight.js/lib/languages/xml"),
      import("highlight.js/lib/languages/yaml"),
    ]);
    const hljs = highlightJs.default;

    hljs.registerLanguage("bash", bash.default);
    hljs.registerLanguage("css", css.default);
    hljs.registerLanguage("diff", diff.default);
    hljs.registerLanguage("javascript", javascript.default);
    hljs.registerLanguage("json", json.default);
    hljs.registerLanguage("markdown", markdown.default);
    hljs.registerLanguage("powershell", powershell.default);
    hljs.registerLanguage("python", python.default);
    hljs.registerLanguage("sql", sql.default);
    hljs.registerLanguage("typescript", typescript.default);
    hljs.registerLanguage("xml", xml.default);
    hljs.registerLanguage("yaml", yaml.default);

    return {
      highlight(code, language) {
        const normalized = normalizeLanguage(language);

        if (normalized !== "plaintext" && hljs.getLanguage(normalized)) {
          return {
            html: hljs.highlight(code, {
              language: normalized,
              ignoreIllegals: true,
            }).value,
            language: normalized,
          };
        }

        const auto = hljs.highlightAuto(code, [
          "bash",
          "css",
          "diff",
          "javascript",
          "json",
          "markdown",
          "powershell",
          "python",
          "sql",
          "typescript",
          "xml",
          "yaml",
        ]);

        return {
          html: auto.value || escapeHtml(code),
          language: auto.language ?? "plaintext",
        };
      },
    };
  } catch {
    return null;
  }
}

function getHighlighterPromise() {
  highlighterPromise ??= loadHighlighter();

  return highlighterPromise;
}

function safeHref(href?: string) {
  if (!href) {
    return undefined;
  }

  if (href.startsWith("#") || href.startsWith("/")) {
    return href;
  }

  try {
    const parsed = new URL(href);

    if (["http:", "https:", "mailto:"].includes(parsed.protocol)) {
      return href;
    }
  } catch {
    return undefined;
  }

  return undefined;
}

function isInlineToken(value: unknown): value is InlineToken {
  return value !== null && typeof value === "object" && "type" in value;
}

function getInlineTokens(token: InlineToken) {
  return Array.isArray(token.tokens) ? token.tokens.filter(isInlineToken) : [];
}

function renderInlineTokens(
  tokens: InlineToken[] | undefined,
  fallback: string | undefined,
  keyPrefix: string,
  tone: ProjectChatMarkdownTone,
): React.ReactNode {
  if (!tokens || tokens.length === 0) {
    return fallback;
  }

  return tokens.map((token, index) =>
    renderInlineToken(token, `${keyPrefix}-${index}`, tone),
  );
}

function renderInlineToken(
  token: InlineToken,
  key: string,
  tone: ProjectChatMarkdownTone,
): React.ReactNode {
  switch (token.type) {
    case "strong":
      return (
        <strong key={key} className="font-semibold">
          {renderInlineTokens(getInlineTokens(token), token.text, key, tone)}
        </strong>
      );
    case "em":
      return (
        <em key={key}>
          {renderInlineTokens(getInlineTokens(token), token.text, key, tone)}
        </em>
      );
    case "codespan":
      return (
        <code
          key={key}
          className={cn(
            "rounded px-1 py-0.5 font-mono text-[0.9em]",
            tone === "user"
              ? "bg-primary-foreground/15 text-primary-foreground"
              : "bg-muted text-foreground",
          )}
        >
          {token.text}
        </code>
      );
    case "br":
      return <br key={key} />;
    case "link": {
      const href = safeHref(token.href);

      if (!href) {
        return (
          <span key={key}>
            {renderInlineTokens(getInlineTokens(token), token.text, key, tone)}
          </span>
        );
      }

      return (
        <a
          key={key}
          href={href}
          rel="noreferrer"
          target={href.startsWith("#") || href.startsWith("/") ? undefined : "_blank"}
          className={cn(
            "underline underline-offset-2",
            tone === "user"
              ? "text-primary-foreground"
              : "text-primary hover:text-primary/85",
          )}
          title={token.title ?? undefined}
        >
          {renderInlineTokens(getInlineTokens(token), token.text, key, tone)}
        </a>
      );
    }
    case "del":
      return <span key={key}>{token.text}</span>;
    case "escape":
    case "html":
    case "text":
    default:
      return (
        <React.Fragment key={key}>
          {renderInlineTokens(getInlineTokens(token), token.text ?? token.raw, key, tone)}
        </React.Fragment>
      );
  }
}

function CodeBlock({
  code,
  language,
}: {
  code: string;
  language?: string;
}) {
  const [highlight, setHighlight] = React.useState<HighlightResult>({
    html: escapeHtml(code),
    language: normalizeLanguage(language),
  });
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    let active = true;

    setHighlight({
      html: escapeHtml(code),
      language: normalizeLanguage(language),
    });

    void getHighlighterPromise().then((highlighter) => {
      if (!active || !highlighter) {
        return;
      }

      setHighlight(highlighter.highlight(code, language));
    });

    return () => {
      active = false;
    };
  }, [code, language]);

  React.useEffect(() => {
    if (!copied) {
      return;
    }

    const timeout = window.setTimeout(() => setCopied(false), 1_200);

    return () => window.clearTimeout(timeout);
  }, [copied]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div
      className="my-3 max-w-full overflow-hidden rounded-md border border-zinc-800 bg-zinc-950 text-zinc-50 shadow-xs"
      data-testid="project-chat-code-block"
    >
      <div className="flex h-8 items-center justify-between gap-2 border-b border-white/10 bg-zinc-900 px-3">
        <span
          className="min-w-0 truncate font-mono text-[0.7rem] uppercase tracking-normal text-zinc-400"
          data-testid="project-chat-code-language"
        >
          {language ? getLanguageLabel(language) : getLanguageLabel(highlight.language)}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="size-6 shrink-0 text-zinc-400 hover:bg-white/10 hover:text-zinc-50"
          title={copied ? "Copied" : "Copy code"}
          onClick={handleCopy}
        >
          {copied ? (
            <CheckIcon className="size-3.5" />
          ) : (
            <CopyIcon className="size-3.5" />
          )}
          <span className="sr-only">{copied ? "Copied" : "Copy code"}</span>
        </Button>
      </div>
      <pre className="max-w-full overflow-x-auto p-3 text-[0.82rem] leading-5">
        <code
          className="hljs block min-w-max font-mono"
          dangerouslySetInnerHTML={{ __html: highlight.html }}
        />
      </pre>
    </div>
  );
}

function renderListItem(
  token: InlineToken,
  index: number,
  keyPrefix: string,
  tone: ProjectChatMarkdownTone,
) {
  const childTokens = getInlineTokens(token);

  return (
    <li key={`${keyPrefix}-${index}`} className="pl-1">
      {childTokens.length > 0
        ? renderBlockTokens(childTokens, `${keyPrefix}-${index}`, tone)
        : token.text}
    </li>
  );
}

function renderTable(
  token: Tokens.Table,
  key: string,
  tone: ProjectChatMarkdownTone,
) {
  return (
    <div key={key} className="my-3 max-w-full overflow-x-auto rounded-md border">
      <table className="min-w-full border-collapse text-left text-sm">
        <thead className="bg-muted/70 text-muted-foreground">
          <tr>
            {token.header.map((cell, index) => (
              <th key={`${key}-h-${index}`} className="border-b px-3 py-2 font-medium">
                {renderInlineTokens(
                  cell.tokens as InlineToken[] | undefined,
                  cell.text,
                  `${key}-h-${index}`,
                  tone,
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {token.rows.map((row, rowIndex) => (
            <tr key={`${key}-r-${rowIndex}`} className="border-b last:border-b-0">
              {row.map((cell, cellIndex) => (
                <td key={`${key}-r-${rowIndex}-${cellIndex}`} className="px-3 py-2 align-top">
                  {renderInlineTokens(
                    cell.tokens as InlineToken[] | undefined,
                    cell.text,
                    `${key}-r-${rowIndex}-${cellIndex}`,
                    tone,
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderBlockToken(
  token: InlineToken,
  key: string,
  tone: ProjectChatMarkdownTone,
): React.ReactNode {
  switch (token.type) {
    case "blockquote":
      return (
        <blockquote
          key={key}
          className={cn(
            "my-2 border-l-2 pl-3 italic",
            tone === "user"
              ? "border-primary-foreground/35 text-primary-foreground/85"
              : "border-border text-muted-foreground",
          )}
        >
          {renderBlockTokens(getInlineTokens(token), key, tone)}
        </blockquote>
      );
    case "code":
      return <CodeBlock key={key} code={token.text ?? ""} language={token.lang} />;
    case "heading": {
      const depth = Math.min(Math.max(Number(token.depth ?? 3), 3), 4);
      const HeadingTag = `h${depth}` as "h3" | "h4";

      return (
        <HeadingTag key={key} className="mb-1 mt-3 text-sm font-semibold first:mt-0">
          {renderInlineTokens(getInlineTokens(token), token.text, key, tone)}
        </HeadingTag>
      );
    }
    case "hr":
      return <hr key={key} className="my-3 border-border" />;
    case "list": {
      const items = Array.isArray(token.items)
        ? token.items.filter(isInlineToken)
        : [];
      const ListTag = token.ordered ? "ol" : "ul";

      return (
        <ListTag
          key={key}
          start={token.ordered ? token.start : undefined}
          className={cn(
            "my-2 space-y-1 pl-5",
            token.ordered ? "list-decimal" : "list-disc",
          )}
        >
          {items.map((item, index) => renderListItem(item, index, key, tone))}
        </ListTag>
      );
    }
    case "paragraph":
      return (
        <p key={key} className="my-2 whitespace-pre-wrap break-words first:mt-0 last:mb-0">
          {renderInlineTokens(getInlineTokens(token), token.text, key, tone)}
        </p>
      );
    case "space":
      return null;
    case "table":
      return renderTable(token as unknown as Tokens.Table, key, tone);
    case "html":
      return (
        <p key={key} className="my-2 whitespace-pre-wrap break-words first:mt-0 last:mb-0">
          {token.raw ?? token.text}
        </p>
      );
    case "text":
    default:
      return (
        <p key={key} className="my-2 whitespace-pre-wrap break-words first:mt-0 last:mb-0">
          {renderInlineTokens(getInlineTokens(token), token.text, `${key}-text`, tone)}
        </p>
      );
  }
}

function renderBlockTokens(
  tokens: unknown[],
  keyPrefix: string,
  tone: ProjectChatMarkdownTone,
) {
  return tokens
    .filter(isInlineToken)
    .map((token, index) => renderBlockToken(token, `${keyPrefix}-${index}`, tone));
}

function MarkdownBody({
  content,
  tone,
}: {
  content: string;
  tone: ProjectChatMarkdownTone;
}) {
  const tokens = React.useMemo(() => lexMarkdown(content), [content]);

  return (
    <div
      className={cn(
        "project-chat-markdown min-w-0 text-sm leading-6",
        tone === "user" ? "text-primary-foreground" : "text-inherit",
      )}
      data-testid="project-chat-markdown"
    >
      {renderBlockTokens(tokens, "markdown", tone)}
    </div>
  );
}

function StreamingMarkdownBody({
  content,
  tone,
}: {
  content: string;
  tone: ProjectChatMarkdownTone;
}) {
  const stablePrefixRef = React.useRef("");
  const [stablePrefix, unstableSuffix] = React.useMemo(() => {
    configureMarked();

    if (!content.startsWith(stablePrefixRef.current)) {
      stablePrefixRef.current = "";
    }

    const boundary = stablePrefixRef.current.length;
    const tokens = marked.lexer(content.substring(boundary));
    let lastContentIndex = tokens.length - 1;

    while (
      lastContentIndex >= 0 &&
      tokens[lastContentIndex]?.type === "space"
    ) {
      lastContentIndex -= 1;
    }

    let advance = 0;

    for (let index = 0; index < lastContentIndex; index += 1) {
      advance += tokens[index]?.raw.length ?? 0;
    }

    if (advance > 0) {
      stablePrefixRef.current = content.substring(0, boundary + advance);
    }

    return [
      stablePrefixRef.current,
      content.substring(stablePrefixRef.current.length),
    ];
  }, [content]);

  return (
    <>
      {stablePrefix ? <MarkdownBody content={stablePrefix} tone={tone} /> : null}
      {unstableSuffix ? <MarkdownBody content={unstableSuffix} tone={tone} /> : null}
    </>
  );
}

export function ProjectChatMarkdown({
  children,
  streaming = false,
  tone = "assistant",
}: ProjectChatMarkdownProps) {
  if (!children.trim()) {
    return null;
  }

  return streaming ? (
    <StreamingMarkdownBody content={children} tone={tone} />
  ) : (
    <MarkdownBody content={children} tone={tone} />
  );
}
