"use client";

import * as React from "react";
import {
  Terminal as WTermTerminal,
  useTerminal,
  type TerminalHandle,
  type TerminalProps as WTermTerminalProps,
} from "@wterm/react";

import { cn } from "@repo/ui/lib/utils";

type TerminalTheme =
  | "default"
  | "solarized-dark"
  | "monokai"
  | "light"
  | (string & {});

type TerminalProps = Omit<WTermTerminalProps, "theme"> & {
  theme?: TerminalTheme;
};

const Terminal = React.forwardRef<TerminalHandle, TerminalProps>(
  (
    {
      className,
      theme = "default",
      autoResize = true,
      cursorBlink = true,
      ...props
    },
    ref,
  ) => {
    return (
      <WTermTerminal
        {...props}
        ref={ref}
        data-slot="terminal"
        theme={theme === "default" ? undefined : theme}
        autoResize={autoResize}
        cursorBlink={cursorBlink}
        className={cn("min-h-60 w-full", className)}
      />
    );
  },
);
Terminal.displayName = "Terminal";

export { Terminal, useTerminal };
export type { TerminalHandle, TerminalProps, TerminalTheme };
