import * as React from "react";
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  FileJsonIcon,
  Loader2Icon,
  RefreshCcwIcon,
  SaveIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from "lucide-react";
import { EditorState, type Extension } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { toast } from "sonner";

import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import type {
  RuntimeSettingsLoadResult,
  RuntimeSettingsSource,
  RuntimeSettingsSourceId,
} from "../electrobun/settings-types";
import {
  loadRuntimeSettings,
  saveRuntimeSettings,
} from "../lib/runtime-settings";

type EditorHostElement = HTMLDivElement & {
  __runtimeSettingsEditorView?: EditorView;
};

type JsonValidationState =
  | { valid: true; message: string }
  | { valid: false; message: string };

const settingsEditorTheme = EditorView.theme({
  "&": {
    height: "100%",
    backgroundColor: "var(--background)",
    color: "var(--foreground)",
    fontSize: "12px",
  },
  ".cm-content": {
    minHeight: "100%",
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
    backgroundColor: "color-mix(in oklab, var(--muted) 48%, transparent)",
  },
  "&.cm-focused": {
    outline: "2px solid var(--ring)",
    outlineOffset: "-2px",
  },
});

function validateJsonSettings(content: string): JsonValidationState {
  try {
    const parsed: unknown = JSON.parse(content);

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {
        valid: false,
        message: "Runtime settings JSON must be an object.",
      };
    }

    return { valid: true, message: "Valid JSON" };
  } catch (error) {
    return {
      valid: false,
      message: error instanceof Error ? error.message : "Invalid JSON",
    };
  }
}

function formatTimestamp(value: string | null) {
  if (!value) {
    return "Not saved";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getSourceIcon(source: RuntimeSettingsSource) {
  if (source.id === "policySettings") {
    return <ShieldCheckIcon className="size-4" />;
  }

  return <FileJsonIcon className="size-4" />;
}

function RuntimeSettingsEditor({
  initialValue,
  readOnly,
  resetKey,
  onChange,
  onSave,
}: {
  initialValue: string;
  readOnly: boolean;
  resetKey: string;
  onChange: (value: string) => void;
  onSave: () => void;
}) {
  const editorRef = React.useRef<EditorHostElement>(null);
  const initialValueRef = React.useRef(initialValue);
  const onChangeRef = React.useRef(onChange);
  const onSaveRef = React.useRef(onSave);

  initialValueRef.current = initialValue;

  React.useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  React.useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  React.useEffect(() => {
    const editorElement = editorRef.current;

    if (!editorElement) {
      return;
    }

    const editorHost: EditorHostElement = editorElement;

    let view: EditorView | undefined;
    let isCancelled = false;

    async function mountEditor() {
      const [{ basicSetup }, { json }] = await Promise.all([
        import("codemirror"),
        import("@codemirror/lang-json"),
      ]);

      if (isCancelled) {
        return;
      }

      const extensions: Extension[] = [
        basicSetup,
        json(),
        settingsEditorTheme,
        EditorView.lineWrapping,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChangeRef.current(update.state.doc.toString());
          }
        }),
        EditorView.domEventHandlers({
          keydown(event) {
            if (
              (event.ctrlKey || event.metaKey) &&
              event.key.toLowerCase() === "s"
            ) {
              event.preventDefault();
              onSaveRef.current();
            }
          },
        }),
      ];

      if (readOnly) {
        extensions.push(
          EditorState.readOnly.of(true),
          EditorView.editable.of(false),
        );
      }

      view = new EditorView({
        parent: editorHost,
        state: EditorState.create({
          doc: initialValueRef.current,
          extensions,
        }),
      });
      editorHost.__runtimeSettingsEditorView = view;
    }

    void mountEditor();

    return () => {
      isCancelled = true;
      delete editorHost.__runtimeSettingsEditorView;
      view?.destroy();
    };
  }, [readOnly, resetKey]);

  return (
    <div
      ref={editorRef}
      className="h-full min-h-[420px] overflow-hidden rounded-lg border bg-background"
      data-testid="runtime-settings-editor"
    />
  );
}

