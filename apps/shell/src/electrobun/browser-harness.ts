import {
  createBrowserHarnessTaskId,
  createBrowserHarnessTeamPlan,
  normalizeBrowserHarnessMode,
  parseBrowserHarnessPrompt,
  type BrowserHarnessTeamPlan,
  type BrowserHarnessWorkerPlan,
  type BrowserHarnessWorkerReport,
} from "@repo/browser";
import { existsSync, statSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  createProjectBrowserProfile,
  loadProjectBrowserProfiles,
  updateProjectBrowserProfile,
  warmProjectBrowserProfile,
} from "./browser-profiles";
import type { ProjectBrowserProfile } from "./browser-profiles-types";
import type {
  ProjectBrowserHarnessCancelParams,
  ProjectBrowserHarnessCancelResult,
  ProjectBrowserHarnessEvent,
  ProjectBrowserHarnessTaskParams,
  ProjectBrowserHarnessTaskResult,
} from "./browser-harness-types";
import { traceRuntimeBridge } from "./runtime-paths";

type BrowserProcess = ReturnType<typeof Bun.spawn>;

type WorkerProcess = {
  agentId: string;
  profilePath: string;
  process: BrowserProcess;
};

type BrowserHarnessSession = {
  params: ProjectBrowserHarnessTaskParams;
  taskId: string;
  sessionId: string;
  startedAt: number;
  cwd: string | null;
  canceled: boolean;
  processes: Map<string, WorkerProcess>;
  profiles: Map<string, ProjectBrowserProfile>;
  plan: BrowserHarnessTeamPlan | null;
};

type BrowserHarnessBridgeOptions = {
  emit: (event: ProjectBrowserHarnessEvent) => void;
};

type ProcessTitleCheck = {
  ok: boolean;
  alive: boolean;
  commandLineHasTitle: boolean;
  commandLineHasProfile: boolean;
  mainWindowTitle: string | null;
  provider: string;
};

const WORKER_SETTLE_MS = 1_200;

function isDirectory(value: string) {
  try {
    return statSync(value).isDirectory();
  } catch {
    return false;
  }
}

function resolveProjectFolder(cwd?: string) {
  const value = cwd?.trim();

  if (!value || !isDirectory(value)) {
    return null;
  }

  return value;
}

function createBaseEvent(session: BrowserHarnessSession) {
  return {
    id: crypto.randomUUID(),
    projectId: session.params.projectId,
    taskId: session.taskId,
    sessionId: session.sessionId,
    timestamp: new Date().toISOString(),
  };
}

function toSingleQuotedPowerShell(value: string) {
  return `'${value.replace(/'/g, "''")}'`;
}

function getWindowsPowerShellPath() {
  const systemRoot = process.env.SystemRoot ?? "C:\\Windows";
  const bundled = path.join(
    systemRoot,
    "System32",
    "WindowsPowerShell",
    "v1.0",
    "powershell.exe",
  );

  return existsSync(bundled) ? bundled : "powershell.exe";
}

function getChromiumExecutable() {
  if (process.platform === "win32") {
    const candidates = [
      path.join(
        process.env["ProgramFiles(x86)"] ?? "C:\\Program Files (x86)",
        "Microsoft",
        "Edge",
        "Application",
        "msedge.exe",
      ),
      path.join(
        process.env.ProgramFiles ?? "C:\\Program Files",
        "Microsoft",
        "Edge",
        "Application",
        "msedge.exe",
      ),
      path.join(
        process.env.ProgramFiles ?? "C:\\Program Files",
        "Google",
        "Chrome",
        "Application",
        "chrome.exe",
      ),
      path.join(
        process.env["ProgramFiles(x86)"] ?? "C:\\Program Files (x86)",
        "Google",
        "Chrome",
        "Application",
        "chrome.exe",
      ),
    ];

    return candidates.find((candidate) => existsSync(candidate)) ?? null;
  }

  if (process.platform === "darwin") {
    const candidates = [
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    ];

    return candidates.find((candidate) => existsSync(candidate)) ?? null;
  }

  return process.env.FPTCLAW_CHROMIUM_PATH ?? "google-chrome";
}

