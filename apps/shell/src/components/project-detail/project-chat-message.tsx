import {
  CheckCircle2Icon,
  CircleDotIcon,
  FileTextIcon,
  HelpCircleIcon,
  Loader2Icon,
  MessageSquareTextIcon,
  TerminalSquareIcon,
} from "lucide-react";

import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { cn } from "@repo/ui/lib/utils";
import type { ProjectChatMessage } from "../../data/project-detail";

type ProjectChatMessageProps = {
  message: ProjectChatMessage;
};

function MessageIcon({ message }: ProjectChatMessageProps) {
  const className = "size-4";

  if (message.kind === "reasoning") {
    return message.status === "running" ? (
      <Loader2Icon className={cn(className, "animate-spin")} />
    ) : (
      <CircleDotIcon className={className} />
    );
  }

  if (message.kind === "tool") {
    return <TerminalSquareIcon className={className} />;
  }

  if (message.kind === "checkpoint") {
    return <CheckCircle2Icon className={className} />;
  }

  if (message.kind === "question") {
    return <HelpCircleIcon className={className} />;
  }

  if (message.role === "user") {
    return <MessageSquareTextIcon className={className} />;
  }

  return <FileTextIcon className={className} />;
}

function getMessageClass(message: ProjectChatMessage) {
  if (message.role === "user") {
    return "ml-auto max-w-[88%] border-primary/10 bg-primary text-primary-foreground";
  }

  if (message.kind === "tool" || message.kind === "checkpoint") {
    return "max-w-[92%] border-dashed bg-muted/50";
  }

  if (message.kind === "question") {
    return "max-w-[92%] border-amber-200 bg-amber-50 text-amber-950";
  }

  return "max-w-[92%] bg-card text-card-foreground";
}

function getFileName(path: string) {
  return path.split(/[\\/]/).pop() ?? path;
}

export function ProjectChatMessage({ message }: ProjectChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <article
      className={cn(
        "rounded-lg border p-3 shadow-xs",
        getMessageClass(message),
      )}
      data-testid="project-chat-message"
    >
      <div className="flex items-start gap-2">
        <span
          className={cn(
            "mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-md",
            isUser
              ? "bg-primary-foreground/15 text-primary-foreground"
              : "bg-muted text-muted-foreground",
          )}
        >
          <MessageIcon message={message} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {message.title && (
              <h3 className="text-sm font-semibold">{message.title}</h3>
            )}
            <span
              className={cn(
                "text-xs",
                isUser ? "text-primary-foreground/70" : "text-muted-foreground",
              )}
            >
              {message.time}
            </span>
            {message.status && (
              <Badge
                variant="outline"
                className={cn(
                  "h-5",
                  isUser &&
                    "border-primary-foreground/20 text-primary-foreground",
                )}
              >
                {message.status}
              </Badge>
            )}
          </div>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-6">
            {message.body}
          </p>
          {message.files && message.files.length > 0 && (
            <div
              className="mt-3 flex flex-wrap gap-1.5"
              data-testid="project-message-attachments"
            >
              {message.files.map((file) => (
                <span
                  key={file}
                  className={cn(
                    "inline-flex h-9 max-w-52 items-center gap-1.5 rounded-md border px-2 text-xs",
                    isUser
                      ? "border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground"
                      : "bg-background text-foreground",
                  )}
                  title={file}
                  data-testid="project-message-attachment"
                >
                  <FileTextIcon className="size-3.5 shrink-0" />
                  <span className="truncate">{getFileName(file)}</span>
                </span>
              ))}
            </div>
          )}
          {message.actions && message.actions.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {message.actions.map((action) => (
                <Button
                  key={action}
                  variant={
                    message.kind === "question" ? "outline" : "secondary"
                  }
                  size="sm"
                >
                  {action}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
