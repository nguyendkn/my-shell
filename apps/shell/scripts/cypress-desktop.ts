import { spawn } from "bun";
import { mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const appDir = path.resolve(import.meta.dir, "..");
const desktopTestPort = Number(
  process.env.FPTCLAW_DESKTOP_TEST_PORT ?? "45731",
);
const desktopTestBaseUrl = `http://127.0.0.1:${desktopTestPort}`;
const defaultProjectFolderPath = path.join(
  tmpdir(),
  "fptclaw-desktop-e2e",
  "selected-project",
);
const projectFolderPath =
  process.env.FPTCLAW_TEST_PROJECT_FOLDER_PATH ?? defaultProjectFolderPath;

function createEnv() {
  const env = {
    ...process.env,
    CYPRESS_SPEC_PATTERN: "cypress/desktop/**/*.cy.ts",
    FPTCLAW_DESKTOP_TEST_PORT: String(desktopTestPort),
    FPTCLAW_TEST_PROJECT_FOLDER_PATH: projectFolderPath,
  };

  if (process.platform === "win32") {
    const systemRoot = env.SystemRoot ?? "C:\\Windows";
    env.PATH = `${systemRoot}\\System32;${env.PATH ?? ""}`;
  }

  return env;
}

async function stopStaleDesktopProcesses() {
  if (process.platform !== "win32") {
    return;
  }

  const devDir = path.resolve(appDir, "build/dev-win-x64").replace(/'/g, "''");
  const command = [
    `$devDir = [System.IO.Path]::GetFullPath('${devDir}')`,
    "$processes = Get-CimInstance Win32_Process | Where-Object { $_.ExecutablePath -and [System.IO.Path]::GetFullPath($_.ExecutablePath).StartsWith($devDir, [System.StringComparison]::OrdinalIgnoreCase) }",
    "$processes | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }",
  ].join("; ");

  const subprocess = spawn(
    [
      "powershell.exe",
      "-NoLogo",
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-Command",
      command,
    ],
    {
      cwd: appDir,
      env: createEnv(),
      stdin: "ignore",
      stdout: "inherit",
      stderr: "inherit",
    },
  );

  await subprocess.exited;
}

async function waitForDesktopHealth() {
  const startedAt = Date.now();
  const timeoutMs = 60_000;

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(`${desktopTestBaseUrl}/health`);
      const body = (await response.json()) as { domReady?: unknown };

      if (response.ok && body.domReady === true) {
        return;
      }
    } catch {
      // The desktop process may still be building or starting its test server.
    }

    await Bun.sleep(250);
  }

  throw new Error(
    `Desktop test server did not become ready at ${desktopTestBaseUrl}.`,
  );
}

async function shutdownDesktop(processId?: number) {
  try {
    await fetch(`${desktopTestBaseUrl}/quit`, { method: "POST" });
  } catch {
    // The process may already be gone after a failed launch.
  }

  await Bun.sleep(500);

  if (!processId) {
    return;
  }

  if (process.platform === "win32") {
    const subprocess = spawn(
      ["taskkill.exe", "/PID", String(processId), "/T", "/F"],
      {
        stdin: "ignore",
        stdout: "ignore",
        stderr: "ignore",
      },
    );

    await subprocess.exited;
    return;
  }

  try {
    process.kill(processId);
  } catch {
    // Already stopped.
  }
}

mkdirSync(projectFolderPath, { recursive: true });
await stopStaleDesktopProcesses();

const env = createEnv();
const desktopProcess = spawn(["bun", "run", "desktop:dev"], {
  cwd: appDir,
  env,
  stdin: "ignore",
  stdout: "inherit",
  stderr: "inherit",
});

let exitCode = 1;

try {
  await waitForDesktopHealth();

  const cypressProcess = spawn(
    [
      "bun",
      "run",
      "cy:run",
      "--spec",
      "cypress/desktop/**/*.cy.ts",
      "--config",
      `baseUrl=${desktopTestBaseUrl}`,
    ],
    {
      cwd: appDir,
      env,
      stdin: "inherit",
      stdout: "inherit",
      stderr: "inherit",
    },
  );

  exitCode = await cypressProcess.exited;
} finally {
  await shutdownDesktop(desktopProcess.pid);
}

process.exit(exitCode);
