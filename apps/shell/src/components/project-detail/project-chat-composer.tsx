import * as React from "react";
import {
  AtSignIcon,
  FileTextIcon,
  FolderIcon,
  LinkIcon,
  PaperclipIcon,
  PlusIcon,
  SendIcon,
  Settings2Icon,
  TerminalSquareIcon,
  AlertTriangleIcon,
  SquareIcon,
  XIcon,
} from "lucide-react";

import { Button } from "@repo/ui/components/button";
import { Textarea } from "@repo/ui/components/textarea";
import { ToggleGroup, ToggleGroupItem } from "@repo/ui/components/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/ui/components/tooltip";
import { cn } from "@repo/ui/lib/utils";
import type { ProjectDetail } from "../../data/project-detail";

const MAX_ATTACHMENTS = 8;

type SlashCommand = {
  name: string;
  description: string;
  section: "Cline" | "Vibe workflows";
};

type ContextOptionType = "file" | "folder" | "git" | "problems" | "url";

type ContextOption = {
  type: ContextOptionType;
  label: string;
  value?: string;
  description?: string;
  disabled?: boolean;
};

export type ProjectChatAttachment = {
  id: string;
  name: string;
  path: string;
  kind: "file" | "image";
  previewUrl?: string;
};

export type ProjectChatComposerSubmit = {
  body: string;
  attachments: ProjectChatAttachment[];
};

const slashCommands: SlashCommand[] = [
  {
    name: "vk:ask",
    description: "Answer technical and architecture questions",
    section: "Vibe workflows",
  },
  {
    name: "vk:plan",
    description: "Create an implementation plan",
    section: "Vibe workflows",
  },
  {
    name: "vk:code",
    description: "Implement an existing plan",
    section: "Vibe workflows",
  },
  {
    name: "vk:fix",
    description: "Analyze and fix a development issue",
    section: "Vibe workflows",
  },
  {
    name: "vk:fix:ui",
    description: "Debug and improve UI behavior",
    section: "Vibe workflows",
  },
  {
    name: "vk:review:codebase",
    description: "Review the current codebase",
    section: "Vibe workflows",
  },
  {
    name: "vk:scout",
    description: "Find relevant files and implementation context",
    section: "Vibe workflows",
  },
  {
    name: "newtask",
    description: "Create a new task with context from this task",
    section: "Cline",
  },
  {
    name: "deep-planning",
    description: "Create a comprehensive implementation plan",
    section: "Cline",
  },
  {
    name: "smol",
    description: "Condense the current context window",
    section: "Cline",
  },
  {
    name: "newrule",
    description: "Create a new project rule from the conversation",
    section: "Cline",
  },
  {
    name: "reportbug",
    description: "Create a GitHub issue with the current task context",
    section: "Cline",
  },
];

type ProjectChatComposerProps = {
  detail: ProjectDetail;
  mode: "Plan" | "Act";
  model: string;
  isRunning?: boolean;
  runtimeSummary?: string;
  onModeChange: (mode: "Plan" | "Act") => void;
  onSend: (message: ProjectChatComposerSubmit) => void;
  onStop?: () => void;
};

function shouldShowSlashCommandsMenu(text: string, cursorPosition: number) {
  const beforeCursor = text.slice(0, cursorPosition);
  const slashIndex = beforeCursor.lastIndexOf("/");

  if (slashIndex === -1) {
    return false;
  }

  const charBeforeSlash =
    slashIndex > 0 ? beforeCursor.charAt(slashIndex - 1) : "";

  if (slashIndex > 0 && !/\s/.test(charBeforeSlash)) {
    return false;
  }

  const textAfterSlash = beforeCursor.slice(slashIndex + 1);

  if (/\s/.test(textAfterSlash)) {
    return false;
  }

  const textBeforeCurrentSlash = text.slice(0, slashIndex);

  return !/(^|\s)\/[a-zA-Z0-9_.:@-]+\s/.test(textBeforeCurrentSlash);
}

function shouldShowContextMenu(text: string, cursorPosition: number) {
  const beforeCursor = text.slice(0, cursorPosition);
  const atIndex = beforeCursor.lastIndexOf("@");

  if (atIndex === -1) {
    return false;
  }

  const textAfterAt = beforeCursor.slice(atIndex + 1);

  return (
    !/\s/.test(textAfterAt) &&
    !textAfterAt.toLowerCase().startsWith("http") &&
    !textAfterAt.toLowerCase().startsWith("problems")
  );
}