function SourceButton({
  source,
  isSelected,
  onSelect,
}: {
  source: RuntimeSettingsSource;
  isSelected: boolean;
  onSelect: (sourceId: RuntimeSettingsSourceId) => void;
}) {
  return (
    <button
      type="button"
      className={[
        "flex w-full min-w-0 items-start gap-3 rounded-lg border p-3 text-left transition-colors",
        isSelected
          ? "border-ring bg-muted"
          : "border-border bg-background hover:bg-muted/60",
      ].join(" ")}
      aria-pressed={isSelected}
      onClick={() => onSelect(source.id)}
      data-testid={`runtime-settings-source-${source.id}`}
    >
      <span className="mt-0.5 text-muted-foreground">{getSourceIcon(source)}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{source.label}</span>
        <span className="mt-1 block truncate text-xs text-muted-foreground">
          {source.scope}
        </span>
      </span>
      <Badge variant={source.exists ? "outline" : "secondary"} className="shrink-0">
        {source.exists ? "File" : "New"}
      </Badge>
    </button>
  );
}

export default function SettingsPage() {
  const [selectedSourceId, setSelectedSourceId] =
    React.useState<RuntimeSettingsSourceId>("localSettings");
  const [settings, setSettings] = React.useState<RuntimeSettingsLoadResult | null>(
    null,
  );
  const [content, setContent] = React.useState("");
  const [savedContent, setSavedContent] = React.useState("");
  const [editorVersion, setEditorVersion] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saveState, setSaveState] = React.useState("Loaded");

  const selectedSource = settings?.sources.find(
    (source) => source.id === selectedSourceId,
  );
  const validationState = React.useMemo(
    () => validateJsonSettings(content),
    [content],
  );
  const isDirty = content !== savedContent;
  const canSave =
    Boolean(selectedSource?.editable) &&
    isDirty &&
    validationState.valid &&
    !isLoading &&
    !isSaving;

  const loadSource = React.useCallback(
    async (sourceId: RuntimeSettingsSourceId) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await loadRuntimeSettings({ sourceId });

        setSettings(result);
        setSelectedSourceId(result.sourceId);
        setContent(result.content);
        setSavedContent(result.content);
        setEditorVersion((version) => version + 1);
        setSaveState(result.error ? "Read warning" : "Loaded");

        if (result.error) {
          setError(result.error);
        }
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load runtime settings.",
        );
        setSaveState("Load failed");
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  React.useEffect(() => {
    void loadSource(selectedSourceId);
  }, [loadSource, selectedSourceId]);

  function handleSourceSelect(sourceId: RuntimeSettingsSourceId) {
    if (sourceId === selectedSourceId) {
      return;
    }

    if (isDirty && !window.confirm("Discard unsaved settings changes?")) {
      return;
    }

    setSelectedSourceId(sourceId);
  }

  async function handleSave() {
    if (!selectedSource || !canSave) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const result = await saveRuntimeSettings({
        sourceId: selectedSource.id,
        content,
      });

      if (!result.ok) {
        const message = result.error ?? "Unable to save runtime settings.";

        setError(message);
        setSaveState("Save failed");
        toast.error(message);
        return;
      }

      const nextContent = result.content ?? content;
      const updatedAt = result.updatedAt ?? new Date().toISOString();

      setContent(nextContent);
      setSavedContent(nextContent);
      setEditorVersion((version) => version + 1);
      setSaveState("Saved");
      setSettings((current) =>
        current
          ? {
              ...current,
              content: nextContent,
              exists: true,
              updatedAt,
              sources: current.sources.map((source) =>
                source.id === selectedSource.id
                  ? { ...source, exists: true }
                  : source,
              ),
            }
          : current,
      );
      toast.success("Runtime settings saved");
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : "Unable to save runtime settings.";

      setError(message);
      setSaveState("Save failed");
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  }

  function handleEnsureSchema() {
    try {
      const parsed = JSON.parse(content || "{}") as Record<string, unknown>;
      const nextContent = `${JSON.stringify(
        {
          $schema: settings?.schemaUrl,
          ...parsed,
        },
        null,
        2,
      )}\n`;

      setContent(nextContent);
      setEditorVersion((version) => version + 1);
      setSaveState("Edited");
    } catch {
      setError("Fix JSON syntax before applying the schema field.");
    }
  }

  function handleEditorChange(nextContent: string) {
    setContent(nextContent);
    setSaveState(nextContent === savedContent ? "Loaded" : "Edited");
  }

  return (
    <div
      className="flex min-h-0 flex-1 flex-col gap-4 p-4 lg:p-6"
      data-testid="settings-page"
    >
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h1 className="truncate text-lg font-semibold">Runtime Settings</h1>
            <Badge variant="outline">{settings?.runtimeVersion ?? "runtime"}</Badge>
          </div>
          <p className="mt-1 max-w-3xl truncate text-sm text-muted-foreground">
            {settings?.runtimeRoot ?? "Loading runtime package..."}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void loadSource(selectedSourceId)}
            disabled={isLoading || isSaving}
            data-testid="runtime-settings-reload"
          >
            <RefreshCcwIcon />
            Reload
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleEnsureSchema}
            disabled={isLoading || isSaving || !selectedSource?.editable}
            data-testid="runtime-settings-ensure-schema"
          >
            <SparklesIcon />
            Schema
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => void handleSave()}
            disabled={!canSave}
            data-testid="runtime-settings-save"
          >
            {isSaving ? <Loader2Icon className="animate-spin" /> : <SaveIcon />}
            Save
          </Button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="min-w-0 space-y-2">
          {settings?.sources.map((source) => (
            <SourceButton
              key={source.id}
              source={source}
              isSelected={source.id === selectedSourceId}
              onSelect={handleSourceSelect}
            />
          ))}
        </aside>

        <section className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border bg-card">
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 border-b px-3 py-2">
            <div className="min-w-0">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <span className="text-sm font-medium">
                  {selectedSource?.label ?? "Runtime settings"}
                </span>
                <Badge variant={selectedSource?.editable ? "outline" : "secondary"}>
                  {selectedSource?.editable ? "Writable" : "Read-only"}
                </Badge>
                <Badge
                  variant={validationState.valid ? "outline" : "destructive"}
                  data-testid="runtime-settings-json-state"
                >
                  {validationState.valid ? "Valid" : "Invalid"}
                </Badge>
              </div>
              <p
                className="mt-1 truncate text-xs text-muted-foreground"
                data-testid="runtime-settings-source-path"
              >
                {selectedSource?.path ?? ""}
              </p>
            </div>
            <div
              className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground"
              data-testid="runtime-settings-save-state"
            >
              {validationState.valid ? (
                <CheckCircle2Icon className="size-4 text-emerald-600" />
              ) : (
                <AlertTriangleIcon className="size-4 text-destructive" />
              )}
              <span>{saveState}</span>
              <span className="hidden sm:inline">·</span>
              <span className="hidden sm:inline">
                {formatTimestamp(settings?.updatedAt ?? null)}
              </span>
            </div>
          </div>

          {error || !validationState.valid ? (
            <div
              className="border-b bg-muted/40 px-3 py-2 text-sm text-muted-foreground"
              data-testid="runtime-settings-error"
            >
              {error ?? validationState.message}
            </div>
          ) : null}

          <div className="min-h-0 flex-1 p-3">
            {isLoading ? (
              <div className="flex h-full min-h-[420px] items-center justify-center rounded-lg border bg-background text-sm text-muted-foreground">
                <Loader2Icon className="mr-2 size-4 animate-spin" />
                Loading runtime settings...
              </div>
            ) : (
              <RuntimeSettingsEditor
                initialValue={content}
                readOnly={!selectedSource?.editable}
                resetKey={`${selectedSourceId}:${editorVersion}`}
                onChange={handleEditorChange}
                onSave={handleSave}
              />
            )}
          </div>

          <div className="flex min-w-0 items-center gap-2 border-t px-3 py-2 text-xs text-muted-foreground">
            <span className="shrink-0">Schema</span>
            <span className="truncate" data-testid="runtime-settings-schema-url">
              {settings?.schemaUrl ?? ""}
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}
