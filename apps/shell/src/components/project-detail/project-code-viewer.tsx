import * as React from "react";
import { EditorState, type Extension } from "@codemirror/state";
import { EditorView } from "@codemirror/view";

type ProjectCodeViewerProps = {
  filePath: string;
  value: string;
};

const codeViewerTheme = EditorView.theme({
  "&": {
    height: "100%",
    backgroundColor: "var(--background)",
    color: "var(--foreground)",
    fontSize: "12px",
  },
  ".cm-content": {
    padding: "12px 0",
  },
  ".cm-gutters": {
    backgroundColor: "var(--muted)",
    borderRight: "1px solid var(--border)",
    color: "var(--muted-foreground)",
  },
  ".cm-line": {
    padding: "0 12px",
  },
  ".cm-scroller": {
    fontFamily:
      '"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
    overflow: "auto",
  },
  ".cm-activeLine, .cm-activeLineGutter": {
    backgroundColor: "transparent",
  },
});

async function getLanguageExtension(filePath: string): Promise<Extension> {
  const extension = filePath.split(".").pop()?.toLowerCase();

  if (extension === "ts" || extension === "tsx") {
    const { javascript } = await import("@codemirror/lang-javascript");

    return javascript({ jsx: extension === "tsx", typescript: true });
  }

  if (extension === "js" || extension === "jsx") {
    const { javascript } = await import("@codemirror/lang-javascript");

    return javascript({ jsx: extension === "jsx" });
  }

  if (extension === "css" || extension === "scss") {
    const { css } = await import("@codemirror/lang-css");

    return css();
  }

  if (extension === "html") {
    const { html } = await import("@codemirror/lang-html");

    return html();
  }

  if (extension === "json" || extension === "jsonc") {
    const { json } = await import("@codemirror/lang-json");

    return json();
  }

  if (extension === "md" || extension === "mdx") {
    const { markdown } = await import("@codemirror/lang-markdown");

    return markdown();
  }

  return [];
}

export function ProjectCodeViewer({ filePath, value }: ProjectCodeViewerProps) {
  const editorRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const editorElement = editorRef.current;

    if (!editorElement) {
      return;
    }

    const parentElement = editorElement;
    let view: EditorView | undefined;
    let isCancelled = false;

    async function mountEditor() {
      const [{ basicSetup }, languageExtension] = await Promise.all([
        import("codemirror"),
        getLanguageExtension(filePath),
      ]);

      if (isCancelled) {
        return;
      }

      view = new EditorView({
        parent: parentElement,
        state: EditorState.create({
          doc: value,
          extensions: [
            basicSetup,
            languageExtension,
            codeViewerTheme,
            EditorState.readOnly.of(true),
            EditorView.editable.of(false),
            EditorView.lineWrapping,
          ],
        }),
      });
    }

    void mountEditor();

    return () => {
      isCancelled = true;
      view?.destroy();
    };
  }, [filePath, value]);

  return (
    <div
      ref={editorRef}
      className="h-full min-h-0 overflow-hidden"
      data-testid="project-code-viewer"
    />
  );
}
