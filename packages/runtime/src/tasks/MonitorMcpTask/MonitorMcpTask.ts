import type { AppState } from "src/state/AppState.js";
import type { TaskStatus } from "../../Task.js";

// Stubs for the monitor-mcp task subsystem (gated by MONITOR_TOOL feature
// flag). Like LocalWorkflowTask above, these exports keep the type-checker
// happy when the feature is off and the dynamic require returns null.

export type MonitorMcpTaskState = {
  readonly id: string;
  readonly type: "monitor_mcp";
  readonly status: TaskStatus;
  readonly description: string;
  readonly toolUseId?: string;
  readonly startTime: number;
  readonly endTime?: number;
  readonly outputFile: string;
  readonly outputOffset: number;
  readonly notified: boolean;
  readonly isBackgrounded?: boolean;
};

export function isMonitorMcpTask(_value: unknown): boolean {
  return false;
}

export function killMonitorMcp(
  _taskId: string,
  _setAppState: (updater: (prev: AppState) => AppState) => void,
): Promise<void> {
  return Promise.resolve();
}

export function killMonitorMcpTasksForAgent(
  _agentId: string,
  _getAppState: () => AppState,
  _setAppState: (updater: (prev: AppState) => AppState) => void,
): Promise<void> {
  return Promise.resolve();
}
