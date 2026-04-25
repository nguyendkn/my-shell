// Stub devtools entry — disabled in external builds.

export interface DevtoolsHandle {
  readonly close: () => Promise<void>;
}

export async function startDevtools(): Promise<DevtoolsHandle | null> {
  return null;
}

export default { startDevtools };