function getSlashCommands(query: string) {
  const normalizedQuery = query.toLowerCase();

  return slashCommands.filter((command) =>
    command.name.toLowerCase().startsWith(normalizedQuery),
  );
}

function getContextOptions(
  detail: ProjectDetail,
  query: string,
): ContextOption[] {
  const liveOptions: ContextOption[] = detail.project.folderPath
    ? [
        {
          type: "folder",
          label: "Project folder",
          value: detail.project.folderPath,
          description: detail.project.folderPath,
        },
      ]
    : [];

  if (!query) {
    return liveOptions;
  }

  const normalizedQuery = query.toLowerCase();
  const matches = liveOptions.filter((option) =>
    [option.label, option.value, option.description]
      .filter(Boolean)
      .some((value) => value?.toLowerCase().includes(normalizedQuery)),
  );
  const suggestions: ContextOption[] = [];

  if (query.startsWith("http")) {
    suggestions.push({
      type: "url",
      label: query,
      value: query,
      description: "Fetch this URL as context",
    });
  }

  return [...suggestions, ...matches].slice(0, 12);
}

function insertSlashCommand(
  text: string,
  commandName: string,
  queryLength: number,
  cursorPosition: number,
) {
  const beforeCursor = text.slice(0, cursorPosition);
  const slashIndex = beforeCursor.lastIndexOf("/");
  const beforeSlash = text.substring(0, slashIndex + 1);
  const afterPartialCommand = text.substring(slashIndex + 1 + queryLength);
  const nextValue =
    beforeSlash +
    commandName +
    (afterPartialCommand.startsWith(" ")
      ? afterPartialCommand
      : ` ${afterPartialCommand}`);

  return {
    nextValue,
    nextCursorPosition: slashIndex + commandName.length + 2,
  };
}

function insertMention(
  text: string,
  value: string,
  queryLength: number,
  cursorPosition: number,
) {
  const beforeCursor = text.slice(0, cursorPosition);
  const atIndex = beforeCursor.lastIndexOf("@");
  const beforeMention = text.substring(0, atIndex + 1);
  const formattedValue = /\s/.test(value) ? `"${value}"` : value;
  const afterPartialQuery = text.substring(atIndex + 1 + queryLength);
  const nextValue =
    beforeMention +
    formattedValue +
    (afterPartialQuery.startsWith(" ")
      ? afterPartialQuery
      : ` ${afterPartialQuery}`);

  return {
    nextValue,
    nextCursorPosition: atIndex + formattedValue.length + 2,
  };
}

function getContextIcon(type: ContextOptionType) {
  if (type === "file") {
    return <FileTextIcon className="size-4" />;
  }

  if (type === "folder") {
    return <FolderIcon className="size-4" />;
  }

  if (type === "url") {
    return <LinkIcon className="size-4" />;
  }

  return <AlertTriangleIcon className="size-4" />;
}

function getFileName(path: string) {
  return path.split(/[\\/]/).pop() ?? path;
}

function makeAttachment(file: File): ProjectChatAttachment {
  const isImage = file.type.startsWith("image/");

  return {
    id: `${file.name}-${file.size}-${file.lastModified}`,
    name: file.name,
    path: file.webkitRelativePath || file.name,
    kind: isImage ? "image" : "file",
    previewUrl: isImage ? URL.createObjectURL(file) : undefined,
  };
}

