// Stub for ant-only assistant command. External builds use the standard
// command surface; this stub keeps dynamic imports type-safe.

import { Box, Text } from "ink";
import type { ReactElement } from "react";

export interface AssistantCommandOptions {
  readonly prompt?: string;
}

export async function runAssistantCommand(_opts?: AssistantCommandOptions): Promise<void> {
  throw new Error("assistant command is not available in this build");
}

// `claude assistant` install-wizard surface — present for type-checking only;
// external builds never reach the wizard at runtime.
export interface NewInstallWizardProps {
  readonly defaultDir: string;
  readonly onInstalled: (dir: string) => void;
  readonly onCancel: () => void;
  readonly onError: (message: string) => void;
}

export function NewInstallWizard(_props: NewInstallWizardProps): ReactElement {
  return (
    <Box>
      <Text>Assistant install wizard unavailable in this build.</Text>
    </Box>
  );
}

export async function computeDefaultInstallDir(): Promise<string> {
  return "";
}

export default runAssistantCommand;
