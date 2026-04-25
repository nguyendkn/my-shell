// Stub component for ant-only SnapshotUpdateDialog.
// External builds never render this dialog.

import { Box, Text } from "ink";
import type { ReactElement } from "react";
import type { AgentMemoryScope } from "../../tools/AgentTool/agentMemory.js";

export interface SnapshotUpdateDialogProps {
  readonly agentType: string;
  readonly scope: AgentMemoryScope;
  readonly snapshotTimestamp: string;
  readonly onComplete: (result: "merge" | "keep" | "replace") => void;
  readonly onCancel: () => void;
}

export function SnapshotUpdateDialog(_props: SnapshotUpdateDialogProps): ReactElement {
  return (
    <Box>
      <Text>Snapshot dialog unavailable in this build.</Text>
    </Box>
  );
}

export function buildMergePrompt(_agentType: string, _scope: string): string {
  return "";
}

export default SnapshotUpdateDialog;
