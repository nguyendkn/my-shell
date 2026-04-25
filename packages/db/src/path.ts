import { join } from "node:path";

const DEFAULT_APP_NAME = "FPTClaw";
const DEFAULT_DB_FILE_NAME = "fptclaw.sqlite";

export type DatabasePathOptions = {
  appName?: string;
  databasePath?: string;
  fileName?: string;
};

function getDataHome() {
  if (process.platform === "win32") {
    return process.env.LOCALAPPDATA ?? process.env.APPDATA ?? process.cwd();
  }

  if (process.platform === "darwin") {
    return process.env.HOME
      ? join(process.env.HOME, "Library", "Application Support")
      : process.cwd();
  }

  return (
    process.env.XDG_DATA_HOME ??
    (process.env.HOME
      ? join(process.env.HOME, ".local", "share")
      : process.cwd())
  );
}

export function getDatabasePath(options: DatabasePathOptions = {}) {
  const override =
    options.databasePath ??
    process.env.FPTCLAW_DB_PATH?.trim() ??
    process.env.DATABASE_PATH?.trim();

  if (override) {
    return override;
  }

  const appName =
    options.appName ?? process.env.FPTCLAW_DB_APP_NAME ?? DEFAULT_APP_NAME;
  const fileName =
    options.fileName ??
    process.env.FPTCLAW_DB_FILE_NAME ??
    DEFAULT_DB_FILE_NAME;

  return join(getDataHome(), appName, fileName);
}
