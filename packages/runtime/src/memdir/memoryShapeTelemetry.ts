// Stub: memory-shape telemetry. No-op in external builds.
export function recordMemoryShapeTelemetry(): void {}
export function logMemoryWriteShape(
  _toolName?: string,
  _toolInput?: unknown,
  _filePath?: string,
  _scope?: unknown,
): void {}

export function logMemoryRecallShape(_memories?: unknown, _selected?: unknown): void {}
