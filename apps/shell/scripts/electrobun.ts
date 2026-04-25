import { spawn } from "bun";

const env = { ...process.env };

if (process.platform === "win32") {
  const systemRoot = env.SystemRoot ?? "C:\\Windows";
  env.PATH = `${systemRoot}\\System32;${env.PATH ?? ""}`;
}

const subprocess = spawn(["electrobun", ...process.argv.slice(2)], {
  env,
  stdin: "inherit",
  stdout: "inherit",
  stderr: "inherit",
});

process.exit(await subprocess.exited);