export function ProjectChatComposer({
  detail,
  mode,
  model,
  isRunning = false,
  runtimeSummary,
  onModeChange,
  onSend,
  onStop,
}: ProjectChatComposerProps) {
  const [value, setValue] = React.useState("");
  const [cursorPosition, setCursorPosition] = React.useState(0);
  const [attachments, setAttachments] = React.useState<ProjectChatAttachment[]>(
    [],
  );
  const [isDraggingOver, setIsDraggingOver] = React.useState(false);
  const [showSlashMenu, setShowSlashMenu] = React.useState(false);
  const [slashQuery, setSlashQuery] = React.useState("");
  const [selectedSlashIndex, setSelectedSlashIndex] = React.useState(0);
  const [showContextMenu, setShowContextMenu] = React.useState(false);
  const [contextQuery, setContextQuery] = React.useState("");
  const [selectedContextIndex, setSelectedContextIndex] = React.useState(0);
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const attachmentsRef = React.useRef(attachments);
  const slashOptions = React.useMemo(
    () => getSlashCommands(slashQuery),
    [slashQuery],
  );
  const contextOptions = React.useMemo(
    () => getContextOptions(detail, contextQuery),
    [contextQuery, detail],
  );

  React.useEffect(() => {
    attachmentsRef.current = attachments;
  }, [attachments]);

  React.useEffect(() => {
    return () => {
      attachmentsRef.current.forEach((attachment) => {
        if (attachment.previewUrl) {
          URL.revokeObjectURL(attachment.previewUrl);
        }
      });
    };
  }, []);

  React.useEffect(() => {
    setSelectedSlashIndex((index) =>
      slashOptions.length === 0 ? 0 : Math.min(index, slashOptions.length - 1),
    );
  }, [slashOptions.length]);

  React.useEffect(() => {
    setSelectedContextIndex((index) =>
      contextOptions.length === 0
        ? 0
        : Math.min(index, contextOptions.length - 1),
    );
  }, [contextOptions.length]);

  function focusComposer(position?: number) {
    window.requestAnimationFrame(() => {
      textareaRef.current?.focus();

      if (position !== undefined) {
        textareaRef.current?.setSelectionRange(position, position);
      }
    });
  }

  function updateValue(nextValue: string, nextCursorPosition: number) {
    const shouldShowSlashMenu = shouldShowSlashCommandsMenu(
      nextValue,
      nextCursorPosition,
    );
    const shouldShowMentionMenu =
      !shouldShowSlashMenu &&
      shouldShowContextMenu(nextValue, nextCursorPosition);

    setValue(nextValue);
    setCursorPosition(nextCursorPosition);
    setShowSlashMenu(shouldShowSlashMenu);
    setShowContextMenu(shouldShowMentionMenu);

    if (shouldShowSlashMenu) {
      const beforeCursor = nextValue.slice(0, nextCursorPosition);
      const slashIndex = beforeCursor.lastIndexOf("/");

      setSlashQuery(nextValue.slice(slashIndex + 1, nextCursorPosition));
      setSelectedSlashIndex(0);
    } else {
      setSlashQuery("");
      setSelectedSlashIndex(0);
    }

    if (shouldShowMentionMenu) {
      const atIndex = nextValue.lastIndexOf("@", nextCursorPosition - 1);

      setContextQuery(nextValue.slice(atIndex + 1, nextCursorPosition));
      setSelectedContextIndex(0);
    } else {
      setContextQuery("");
      setSelectedContextIndex(0);
    }
  }

  function insertTrigger(trigger: "@" | "/") {
    const separator = value.length === 0 || /\s$/.test(value) ? "" : " ";
    const nextValue = `${value}${separator}${trigger}`;
    const nextCursorPosition = nextValue.length;

    updateValue(nextValue, nextCursorPosition);
    focusComposer(nextCursorPosition);
  }

  function submitMessage() {
    const nextValue = value.trim();

    if (!nextValue && attachments.length === 0) {
      return;
    }

    onSend({ body: nextValue, attachments });
    setValue("");
    setCursorPosition(0);
    setShowSlashMenu(false);
    setShowContextMenu(false);
    setAttachments([]);
    attachments.forEach((attachment) => {
      if (attachment.previewUrl) {
        URL.revokeObjectURL(attachment.previewUrl);
      }
    });
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (showSlashMenu) {
      if (event.key === "Escape") {
        event.preventDefault();
        setShowSlashMenu(false);
        setSlashQuery("");
        return;
      }

      if (event.key === "ArrowUp" || event.key === "ArrowDown") {
        event.preventDefault();
        setSelectedSlashIndex((index) => {
          if (slashOptions.length === 0) {
            return index;
          }

          const direction = event.key === "ArrowUp" ? -1 : 1;

          return (
            (index + direction + slashOptions.length) % slashOptions.length
          );
        });
        return;
      }

      if (
        (event.key === "Enter" || event.key === "Tab") &&
        slashOptions[selectedSlashIndex]
      ) {
        event.preventDefault();
        selectSlashCommand(slashOptions[selectedSlashIndex]);
        return;
      }
    }

    if (showContextMenu) {
      if (event.key === "Escape") {
        event.preventDefault();
        setShowContextMenu(false);
        setContextQuery("");
        return;
      }

      if (event.key === "ArrowUp" || event.key === "ArrowDown") {
        event.preventDefault();
        setSelectedContextIndex((index) => {
          if (contextOptions.length === 0) {
            return index;
          }

          const direction = event.key === "ArrowUp" ? -1 : 1;

          return (
            (index + direction + contextOptions.length) % contextOptions.length
          );
        });
        return;
      }

      if (
        (event.key === "Enter" || event.key === "Tab") &&
        contextOptions[selectedContextIndex]
      ) {
        event.preventDefault();
        selectContextOption(contextOptions[selectedContextIndex]);
        return;
      }
    }

    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      if (!isRunning) {
        submitMessage();
      }
    }
  }

  function selectSlashCommand(command: SlashCommand) {
    const { nextValue, nextCursorPosition } = insertSlashCommand(
      value,
      command.name,
      slashQuery.length,
      cursorPosition,
    );

    updateValue(nextValue, nextCursorPosition);
    setShowSlashMenu(false);
    focusComposer(nextCursorPosition);
  }

  function selectContextOption(option: ContextOption) {
    if (option.disabled) {
      return;
    }

    const { nextValue, nextCursorPosition } = insertMention(
      value,
      option.value ?? option.label,
      contextQuery.length,
      cursorPosition,
    );

    updateValue(nextValue, nextCursorPosition);
    setShowContextMenu(false);
    focusComposer(nextCursorPosition);
  }

  function addAttachments(files: File[]) {
    if (files.length === 0) {
      return;
    }

    setAttachments((currentAttachments) => {
      const availableSlots = MAX_ATTACHMENTS - currentAttachments.length;
      const nextAttachments = files
        .slice(0, Math.max(availableSlots, 0))
        .map(makeAttachment);

      return [...currentAttachments, ...nextAttachments];
    });
  }

  function removeAttachment(attachmentId: string) {
    setAttachments((currentAttachments) => {
      const attachment = currentAttachments.find(
        (item) => item.id === attachmentId,
      );

      if (attachment?.previewUrl) {
        URL.revokeObjectURL(attachment.previewUrl);
      }

      return currentAttachments.filter((item) => item.id !== attachmentId);
    });
  }

  function handleFileInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    addAttachments(Array.from(event.target.files ?? []));
    event.target.value = "";
    focusComposer();
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDraggingOver(false);
    addAttachments(Array.from(event.dataTransfer.files));
  }

  return (
    <footer
      className="sticky bottom-0 z-50 w-full max-w-[100vw] shrink-0 overflow-visible border-t bg-background p-2 sm:p-3"
      data-testid="project-chat-composer"
    >
      <div
        className="relative"
        onDragEnter={(event) => {
          event.preventDefault();
          setIsDraggingOver(true);
        }}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node)) {
            setIsDraggingOver(false);
          }
        }}
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
      >
        {showSlashMenu && (
          <div
            className="absolute bottom-[calc(100%+0.5rem)] left-0 right-0 z-50 overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md"
            data-testid="project-slash-menu"
            role="listbox"
            aria-label="Slash commands"
          >
            <div className="max-h-64 overflow-auto">
              {slashOptions.length > 0 ? (
                slashOptions.map((command, index) => (
                  <button
                    key={command.name}
                    type="button"
                    className={cn(
                      "flex w-full items-start gap-2 border-b px-3 py-2 text-left last:border-b-0",
                      index === selectedSlashIndex && "bg-muted",
                    )}
                    onClick={() => selectSlashCommand(command)}
                    onMouseDown={(event) => event.preventDefault()}
                    onMouseEnter={() => setSelectedSlashIndex(index)}
                    role="option"
                    aria-selected={index === selectedSlashIndex}
                    data-testid="project-slash-option"
                  >
                    <TerminalSquareIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        /{command.name}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                        {command.description}
                      </span>
                    </span>
                    <span className="rounded border px-1.5 py-0.5 text-[0.65rem] text-muted-foreground">
                      {command.section}
                    </span>
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  No matching commands found
                </div>
              )}
            </div>
          </div>
        )}

        {showContextMenu && (
          <div
            className="absolute bottom-[calc(100%+0.5rem)] left-0 right-0 z-50 overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md"
            data-testid="project-context-menu"
            role="listbox"
            aria-label="Context mentions"
          >
            <div className="max-h-64 overflow-auto">
              {contextOptions.length > 0 ? (
                contextOptions.map((option, index) => (
                  <button
                    key={`${option.type}-${option.value ?? option.label}`}
                    type="button"
                    className={cn(
                      "flex w-full items-start gap-2 border-b px-3 py-2 text-left last:border-b-0",
                      index === selectedContextIndex && "bg-muted",
                      option.disabled && "cursor-default opacity-60",
                    )}
                    disabled={option.disabled}
                    onClick={() => selectContextOption(option)}
                    onMouseDown={(event) => event.preventDefault()}
                    onMouseEnter={() => setSelectedContextIndex(index)}
                    role="option"
                    aria-selected={index === selectedContextIndex}
                    data-testid="project-context-option"
                  >
                    <span className="mt-0.5 shrink-0 text-muted-foreground">
                      {getContextIcon(option.type)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {option.label}
                      </span>
                      {option.description && (
                        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                          {option.description}
                        </span>
                      )}
                    </span>
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  No live context results found
                </div>
              )}
            </div>
          </div>
        )}

        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(event) =>
            updateValue(event.target.value, event.target.selectionStart)
          }
          onKeyDown={handleKeyDown}
          onClick={(event) => {
            setCursorPosition(event.currentTarget.selectionStart);
          }}
          onSelect={(event) => {
            setCursorPosition(event.currentTarget.selectionStart);
          }}
          placeholder="Ask about this project..."
          className={cn(
            "max-h-40 min-h-20 resize-none pr-12 sm:min-h-24",
            attachments.length > 0 && "pb-16",
            isDraggingOver && "outline-2 outline-dashed outline-ring",
          )}
          data-testid="project-chat-input"
        />
        {attachments.length > 0 && (
          <div
            className="absolute bottom-3 left-3 right-14 z-10 flex flex-wrap gap-1.5"
            data-testid="project-chat-attachments"
          >
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="group relative flex size-9 items-center justify-center overflow-hidden rounded-md border bg-background shadow-xs"
                title={attachment.path}
                data-testid="project-chat-attachment"
              >
                {attachment.previewUrl ? (
                  <img
                    src={attachment.previewUrl}
                    alt={attachment.name}
                    className="size-full object-cover"
                  />
                ) : (
                  <span className="flex min-w-0 flex-col items-center px-1 text-muted-foreground">
                    <FileTextIcon className="size-4 shrink-0" />
                    <span className="mt-0.5 w-full truncate text-center text-[0.55rem] leading-none">
                      {getFileName(attachment.name)}
                    </span>
                  </span>
                )}
                <button
                  type="button"
                  className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100 focus:opacity-100"
                  onClick={() => removeAttachment(attachment.id)}
                  aria-label={`Remove ${attachment.name}`}
                >
                  <XIcon className="size-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              size="icon"
              className="absolute bottom-2 right-2"
              variant={isRunning ? "secondary" : "default"}
              disabled={
                !isRunning && !value.trim() && attachments.length === 0
              }
              onClick={() => {
                if (isRunning) {
                  onStop?.();
                } else {
                  submitMessage();
                }
              }}
              data-testid="project-chat-send"
            >
              {isRunning ? <SquareIcon /> : <SendIcon />}
              <span className="sr-only">
                {isRunning ? "Stop runtime" : "Send message"}
              </span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isRunning ? "Stop runtime" : "Send message"}
          </TooltipContent>
        </Tooltip>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="sr-only"
        onChange={handleFileInputChange}
        data-testid="project-chat-file-input"
      />
      <div className="mt-2 flex min-h-8 w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full min-w-0 items-center gap-1 sm:w-auto">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => insertTrigger("@")}
                data-testid="project-chat-context-trigger"
              >
                <AtSignIcon />
                <span className="sr-only">Add context</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add context</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={attachments.length >= MAX_ATTACHMENTS}
                data-testid="project-chat-attach-trigger"
              >
                <PaperclipIcon />
                <span className="sr-only">Attach files</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Attach files</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => insertTrigger("/")}
                data-testid="project-chat-workflow-trigger"
              >
                <PlusIcon />
                <span className="sr-only">Add workflow</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add workflow</TooltipContent>
          </Tooltip>
          <div className="flex h-8 min-w-0 flex-1 items-center justify-start gap-2 rounded-md px-2 text-sm text-muted-foreground sm:max-w-48">
            <Settings2Icon />
            <span className="truncate">{model}</span>
          </div>
        </div>
        <ToggleGroup
          type="single"
          value={mode}
          onValueChange={(value) => {
            if (value === "Plan" || value === "Act") {
              onModeChange(value);
            }
          }}
          variant="outline"
          size="sm"
          spacing={0}
          className="self-end sm:self-auto"
          aria-label="Project agent mode"
        >
          <ToggleGroupItem value="Plan">Plan</ToggleGroupItem>
          <ToggleGroupItem value="Act">Act</ToggleGroupItem>
        </ToggleGroup>
      </div>
      {runtimeSummary ? (
        <div
          className="mt-1 truncate text-xs text-muted-foreground"
          data-testid="project-runtime-summary"
        >
          {runtimeSummary}
        </div>
      ) : null}
    </footer>
  );
}
