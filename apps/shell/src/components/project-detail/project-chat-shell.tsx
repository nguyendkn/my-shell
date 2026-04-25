import * as React from "react";

import type {
  ProjectChatMessage as ProjectChatMessageData,
  ProjectDetail,
} from "../../data/project-detail";
import {
  ProjectChatComposer,
  type ProjectChatComposerSubmit,
} from "./project-chat-composer";
import { ProjectChatMessage } from "./project-chat-message";
import { ProjectTaskHeader } from "./project-task-header";

type ProjectChatShellProps = {
  detail: ProjectDetail;
};

export function ProjectChatShell({ detail }: ProjectChatShellProps) {
  const [messages, setMessages] = React.useState(detail.messages);
  const [mode, setMode] = React.useState(detail.mode);
  const scrollerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setMessages(detail.messages);
    setMode(detail.mode);
  }, [detail]);

  React.useLayoutEffect(() => {
    const scroller = scrollerRef.current;

    if (!scroller) {
      return;
    }

    scroller.scrollTop = scroller.scrollHeight;
  }, [messages]);

  function handleSend({ body, attachments }: ProjectChatComposerSubmit) {
    const now = new Date();
    const nextMessage: ProjectChatMessageData = {
      id: `draft-${detail.project.id}-${now.getTime()}`,
      role: "user",
      kind: "text",
      title: "You",
      body: body || "Attached files",
      time: now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      files:
        attachments.length > 0
          ? attachments.map((attachment) => attachment.path)
          : undefined,
    };

    setMessages((currentMessages) => [...currentMessages, nextMessage]);
  }

  return (
    <section
      className="grid h-full min-h-0 min-w-0 flex-1 grid-rows-[auto_1fr_auto] overflow-hidden bg-background"
      data-testid="project-chat-shell"
    >
      <ProjectTaskHeader detail={{ ...detail, mode }} />
      <div
        ref={scrollerRef}
        className="min-h-0 overflow-auto px-4 py-4 lg:px-5"
        data-testid="project-chat-scroller"
      >
        <div className="mx-auto flex max-w-4xl flex-col gap-3">
          {messages.map((message) => (
            <ProjectChatMessage key={message.id} message={message} />
          ))}
        </div>
      </div>
      <ProjectChatComposer
        detail={detail}
        mode={mode}
        model={detail.model}
        onModeChange={setMode}
        onSend={handleSend}
      />
    </section>
  );
}
