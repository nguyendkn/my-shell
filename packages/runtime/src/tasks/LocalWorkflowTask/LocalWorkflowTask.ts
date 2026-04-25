// Stubs for the workflow-task subsystem. The real implementation lives
// behind the WORKFLOW_SCRIPTS feature flag and is dynamically required;
// these exports keep the type-checker happy on the BackgroundTasksDialog
// fallback path (feature off → all functions are no-ops returning null).

import type { TaskStatus } from "../../Task.js";

export type LocalWorkflowTaskState = {
  readonly id: string;
  readonly type: "local_workflow";
  readonly status: TaskStatus;
  readonly description: string;
  readonly summary?: string;
  readonly toolUseId?: string;
  readonly startTime: number;
  readonly endTime?: number;
  readonly outputFile: string;
  readonly outputOffset: number;
  readonly notified: boolean;
};

// Loose AppState setter signature shared with callers — the real workflow
// module accepts the React useState dispatcher; the stub just discards it.
type SetAppStateLike = (...args: readonly unknown[]) => void;

export function isLocalWorkflowTask(_value: unknown): boolean {
  return false;
}

export function killWorkflowTask(_taskId: string, _setAppState?: SetAppStateLike): Promise<void> {
  return Promise.resolve();
}

export function skipWorkflowAgent(
  _taskId: string,
  _agentId?: string,
  _setAppState?: SetAppStateLike,
): Promise<void> {
  return Promise.resolve();
}

export function retryWorkflowAgent(
  _taskId: string,
  _agentId?: string,
  _setAppState?: SetAppStateLike,
): Promise<void> {
  return Promise.resolve();
}
