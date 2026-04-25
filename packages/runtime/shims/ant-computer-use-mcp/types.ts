export const DEFAULT_GRANT_FLAGS = {
  accessibility: false,
  screenRecording: false,
};

// Coordinate mode the host adapter operates in. screen / viewport are the
// modes the runtime targets; pixels is the legacy alias used by some
// dynamic config sources.
export type CoordinateMode = "screen" | "viewport" | "pixels";
export type CuSubGates = Record<string, boolean>;
export type Logger = {
  silly?(message: string, ...args: unknown[]): void;
  debug?(message: string, ...args: unknown[]): void;
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
};
// Executor surface the host adapter exposes for tool dispatch. The shim
// only needs the few methods the runtime calls (capabilities + listInstalledApps);
// other native methods are open via the index signature.
export type Executor = {
  capabilities?: Record<string, boolean>;
  listInstalledApps?: () => Promise<string[]>;
  [key: string]: unknown;
};

export type ComputerUseHostAdapter = {
  logger?: Logger;
  executor?: Executor;
  serverName?: string;
  ensureOsPermissions?: () => Promise<{
    granted: boolean;
    accessibility?: boolean;
    screenRecording?: boolean;
  }>;
  isDisabled?: () => boolean;
  getSubGates?: () => CuSubGates;
  getAutoUnhideEnabled?: () => boolean;
  cropRawPatch?: (...args: unknown[]) => unknown;
  [key: string]: unknown;
};
export type CuPermissionRequest = {
  apps?: Array<{ bundleId?: string; displayName?: string }>;
  flags?: Record<string, boolean>;
  tccState?: { accessibility?: boolean; screenRecording?: boolean };
  [key: string]: unknown;
};
export type CuPermissionResponse = {
  granted: Array<{ bundleId?: string; displayName?: string; grantedAt?: string }>;
  denied: Array<{ bundleId?: string; displayName?: string }>;
  flags: Record<string, boolean>;
};
