// Stub for ant-only CLI handlers. All entry points throw at runtime if invoked
// because external builds never reach these branches (gated upstream).

type Handler = (...args: readonly unknown[]) => Promise<unknown>;

const notImplemented =
  (name: string): Handler =>
  async () => {
    throw new Error(`ant handler '${name}' is not available in this build`);
  };

export const logHandler = notImplemented("logHandler");
export const errorHandler = notImplemented("errorHandler");
export const exportHandler = notImplemented("exportHandler");
export const taskCreateHandler = notImplemented("taskCreateHandler");
export const taskListHandler = notImplemented("taskListHandler");
export const taskGetHandler = notImplemented("taskGetHandler");
export const taskUpdateHandler = notImplemented("taskUpdateHandler");
export const taskDirHandler = notImplemented("taskDirHandler");
export const completionHandler = notImplemented("completionHandler");