async function runCommand(args: string[], cwd: string, timeoutMs = 5_000) {
  const child = Bun.spawn(args, {
    cwd,
    stdin: "ignore",
    stdout: "pipe",
    stderr: "pipe",
    windowsHide: true,
  });
  const timeout = setTimeout(() => child.kill(), timeoutMs);

  try {
    const [stdout, stderr, exitCode] = await Promise.all([
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
      child.exited,
    ]);

    return { stdout, stderr, exitCode };
  } finally {
    clearTimeout(timeout);
  }
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function writeHarnessPage(
  worker: BrowserHarnessWorkerPlan,
  taskId: string,
) {
  const taskDir = path.join(worker.profilePath, "harness-runs", taskId);
  const pagePath = path.join(taskDir, "index.html");

  await mkdir(taskDir, { recursive: true });
  await writeFile(
    pagePath,
    [
      "<!doctype html>",
      '<html lang="en">',
      "<head>",
      '<meta charset="utf-8" />',
      '<meta name="viewport" content="width=device-width, initial-scale=1" />',
      `<title>${escapeHtml(worker.expectedProcessTitle)}</title>`,
      "<style>",
      "body{font-family:system-ui,-apple-system,Segoe UI,sans-serif;margin:0;background:#101418;color:#eef2f6}",
      "main{max-width:760px;margin:0 auto;padding:48px 24px}",
      "section{border:1px solid #34404d;border-radius:8px;padding:18px;background:#18202a}",
      "dl{display:grid;grid-template-columns:120px 1fr;gap:10px 16px}",
      "dt{color:#a8b3c2}dd{margin:0;word-break:break-word}",
      "</style>",
      "</head>",
      "<body>",
      "<main>",
      "<h1>FPTClaw Browser Harness</h1>",
      "<section>",
      "<dl>",
      `<dt>Task</dt><dd>${escapeHtml(taskId)}</dd>`,
      `<dt>Agent</dt><dd>${escapeHtml(worker.agentName)}</dd>`,
      `<dt>Profile</dt><dd>${escapeHtml(worker.profileName)}</dd>`,
      `<dt>Mode</dt><dd>${escapeHtml(worker.mode)}</dd>`,
      `<dt>Start</dt><dd>${escapeHtml(worker.startPoint)}</dd>`,
      `<dt>Endpoint</dt><dd>${escapeHtml(worker.endpoint)}</dd>`,
      `<dt>Goal</dt><dd>${escapeHtml(worker.goal)}</dd>`,
      "</dl>",
      "</section>",
      "</main>",
      "</body>",
      "</html>",
    ].join("\n"),
    "utf8",
  );

  return pathToFileURL(pagePath).toString();
}

async function verifyWindowsProcessTitle({
  pid,
  expectedTitle,
  profilePath,
  cwd,
  provider,
}: {
  pid: number;
  expectedTitle: string;
  profilePath: string;
  cwd: string;
  provider: string;
}): Promise<ProcessTitleCheck> {
  const command = [
    `$pidValue = ${pid}`,
    `$expected = ${toSingleQuotedPowerShell(expectedTitle)}`,
    `$profile = ${toSingleQuotedPowerShell(profilePath)}`,
    '$proc = Get-CimInstance Win32_Process -Filter "ProcessId = $pidValue" -ErrorAction SilentlyContinue',
    '$commandLine = if ($proc) { [string]$proc.CommandLine } else { "" }',
    '$windowTitle = try { [string](Get-Process -Id $pidValue -ErrorAction SilentlyContinue).MainWindowTitle } catch { "" }',
    '$hasTitle = $commandLine.Contains("--fptclaw-browser-title=" + $expected)',
    '$hasProfile = $commandLine.Contains("--user-data-dir=" + $profile)',
    '[pscustomobject]@{ alive = [bool]$proc; commandLineHasTitle = $hasTitle; commandLineHasProfile = $hasProfile; mainWindowTitle = $windowTitle; ok = ([bool]$proc -and $hasTitle -and $hasProfile) } | ConvertTo-Json -Compress',
  ].join("; ");
  const result = await runCommand(
    [
      getWindowsPowerShellPath(),
      "-NoLogo",
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-Command",
      command,
    ],
    cwd,
  );
  const parsed = JSON.parse(result.stdout || "{}") as Partial<ProcessTitleCheck>;

  return {
    ok: Boolean(parsed.ok),
    alive: Boolean(parsed.alive),
    commandLineHasTitle: Boolean(parsed.commandLineHasTitle),
    commandLineHasProfile: Boolean(parsed.commandLineHasProfile),
    mainWindowTitle: parsed.mainWindowTitle ?? null,
    provider,
  };
}

async function verifyPortableProcessTitle({
  pid,
  expectedTitle,
  profilePath,
  cwd,
  provider,
}: {
  pid: number;
  expectedTitle: string;
  profilePath: string;
  cwd: string;
  provider: string;
}): Promise<ProcessTitleCheck> {
  const result = await runCommand(["ps", "-p", String(pid), "-o", "command="], cwd);
  const commandLine = result.stdout.trim();
  const commandLineHasTitle = commandLine.includes(
    `--fptclaw-browser-title=${expectedTitle}`,
  );
  const commandLineHasProfile = commandLine.includes(
    `--user-data-dir=${profilePath}`,
  );

  return {
    ok: result.exitCode === 0 && commandLineHasTitle && commandLineHasProfile,
    alive: result.exitCode === 0,
    commandLineHasTitle,
    commandLineHasProfile,
    mainWindowTitle: null,
    provider,
  };
}

async function verifyProcessTitle(params: {
  pid: number;
  expectedTitle: string;
  profilePath: string;
  cwd: string;
  provider: string;
}) {
  if (process.platform === "win32") {
    return verifyWindowsProcessTitle(params);
  }

  return verifyPortableProcessTitle(params);
}

async function stopWorkerProcess(workerProcess: WorkerProcess, cwd: string) {
  workerProcess.process.kill();

  if (process.platform !== "win32") {
    return;
  }

  const command = [
    `$profile = ${toSingleQuotedPowerShell(workerProcess.profilePath)}`,
    '$processes = Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -and $_.CommandLine.Contains("--user-data-dir=" + $profile) }',
    "$processes | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }",
  ].join("; ");

  await runCommand(
    [
      getWindowsPowerShellPath(),
      "-NoLogo",
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-Command",
      command,
    ],
    cwd,
  ).catch(() => undefined);
}

async function launchBrowserProcess({
  session,
  worker,
}: {
  session: BrowserHarnessSession;
  worker: BrowserHarnessWorkerPlan;
}) {
  const executable = getChromiumExecutable();

  if (!executable) {
    throw new Error(
      "No Chromium-family browser was found for the local browser harness.",
    );
  }

  const startUrl = await writeHarnessPage(worker, session.taskId);
  const args = [
    executable,
    `--user-data-dir=${worker.profilePath}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-background-networking",
    "--disable-default-apps",
    "--disable-sync",
    `--app=${startUrl}`,
    `--fptclaw-browser-title=${worker.expectedProcessTitle}`,
  ];

  if (worker.mode === "headless") {
    args.splice(1, 0, "--headless=new", "--disable-gpu", "--remote-debugging-port=0");
  } else {
    args.splice(1, 0, "--new-window");
  }

  traceRuntimeBridge("browser_harness.worker.spawn", {
    taskId: session.taskId,
    agentId: worker.agentId,
    profileId: worker.profileId,
    providerId: worker.providerId,
    mode: worker.mode,
    command: args,
  });

  const child = Bun.spawn(args, {
    cwd: session.cwd ?? process.cwd(),
    env: process.env,
    stdin: "ignore",
    stdout: "ignore",
    stderr: "ignore",
    windowsHide: worker.mode === "headless",
  });

  return {
    process: child,
    provider: path.basename(executable),
  };
}

async function prepareProfiles(
  session: BrowserHarnessSession,
): Promise<ProjectBrowserProfile[]> {
  if (!session.cwd) {
    throw new Error("Project folder is unavailable.");
  }

  const parsedGoal = parseBrowserHarnessPrompt(session.params.prompt);
  const requestedProfileCount = Math.min(
    Math.max(
      session.params.profileCount ?? parsedGoal.requestedProfileCount,
      1,
    ),
    4,
  );
  const requestedIds = new Set([
    ...(session.params.profileIds ?? []),
    ...parsedGoal.requestedProfileRefs,
  ]);
  const loaded = await loadProjectBrowserProfiles({
    projectId: session.params.projectId,
    projectName: session.params.projectName,
    cwd: session.cwd,
  });

  if (!loaded.available) {
    throw new Error(loaded.error ?? "Browser profile registry is unavailable.");
  }

  const profiles = [...loaded.profiles];
  const selected = profiles.filter((profile) => {
    if (requestedIds.size === 0) {
      return true;
    }

    return (
      requestedIds.has(profile.id) ||
      requestedIds.has(profile.name.toLowerCase().replace(/\s+/g, "-"))
    );
  });

  while (selected.length < requestedProfileCount) {
    const nextIndex = profiles.length + selected.length + 1;
    const created = await createProjectBrowserProfile({
      projectId: session.params.projectId,
      projectName: session.params.projectName,
      cwd: session.cwd,
      providerId: "chrome-cdp",
      name: `Hermes browser lane ${String(nextIndex).padStart(2, "0")}`,
    });

    if (!created.ok || !created.profile) {
      throw new Error(created.error ?? "Could not create browser profile.");
    }

    profiles.push(created.profile);
    selected.push(created.profile);
  }

  const mode = normalizeBrowserHarnessMode(
    session.params.mode ?? parsedGoal.mode,
  );
  const prepared: ProjectBrowserProfile[] = [];

  for (const profile of selected.slice(0, requestedProfileCount)) {
    const profileForMode: ProjectBrowserProfile = {
      ...profile,
      headless: mode,
      status: profile.status === "needs-setup" ? "ready" : profile.status,
    };
    const warmed = await warmProjectBrowserProfile({
      projectId: session.params.projectId,
      projectName: session.params.projectName,
      cwd: session.cwd,
      profile: profileForMode,
    });

    prepared.push(warmed.profile ?? profileForMode);
  }

  return prepared;
}

async function runWorker(
  session: BrowserHarnessSession,
  worker: BrowserHarnessWorkerPlan,
  emit: BrowserHarnessBridgeOptions["emit"],
) {
  const startedAt = Date.now();
  const profile = session.profiles.get(worker.profileId);

  emit({
    ...createBaseEvent(session),
    type: "worker_state",
    agentId: worker.agentId,
    agentName: worker.agentName,
    profileId: worker.profileId,
    profileName: worker.profileName,
    state: "launching",
    summary: `${worker.agentName} launching ${worker.profileName} in ${worker.mode} mode.`,
  });

  if (!session.cwd) {
    throw new Error("Project folder is unavailable.");
  }

  try {
    const launched = await launchBrowserProcess({ session, worker });
    const workerProcess: WorkerProcess = {
      agentId: worker.agentId,
      profilePath: worker.profilePath,
      process: launched.process,
    };

    session.processes.set(worker.agentId, workerProcess);

    if (profile) {
      await updateProjectBrowserProfile({
        projectId: session.params.projectId,
        projectName: session.params.projectName,
        cwd: session.cwd,
        profile: {
          ...profile,
          headless: worker.mode,
          status: "running",
          endpoint: worker.expectedProcessTitle,
          lastUsed: new Date().toISOString(),
          notes: `${worker.agentName} is running under Hermes browser harness.`,
        },
      });
    }

    emit({
      ...createBaseEvent(session),
      type: "worker_state",
      agentId: worker.agentId,
      agentName: worker.agentName,
      profileId: worker.profileId,
      profileName: worker.profileName,
      state: "running",
      summary: `${worker.agentName} started browser process ${launched.process.pid}.`,
      pid: launched.process.pid,
    });

    await sleep(worker.mode === "headless" ? 700 : WORKER_SETTLE_MS);

    if (session.canceled) {
      throw new Error("Browser harness task was canceled.");
    }

    const titleCheck = await verifyProcessTitle({
      pid: launched.process.pid,
      expectedTitle: worker.expectedProcessTitle,
      profilePath: worker.profilePath,
      cwd: session.cwd,
      provider: launched.provider,
    });

    emit({
      ...createBaseEvent(session),
      type: "process_title",
      agentId: worker.agentId,
      profileId: worker.profileId,
      profileName: worker.profileName,
      pid: launched.process.pid,
      expectedProcessTitle: worker.expectedProcessTitle,
      observedWindowTitle: titleCheck.mainWindowTitle,
      commandLineHasTitle: titleCheck.commandLineHasTitle,
      ok: titleCheck.ok,
      provider: titleCheck.provider,
      mode: worker.mode,
    });

    const report: BrowserHarnessWorkerReport = {
      agentId: worker.agentId,
      profileId: worker.profileId,
      profileName: worker.profileName,
      pid: launched.process.pid,
      ok: titleCheck.ok,
      processTitleVerified: titleCheck.ok,
      expectedProcessTitle: worker.expectedProcessTitle,
      observedWindowTitle: titleCheck.mainWindowTitle,
      summary: titleCheck.ok
        ? `${worker.agentName} reached start point ${worker.startPoint} and verified browser process title in ${Date.now() - startedAt}ms.`
        : `${worker.agentName} started but browser process title verification failed.`,
    };

    emit({
      ...createBaseEvent(session),
      type: "worker_report",
      report,
    });
    emit({
      ...createBaseEvent(session),
      type: "worker_state",
      agentId: worker.agentId,
      agentName: worker.agentName,
      profileId: worker.profileId,
      profileName: worker.profileName,
      state: titleCheck.ok ? "reported" : "failed",
      summary: report.summary,
      pid: launched.process.pid,
    });

    await stopWorkerProcess(workerProcess, session.cwd);
    session.processes.delete(worker.agentId);

    if (profile) {
      await updateProjectBrowserProfile({
        projectId: session.params.projectId,
        projectName: session.params.projectName,
        cwd: session.cwd,
        profile: {
          ...profile,
          headless: worker.mode,
          status: titleCheck.ok ? "ready" : "needs-setup",
          endpoint: titleCheck.ok
            ? `Validated ${worker.expectedProcessTitle}`
            : "Browser process title verification failed",
          lastUsed: new Date().toISOString(),
          notes: titleCheck.ok
            ? "Hermes browser harness completed and closed the process after validation."
            : "Hermes browser harness could not validate the browser process title.",
        },
      });
    }

    return report;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Browser worker failed.";
    const report: BrowserHarnessWorkerReport = {
      agentId: worker.agentId,
      profileId: worker.profileId,
      profileName: worker.profileName,
      pid: null,
      ok: false,
      processTitleVerified: false,
      expectedProcessTitle: worker.expectedProcessTitle,
      observedWindowTitle: null,
      summary: message,
    };

    emit({
      ...createBaseEvent(session),
      type: "worker_report",
      report,
    });
    emit({
      ...createBaseEvent(session),
      type: "worker_state",
      agentId: worker.agentId,
      agentName: worker.agentName,
      profileId: worker.profileId,
      profileName: worker.profileName,
      state: "failed",
      summary: message,
    });

    return report;
  }
}

export function createProjectBrowserHarnessBridge({
  emit,
}: BrowserHarnessBridgeOptions) {
  const sessions = new Map<string, BrowserHarnessSession>();

  function startTask(
    params: ProjectBrowserHarnessTaskParams,
  ): ProjectBrowserHarnessTaskResult {
    const session: BrowserHarnessSession = {
      params,
      taskId: createBrowserHarnessTaskId("hermes-browser"),
      sessionId: crypto.randomUUID(),
      startedAt: Date.now(),
      cwd: resolveProjectFolder(params.cwd),
      canceled: false,
      processes: new Map(),
      profiles: new Map(),
      plan: null,
    };

    sessions.set(session.taskId, session);
    emit({
      ...createBaseEvent(session),
      type: "session_state",
      state: "starting",
      summary: "Hermes browser harness starting.",
    });

    void runTask(session).finally(() => {
      sessions.delete(session.taskId);
    });

    return {
      accepted: true,
      taskId: session.taskId,
      sessionId: session.sessionId,
    };
  }

  async function runTask(session: BrowserHarnessSession) {
    const errors: string[] = [];

    try {
      if (!session.cwd) {
        throw new Error(
          "Project folder is unavailable. Open a local project folder before launching browser profiles.",
        );
      }

      emit({
        ...createBaseEvent(session),
        type: "session_state",
        state: "planning",
        summary: "Hermes lead is selecting browser profiles.",
      });

      const goal = parseBrowserHarnessPrompt(session.params.prompt);
      const profiles = await prepareProfiles(session);

      for (const profile of profiles) {
        session.profiles.set(profile.id, profile);
      }

      const plan = createBrowserHarnessTeamPlan({
        taskId: session.taskId,
        goal: {
          ...goal,
          mode: normalizeBrowserHarnessMode(session.params.mode ?? goal.mode),
          requestedProfileCount:
            session.params.profileCount ?? goal.requestedProfileCount,
        },
        profiles: profiles.map((profile) => ({
          id: profile.id,
          name: profile.name,
          providerId: profile.providerId,
          profilePath: profile.profilePath,
        })),
      });

      session.plan = plan;

      traceRuntimeBridge("browser_harness.plan", {
        projectId: session.params.projectId,
        taskId: session.taskId,
        goal: plan.goal,
        startPoint: plan.startPoint,
        endpoint: plan.endpoint,
        mode: plan.mode,
        workers: plan.workers.map((worker) => ({
          agentId: worker.agentId,
          profileId: worker.profileId,
          profileName: worker.profileName,
          providerId: worker.providerId,
        })),
      });

      emit({
        ...createBaseEvent(session),
        type: "lead_plan",
        plan,
      });
      emit({
        ...createBaseEvent(session),
        type: "session_state",
        state: "running",
        summary: `${plan.leadName} spawned ${plan.workers.length} browser agents.`,
      });

      const reports = await Promise.all(
        plan.workers.map((worker) => runWorker(session, worker, emit)),
      );
      const ok = !session.canceled && reports.every((report) => report.ok);
      const summary = ok
        ? `Lead validation passed: ${reports.length}/${reports.length} browser agents reported verified process titles.`
        : `Lead validation failed: ${
            reports.filter((report) => report.ok).length
          }/${reports.length} browser agents reported verified process titles.`;

      emit({
        ...createBaseEvent(session),
        type: "session_state",
        state: "validating",
        summary: "Hermes lead is validating worker reports.",
      });
      emit({
        ...createBaseEvent(session),
        type: "lead_validation",
        ok,
        summary,
        reports,
      });
      emit({
        ...createBaseEvent(session),
        type: "result",
        ok,
        summary,
        durationMs: Date.now() - session.startedAt,
        errors: ok ? undefined : reports.filter((report) => !report.ok).map((report) => report.summary),
      });
      emit({
        ...createBaseEvent(session),
        type: "session_state",
        state: ok ? "completed" : "failed",
        summary: ok ? "Browser harness completed." : "Browser harness failed.",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Browser harness failed.";

      errors.push(message);
      traceRuntimeBridge("browser_harness.error", {
        taskId: session.taskId,
        error,
      });
      emit({
        ...createBaseEvent(session),
        type: "result",
        ok: false,
        summary: message,
        durationMs: Date.now() - session.startedAt,
        errors,
      });
      emit({
        ...createBaseEvent(session),
        type: "session_state",
        state: "failed",
        summary: message,
      });
    } finally {
      await Promise.all(
        Array.from(session.processes.values()).map((workerProcess) =>
          session.cwd
            ? stopWorkerProcess(workerProcess, session.cwd)
            : Promise.resolve(),
        ),
      );
      session.processes.clear();
    }
  }

  function cancelTask({
    taskId,
  }: ProjectBrowserHarnessCancelParams): ProjectBrowserHarnessCancelResult {
    const session = sessions.get(taskId);

    if (!session) {
      return { canceled: false };
    }

    session.canceled = true;
    emit({
      ...createBaseEvent(session),
      type: "session_state",
      state: "canceled",
      summary: "Browser harness canceled.",
    });

    if (session.cwd) {
      void Promise.all(
        Array.from(session.processes.values()).map((workerProcess) =>
          stopWorkerProcess(workerProcess, session.cwd!),
        ),
      );
    }

    return { canceled: true };
  }

  function stopAll() {
    for (const taskId of sessions.keys()) {
      cancelTask({ taskId });
    }
  }

  return {
    cancelTask,
    startTask,
    stopAll,
  };
}
