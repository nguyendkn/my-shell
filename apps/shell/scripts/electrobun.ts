import { spawn } from "bun";
import { existsSync } from "node:fs";
import path from "node:path";

const env = { ...process.env };
const args = process.argv.slice(2);

if (process.platform === "win32") {
  const systemRoot = env.SystemRoot ?? "C:\\Windows";
  env.PATH = `${systemRoot}\\System32;${env.PATH ?? ""}`;
}

async function cleanWindowsBuildOutput() {
  if (process.platform !== "win32" || args[0] !== "build") {
    return;
  }

  const buildOutputDir = path.resolve(import.meta.dir, "../build/dev-win-x64");

  if (!existsSync(buildOutputDir)) {
    return;
  }

  const escapedBuildOutputDir = buildOutputDir.replace(/'/g, "''");
  const cleanupCommand = [
    `$target = '${escapedBuildOutputDir}'`,
    "if (Test-Path -LiteralPath $target) { Remove-Item -LiteralPath $target -Recurse -Force }",
  ].join("; ");

  const cleanup = spawn(
    [
      "powershell.exe",
      "-NoLogo",
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-Command",
      cleanupCommand,
    ],
    {
      env,
      stdin: "ignore",
      stdout: "inherit",
      stderr: "inherit",
    },
  );
  const exitCode = await cleanup.exited;

  if (exitCode !== 0) {
    process.exit(exitCode);
  }
}

await cleanWindowsBuildOutput();

const subprocess = spawn(["electrobun", ...args], {
  env,
  stdin: "inherit",
  stdout: "inherit",
  stderr: "inherit",
});

process.exit(await subprocess.exited);
